'use strict';

const repository = require('./purchases.repository');
const db = require('../../config/db');
const promotionsService = require('../promotions/promotions.service');

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function roundMoney(value) {
  return Math.round(toNumber(value) * 100) / 100;
}

async function nextReceiptNumberTx(tx, shopId) {
  const seq = await tx.receiptSequence.upsert({
    where: { shopId },
    create: { shopId, prefix: 'INV', nextNumber: 2, padding: 6 },
    update: { nextNumber: { increment: 1 } },
  });
  const number = Math.max(1, Number(seq.nextNumber) - 1);
  return `${seq.prefix}-${String(number).padStart(seq.padding, '0')}`;
}

async function getOpenShiftIdTx(tx, shopId, userId, explicitShiftId) {
  if (explicitShiftId) {
    const shift = await tx.registerShift.findFirst({ where: { id: explicitShiftId, shopId, status: 'open' } });
    if (!shift) throw Object.assign(new Error('Open register shift not found'), { status: 400 });
    return shift.id;
  }

  const shift = await tx.registerShift.findFirst({
    where: { shopId, userId, status: 'open' },
    orderBy: { openedAt: 'desc' },
  });
  return shift?.id || null;
}

async function list(shopId, query) {
  return repository.findAll(shopId, query);
}

async function getById(shopId, id) {
  const purchase = await repository.findById(id, shopId);
  if (!purchase) throw Object.assign(new Error('Purchase not found'), { status: 404 });
  return purchase;
}

/**
 * Records a purchase and awards loyalty points based on the shop's points rule.
 */
async function create(shopId, data) {
  const customer = await db.customer.findFirst({ where: { id: data.customerId, shopId } });
  if (!customer) throw Object.assign(new Error('Customer not found'), { status: 404 });

  const settings = await db.shopSettings.findUnique({ where: { shopId } });
  const pointsPerUnit = settings?.pointsPerAmount ? Number(settings.pointsPerAmount) : 100;

  const items = Array.isArray(data.items) ? data.items : null;
  const couponCode = data.couponCode ? String(data.couponCode).trim().toUpperCase() : null;

  const computedAmount = items
    ? items.reduce((sum, item) => sum + Number(item.unitPrice) * Number(item.quantity), 0)
    : Number(data.amount);

  if (!Number.isFinite(computedAmount) || computedAmount <= 0) {
    throw Object.assign(new Error('Invalid purchase amount'), { status: 400 });
  }

  // Manager override check (price overrides)
  if (items) {
    const productIds = [...new Set(items.map((i) => i.productId).filter(Boolean))];
    if (productIds.length > 0) {
      const products = await db.product.findMany({
        where: { shopId, id: { in: productIds } },
        select: { id: true, price: true },
      });
      const byId = new Map(products.map((p) => [p.id, p]));

      const hasOverride = items.some((it) => {
        if (!it.productId) return false;
        const p = byId.get(it.productId);
        if (!p) return false;
        const expected = Number(p.price);
        const given = Number(it.unitPrice);
        if (!Number.isFinite(expected) || !Number.isFinite(given)) return false;
        return Math.abs(expected - given) > 0.009;
      });

      if (hasOverride) {
        if (!data.managerPassword) {
          throw Object.assign(new Error('Manager password required for price override'), { status: 403 });
        }
        const ok = await promotionsService.verifyOwnerPassword(shopId, data.managerPassword);
        if (!ok) throw Object.assign(new Error('Invalid manager password'), { status: 403 });
      }
    }
  }

  // Points are calculated from the final (net) amount (after promotions).
  // For legacy `amount` purchases, that is `computedAmount`.

  const purchase = await db.$transaction(async (tx) => {
    const txProductIds = items ? [...new Set(items.map((i) => i.productId).filter(Boolean))] : [];
    const txVariantIds = items ? [...new Set(items.map((i) => i.variantId).filter(Boolean))] : [];
    const txProducts = txProductIds.length
      ? await tx.product.findMany({
          where: { shopId, id: { in: txProductIds } },
          select: { id: true, price: true, taxRate: true, taxMode: true, trackInventory: true, stockOnHand: true, name: true },
        })
      : [];
    const txVariants = txVariantIds.length
      ? await tx.productVariant.findMany({
          where: { shopId, id: { in: txVariantIds } },
          select: { id: true, productId: true, price: true, stockOnHand: true, name: true },
        })
      : [];
    const txProductById = new Map(txProducts.map((p) => [p.id, p]));
    const txVariantById = new Map(txVariants.map((v) => [v.id, v]));

    if (items && (txProductIds.length > 0 || txVariantIds.length > 0)) {
      const qtyByProduct = new Map();
      const qtyByVariant = new Map();
      for (const item of items) {
        if (item.variantId) {
          qtyByVariant.set(item.variantId, (qtyByVariant.get(item.variantId) || 0) + Number(item.quantity || 0));
          continue;
        }
        if (!item.productId) continue;
        qtyByProduct.set(item.productId, (qtyByProduct.get(item.productId) || 0) + Number(item.quantity || 0));
      }

      for (const [productId, quantity] of qtyByProduct.entries()) {
        const product = txProductById.get(productId);
        if (!product) throw Object.assign(new Error('Product not found'), { status: 404 });
        if (product.trackInventory && product.stockOnHand < quantity) {
          throw Object.assign(new Error(`Insufficient stock for ${product.name}`), { status: 400 });
        }
      }
      for (const [variantId, quantity] of qtyByVariant.entries()) {
        const variant = txVariantById.get(variantId);
        if (!variant) throw Object.assign(new Error('Product variant not found'), { status: 404 });
        if (variant.stockOnHand < quantity) {
          throw Object.assign(new Error(`Insufficient stock for ${variant.name}`), { status: 400 });
        }
      }
    }

    let perLineDiscountTotal = [];
    let lineSubtotals = [];
    let appliedPromotions = [];
    let subtotal = computedAmount;
    let discountTotal = 0;
    let finalAmount = computedAmount;
    if (items) {
      const applied = await promotionsService.applyToPurchaseTx(tx, shopId, data.customerId, {
        items,
        couponCode,
        at: new Date(),
      });
      perLineDiscountTotal = applied.perLineDiscountTotal;
      lineSubtotals = applied.lineSubtotals;
      appliedPromotions = applied.appliedPromotions;
      subtotal = applied.totals.subtotal;
      discountTotal = applied.totals.discountTotal;
      finalAmount = applied.totals.total;
    }

    let pointsDiscountValue = 0;
    const redemptionPoints = Number(data.redemptionPoints) || 0;
    if (redemptionPoints > 0) {
      if (settings?.maxRedeemMode === 'flat_amount') {
        pointsDiscountValue = redemptionPoints / Number(settings?.redemptionValue || 500);
      } else if (settings?.maxRedeemMode === 'percent_of_bill') {
        pointsDiscountValue = (Number(settings?.redemptionValue || 10) / 100) * subtotal;
      }
      if (pointsDiscountValue > finalAmount) pointsDiscountValue = finalAmount;
      finalAmount -= pointsDiscountValue;
      discountTotal += pointsDiscountValue;
    }


    const lineTaxes = items
      ? items.map((it, idx) => {
          const lineSubtotal = Number(lineSubtotals[idx] ?? Number(it.unitPrice) * Number(it.quantity));
          const discountAmount = Number(perLineDiscountTotal[idx] ?? 0);
          const lineTotal = Math.max(0, lineSubtotal - discountAmount);
          const product = it.productId ? txProductById.get(it.productId) : null;
          const rate = toNumber(it.taxRate ?? product?.taxRate, 0);
          const mode = it.taxMode || product?.taxMode || 'exclusive';
          if (rate <= 0) return { rate: 0, amount: 0, mode };
          const taxAmount = mode === 'inclusive'
            ? lineTotal - (lineTotal / (1 + rate / 100))
            : lineTotal * (rate / 100);
          return { rate, amount: roundMoney(taxAmount), mode };
        })
      : [];
    const taxTotal = roundMoney(lineTaxes.reduce((sum, t) => sum + t.amount, 0));
    const serviceCharge = roundMoney(data.serviceCharge || 0);
    const taxableAddOn = items
      ? lineTaxes.reduce((sum, t) => sum + (t.mode === 'exclusive' ? t.amount : 0), 0)
      : 0;
    const grandTotal = roundMoney(finalAmount + taxableAddOn + serviceCharge);
    const receiptNumber = await nextReceiptNumberTx(tx, shopId);
    const shiftId = await getOpenShiftIdTx(tx, shopId, data.userId, data.shiftId || null);
    const paymentRows = Array.isArray(data.payments) && data.payments.length > 0
      ? data.payments
      : [{
          tenderType: data.paymentMethod || 'cash',
          amount: data.paidAmount != null ? Number(data.paidAmount) : grandTotal,
          reference: data.reference || null,
          status: 'captured',
          terminalId: data.terminalId || null,
        }];
    const capturedPaymentTotal = roundMoney(paymentRows
      .filter((pmt) => !pmt.status || pmt.status === 'captured' || pmt.status === 'authorized')
      .reduce((sum, pmt) => sum + Number(pmt.amount || 0), 0));
    if (capturedPaymentTotal + 0.009 < grandTotal) {
      throw Object.assign(new Error('Payment total is less than sale total'), { status: 400 });
    }

    const pointsEarned = Math.floor(grandTotal / pointsPerUnit);

    const p = await tx.purchase.create({
      data: {
        shopId,
        customerId: data.customerId,
        userId: data.userId,
        subtotal,
        discountTotal,
        taxTotal,
        serviceCharge,
        amount: grandTotal,
        pointsEarned,
        pointsRedeemed: redemptionPoints,
        receiptNumber,
        paymentStatus: capturedPaymentTotal >= grandTotal ? 'captured' : 'pending',
        terminalId: data.terminalId || null,
        shiftId,
        heldOrderId: data.heldOrderId || null,
        ...(items
          ? {
              items: {
                create: items.map((it, idx) => {
                  const lineSubtotal = Number(lineSubtotals[idx] ?? Number(it.unitPrice) * Number(it.quantity));
                  const discountAmount = Number(perLineDiscountTotal[idx] ?? 0);
                  const lineTotal = Math.max(0, lineSubtotal - discountAmount);
                  const qty = Number(it.quantity);
                  const finalUnit = qty > 0 ? lineTotal / qty : Number(it.unitPrice);
                  const originalUnitPrice = it.productId ? Number(txProductById.get(it.productId)?.price ?? it.unitPrice) : null;
                  const taxInfo = lineTaxes[idx] || { rate: 0, amount: 0 };
                  return {
                    productId: it.productId || null,
                    variantId: it.variantId || null,
                    name: it.name,
                    sku: it.sku || null,
                    originalUnitPrice,
                    unitPrice: it.unitPrice,
                    discountAmount,
                    taxRate: taxInfo.rate,
                    taxAmount: taxInfo.amount,
                    finalUnitPrice: finalUnit,
                    quantity: it.quantity,
                    lineTotal,
                  };
                }),
              },
            }
          : {}),
      },
    });

    // Save promotion breakdown + bump usage counts
    if (items && Array.isArray(appliedPromotions) && appliedPromotions.length > 0) {
      const byPromo = new Map();
      for (const a of appliedPromotions) {
        if (!a.promotionId) continue;
        const key = a.promotionId;
        const prev = byPromo.get(key) || { ...a, discountAmount: 0 };
        prev.discountAmount = Number(prev.discountAmount) + Number(a.discountAmount || 0);
        byPromo.set(key, prev);
      }

      const rows = [...byPromo.values()].filter((r) => Number(r.discountAmount) > 0);
      if (rows.length > 0) {
        await tx.purchasePromotion.createMany({
          data: rows.map((r) => ({
            purchaseId: p.id,
            promotionId: r.promotionId,
            nameSnapshot: r.name,
            kindSnapshot: r.kind,
            couponCode: couponCode || null,
            discountAmount: r.discountAmount,
            details: r.details || null,
          })),
        });

        await tx.promotion.updateMany({
          where: { id: { in: rows.map((r) => r.promotionId) } },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    if (items && (txProductIds.length > 0 || txVariantIds.length > 0)) {
      const qtyByProduct = new Map();
      const qtyByVariant = new Map();
      for (const item of items) {
        if (item.variantId) {
          qtyByVariant.set(item.variantId, (qtyByVariant.get(item.variantId) || 0) + Number(item.quantity || 0));
          continue;
        }
        if (!item.productId) continue;
        qtyByProduct.set(item.productId, (qtyByProduct.get(item.productId) || 0) + Number(item.quantity || 0));
      }

      for (const [productId, quantity] of qtyByProduct.entries()) {
        const product = txProductById.get(productId);
        if (!product?.trackInventory) continue;
        const stockBefore = Number(product.stockOnHand);
        await tx.product.update({
          where: { id: productId },
          data: { stockOnHand: { decrement: quantity } },
        });
        await tx.stockMovement.create({
          data: {
            shopId,
            productId,
            purchaseId: p.id,
            userId: data.userId,
            movementType: 'sale',
            quantityDelta: -quantity,
            stockBefore,
            stockAfter: stockBefore - quantity,
            reason: `Sale ${receiptNumber}`,
          },
        });
      }

      for (const [variantId, quantity] of qtyByVariant.entries()) {
        const variant = txVariantById.get(variantId);
        if (!variant) continue;
        const stockBefore = Number(variant.stockOnHand);
        await tx.productVariant.update({
          where: { id: variantId },
          data: { stockOnHand: { decrement: quantity } },
        });
        await tx.stockMovement.create({
          data: {
            shopId,
            productId: variant.productId,
            variantId,
            purchaseId: p.id,
            userId: data.userId,
            movementType: 'sale',
            quantityDelta: -quantity,
            stockBefore,
            stockAfter: stockBefore - quantity,
            reason: `Sale ${receiptNumber}`,
          },
        });
      }
    }

    await tx.payment.createMany({
      data: paymentRows.map((payment) => ({
        shopId,
        purchaseId: p.id,
        shiftId,
        userId: data.userId,
        tenderType: payment.tenderType,
        amount: Number(payment.amount),
        reference: payment.reference || null,
        status: payment.status || 'captured',
        terminalId: payment.terminalId || data.terminalId || null,
        metadata: payment.metadata || null,
        capturedAt: !payment.status || payment.status === 'captured' ? new Date() : null,
      })),
    });

    const shop = await tx.shop.findUnique({ where: { id: shopId }, select: { name: true } });
    const receipt = await tx.receipt.create({
      data: {
        shopId,
        purchaseId: p.id,
        receiptNumber,
        businessName: shop?.name || null,
        businessTaxId: data.businessTaxId || null,
        templateVersion: data.receiptTemplateVersion || 'standard-v1',
        subtotal,
        discountTotal,
        taxTotal,
        serviceCharge,
        total: grandTotal,
      },
    });
    await tx.receiptEvent.create({
      data: {
        receiptId: receipt.id,
        eventType: 'printed',
        userId: data.userId,
        terminalId: data.terminalId || null,
      },
    });

    if (data.heldOrderId) {
      await tx.heldOrder.updateMany({
        where: { id: data.heldOrderId, shopId },
        data: { status: 'converted', convertedPurchaseId: p.id },
      });
    }

    if (data.createKitchenTicket) {
      const ticketNumber = `KOT-${String(Date.now()).slice(-8)}`;
      await tx.kitchenTicket.create({
        data: {
          shopId,
          purchaseId: p.id,
          userId: data.userId,
          ticketNumber,
          items: items || [],
          note: data.kitchenNote || null,
        },
      });
    }

    if (redemptionPoints > 0) {
      await tx.redemption.create({
        data: {
          shopId,
          customerId: data.customerId,
          userId: data.userId,
          pointsRedeemed: redemptionPoints,
          discountValue: pointsDiscountValue,
          notes: `POS Redemption for receipt ${receiptNumber}`,
        },
      });
      await tx.customer.update({
        where: { id: data.customerId },
        data: { 
          totalPoints: { decrement: redemptionPoints },
          lastActivityAt: new Date()
        },
      });
    } else {
      await tx.customer.update({
        where: { id: data.customerId },
        data: { 
          lastActivityAt: new Date()
        },
      });
    }

    // Add earned points separately to ensure clean state
    if (pointsEarned > 0) {
      await tx.customer.update({
        where: { id: data.customerId },
        data: { 
          totalPoints: { increment: pointsEarned }
        },
      });
    }

    return p;
  });

  const savedPurchase = await repository.findById(purchase.id, shopId);

  return savedPurchase;
}

async function voidPurchase(shopId, id, userId) {
  const purchase = await db.purchase.findFirst({ where: { id, shopId }, include: { customer: true, items: true, payments: true } });
  if (!purchase) throw Object.assign(new Error('Purchase not found'), { status: 404 });
  if (purchase.isVoided) throw Object.assign(new Error('Purchase is already voided'), { status: 400 });

  return db.$transaction(async (tx) => {
    const updatedPurchase = await tx.purchase.update({
      where: { id },
      data: {
        isVoided: true,
        voidedBy: userId,
        voidedAt: new Date(),
      },
    });

    const currentPoints = purchase.customer.totalPoints;
    const newPoints = Math.max(0, currentPoints - purchase.pointsEarned + (purchase.pointsRedeemed || 0));

    await tx.customer.update({
      where: { id: purchase.customerId },
      data: {
        totalPoints: newPoints,
      },
    });

    if (purchase.pointsRedeemed > 0) {
      await tx.redemption.updateMany({
        where: { 
          shopId, 
          customerId: purchase.customerId,
          pointsRedeemed: purchase.pointsRedeemed,
          notes: `POS Redemption for receipt ${purchase.receiptNumber}`,
          isVoided: false
        },
        data: {
          isVoided: true,
          voidedBy: userId,
          voidedAt: new Date()
        }
      });
    }

    const qtyByProduct = new Map();
    const qtyByVariant = new Map();
    for (const item of purchase.items || []) {
      if (item.variantId) {
        qtyByVariant.set(item.variantId, (qtyByVariant.get(item.variantId) || 0) + Number(item.quantity || 0));
        continue;
      }
      if (!item.productId) continue;
      qtyByProduct.set(item.productId, (qtyByProduct.get(item.productId) || 0) + Number(item.quantity || 0));
    }

    for (const [productId, quantity] of qtyByProduct.entries()) {
      const product = await tx.product.findFirst({ where: { id: productId, shopId, trackInventory: true }, select: { stockOnHand: true } });
      if (!product) continue;
      const stockBefore = Number(product.stockOnHand);
      await tx.product.update({ where: { id: productId }, data: { stockOnHand: { increment: quantity } } });
      await tx.stockMovement.create({
        data: {
          shopId,
          productId,
          purchaseId: id,
          userId,
          movementType: 'return',
          quantityDelta: quantity,
          stockBefore,
          stockAfter: stockBefore + quantity,
          reason: 'Void sale',
        },
      });
    }

    for (const [variantId, quantity] of qtyByVariant.entries()) {
      const variant = await tx.productVariant.findFirst({ where: { id: variantId, shopId }, select: { stockOnHand: true, productId: true } });
      if (!variant) continue;
      const stockBefore = Number(variant.stockOnHand);
      await tx.productVariant.update({ where: { id: variantId }, data: { stockOnHand: { increment: quantity } } });
      await tx.stockMovement.create({
        data: {
          shopId,
          productId: variant.productId,
          variantId,
          purchaseId: id,
          userId,
          movementType: 'return',
          quantityDelta: quantity,
          stockBefore,
          stockAfter: stockBefore + quantity,
          reason: 'Void sale',
        },
      });
    }

    await tx.payment.updateMany({
      where: { shopId, purchaseId: id },
      data: { status: 'voided' },
    });

    await tx.auditLog.create({
      data: {
        shopId,
        userId,
        action: 'VOID_PURCHASE',
        entityType: 'PURCHASE',
        entityId: id,
        details: { pointsReversed: purchase.pointsEarned, amountReversed: Number(purchase.amount) }
      }
    });

    return updatedPurchase;
  });
}

module.exports = { list, getById, create, voidPurchase };

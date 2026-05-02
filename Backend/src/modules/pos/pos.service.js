'use strict';

const db = require('../../config/db');
const { parsePagination, buildMeta } = require('../../utils/pagination');

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function roundMoney(value) {
  return Math.round(toNumber(value) * 100) / 100;
}

async function userRole(shopId, userId) {
  const owner = await db.user.findFirst({ where: { shopId }, orderBy: { createdAt: 'asc' }, select: { id: true } });
  return owner?.id === userId ? 'owner' : 'staff';
}

async function requirePermission(shopId, userId, permissionKey) {
  const role = await userRole(shopId, userId);
  if (role === 'owner') return true;
  const permission = await db.rolePermission.findUnique({
    where: { shopId_role_permissionKey: { shopId, role, permissionKey } },
  });
  if (!permission?.enabled) {
    throw Object.assign(new Error(`Permission required: ${permissionKey}`), { status: 403 });
  }
  return true;
}

async function listPayments(shopId, query) {
  const { skip, take, page, limit } = parsePagination(query);
  const where = {
    shopId,
    ...(query.purchaseId ? { purchaseId: query.purchaseId } : {}),
    ...(query.shiftId ? { shiftId: query.shiftId } : {}),
    ...(query.tenderType ? { tenderType: query.tenderType } : {}),
  };
  const [items, total] = await Promise.all([
    db.payment.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { purchase: true } }),
    db.payment.count({ where }),
  ]);
  return { items, meta: buildMeta(total, page, limit) };
}

async function listReceipts(shopId, query) {
  const { skip, take, page, limit } = parsePagination(query);
  const where = { shopId, ...(query.purchaseId ? { purchaseId: query.purchaseId } : {}) };
  const [items, total] = await Promise.all([
    db.receipt.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { events: true, purchase: { include: { items: true, payments: true, customer: true } } } }),
    db.receipt.count({ where }),
  ]);
  return { items, meta: buildMeta(total, page, limit) };
}

async function reprintReceipt(shopId, id, userId, terminalId) {
  return db.$transaction(async (tx) => {
    const receipt = await tx.receipt.findFirst({ where: { id, shopId } });
    if (!receipt) throw Object.assign(new Error('Receipt not found'), { status: 404 });
    await tx.receipt.update({ where: { id }, data: { reprintCount: { increment: 1 } } });
    await tx.receiptEvent.create({ data: { receiptId: id, eventType: 'reprinted', userId, terminalId: terminalId || null } });
    return tx.receipt.findUnique({ where: { id }, include: { events: true, purchase: { include: { items: true, payments: true, customer: true } } } });
  });
}

async function nextRefundNumberTx(tx, shopId) {
  const count = await tx.refund.count({ where: { shopId } });
  return `RF-${String(count + 1).padStart(6, '0')}`;
}

async function createRefund(shopId, userId, data) {
  await requirePermission(shopId, userId, 'refund.create');
  const purchase = await db.purchase.findFirst({
    where: { id: data.purchaseId, shopId, isVoided: false },
    include: { items: true, payments: true, customer: true },
  });
  if (!purchase) throw Object.assign(new Error('Purchase not found'), { status: 404 });

  const requestedItems = Array.isArray(data.items) && data.items.length > 0
    ? data.items
    : purchase.items.map((i) => ({ purchaseItemId: i.id, quantity: i.quantity }));

  return db.$transaction(async (tx) => {
    const refundNumber = await nextRefundNumberTx(tx, shopId);
    const refundItems = [];
    for (const requested of requestedItems) {
      const item = purchase.items.find((i) => i.id === requested.purchaseItemId);
      if (!item) throw Object.assign(new Error('Refund item not found on purchase'), { status: 400 });
      const quantity = Number(requested.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > item.quantity) {
        throw Object.assign(new Error(`Invalid refund quantity for ${item.name}`), { status: 400 });
      }
      const unitPrice = toNumber(item.finalUnitPrice ?? item.unitPrice);
      const lineTotal = roundMoney(unitPrice * quantity);
      const taxAmount = roundMoney((toNumber(item.taxAmount) / Math.max(1, item.quantity)) * quantity);
      refundItems.push({ item, quantity, unitPrice, lineTotal, taxAmount });
    }

    const subtotal = roundMoney(refundItems.reduce((sum, r) => sum + r.lineTotal, 0));
    const taxTotal = roundMoney(refundItems.reduce((sum, r) => sum + r.taxAmount, 0));
    const amount = roundMoney(subtotal + taxTotal);

    const refund = await tx.refund.create({
      data: {
        shopId,
        purchaseId: purchase.id,
        userId,
        refundNumber,
        method: data.method || 'original_payment',
        reason: data.reason || 'Refund',
        subtotal,
        taxTotal,
        amount,
        managerApprovedBy: data.managerApprovedBy || null,
        items: {
          create: refundItems.map((r) => ({
            purchaseItemId: r.item.id,
            productId: r.item.productId,
            variantId: r.item.variantId,
            name: r.item.name,
            quantity: r.quantity,
            unitPrice: r.unitPrice,
            taxAmount: r.taxAmount,
            lineTotal: r.lineTotal,
          })),
        },
      },
    });

    const originalPayment = purchase.payments.find((p) => p.status === 'captured') || purchase.payments[0];
    await tx.payment.create({
      data: {
        shopId,
        purchaseId: purchase.id,
        refundId: refund.id,
        shiftId: originalPayment?.shiftId || null,
        userId,
        tenderType: data.tenderType || originalPayment?.tenderType || 'cash',
        amount: -amount,
        reference: data.reference || null,
        status: 'refunded',
        terminalId: data.terminalId || originalPayment?.terminalId || null,
        capturedAt: new Date(),
      },
    });

    for (const r of refundItems) {
      if (r.item.variantId) {
        const variant = await tx.productVariant.findFirst({ where: { id: r.item.variantId, shopId }, select: { stockOnHand: true, productId: true } });
        if (variant) {
          const stockBefore = Number(variant.stockOnHand);
          await tx.productVariant.update({ where: { id: r.item.variantId }, data: { stockOnHand: { increment: r.quantity } } });
          await tx.stockMovement.create({ data: { shopId, productId: variant.productId, variantId: r.item.variantId, refundId: refund.id, userId, movementType: 'refund', quantityDelta: r.quantity, stockBefore, stockAfter: stockBefore + r.quantity, reason: data.reason || 'Refund' } });
        }
      } else if (r.item.productId) {
        const product = await tx.product.findFirst({ where: { id: r.item.productId, shopId, trackInventory: true }, select: { stockOnHand: true } });
        if (product) {
          const stockBefore = Number(product.stockOnHand);
          await tx.product.update({ where: { id: r.item.productId }, data: { stockOnHand: { increment: r.quantity } } });
          await tx.stockMovement.create({ data: { shopId, productId: r.item.productId, refundId: refund.id, userId, movementType: 'refund', quantityDelta: r.quantity, stockBefore, stockAfter: stockBefore + r.quantity, reason: data.reason || 'Refund' } });
        }
      }
    }

    await tx.customer.update({
      where: { id: purchase.customerId },
      data: { totalPoints: Math.max(0, Number(purchase.customer.totalPoints || 0) - Math.floor(amount / 100)) },
    });

    await tx.auditLog.create({
      data: { shopId, userId, action: 'CREATE_REFUND', entityType: 'REFUND', entityId: refund.id, details: { purchaseId: purchase.id, amount, reason: data.reason } },
    });

    return tx.refund.findUnique({ where: { id: refund.id }, include: { items: true, payments: true, purchase: true } });
  });
}

async function listRefunds(shopId, query) {
  const { skip, take, page, limit } = parsePagination(query);
  const where = { shopId, ...(query.purchaseId ? { purchaseId: query.purchaseId } : {}) };
  const [items, total] = await Promise.all([
    db.refund.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { items: true, payments: true, purchase: { include: { customer: true } } } }),
    db.refund.count({ where }),
  ]);
  return { items, meta: buildMeta(total, page, limit) };
}

async function openShift(shopId, userId, data) {
  const existing = await db.registerShift.findFirst({ where: { shopId, userId, status: 'open' } });
  if (existing) return existing;
  return db.$transaction(async (tx) => {
    const shift = await tx.registerShift.create({
      data: { shopId, userId, terminalId: data.terminalId || null, openingCash: toNumber(data.openingCash), expectedCash: toNumber(data.openingCash) },
    });
    await tx.cashDrawerEvent.create({ data: { shopId, shiftId: shift.id, userId, terminalId: data.terminalId || null, eventType: 'shift_open', amount: toNumber(data.openingCash), reason: 'Open shift' } });
    return shift;
  });
}

async function currentShift(shopId, userId) {
  return db.registerShift.findFirst({ where: { shopId, userId, status: 'open' }, orderBy: { openedAt: 'desc' }, include: { cashDrawerEvents: true, payments: true } });
}

async function listShifts(shopId, query) {
  const { skip, take, page, limit } = parsePagination(query);
  const where = { shopId, ...(query.status ? { status: query.status } : {}) };
  const [items, total] = await Promise.all([
    db.registerShift.findMany({ where, skip, take, orderBy: { openedAt: 'desc' }, include: { cashDrawerEvents: true, payments: true, user: { select: { id: true, name: true, username: true } } } }),
    db.registerShift.count({ where }),
  ]);
  return { items, meta: buildMeta(total, page, limit) };
}

async function cashEvent(shopId, userId, shiftId, data) {
  await requirePermission(shopId, userId, 'cash.drawer');
  return db.$transaction(async (tx) => {
    const shift = await tx.registerShift.findFirst({ where: { id: shiftId, shopId, status: 'open' } });
    if (!shift) throw Object.assign(new Error('Open shift not found'), { status: 404 });
    const amount = toNumber(data.amount);
    const eventType = data.eventType || 'cash_in';
    await tx.cashDrawerEvent.create({ data: { shopId, shiftId, userId, terminalId: data.terminalId || shift.terminalId, eventType, amount, reason: data.reason || null } });
    const update = eventType === 'cash_out'
      ? { cashOut: { increment: amount }, expectedCash: { decrement: amount } }
      : { cashIn: { increment: amount }, expectedCash: { increment: amount } };
    return tx.registerShift.update({ where: { id: shiftId }, data: update });
  });
}

async function closeShift(shopId, userId, shiftId, data) {
  await requirePermission(shopId, userId, 'cash.drawer');
  return db.$transaction(async (tx) => {
    const shift = await tx.registerShift.findFirst({ where: { id: shiftId, shopId, status: 'open' }, include: { payments: true } });
    if (!shift) throw Object.assign(new Error('Open shift not found'), { status: 404 });
    const cashPayments = shift.payments.filter((p) => p.tenderType === 'cash' && p.status === 'captured').reduce((s, p) => s + Number(p.amount), 0);
    const expectedCash = roundMoney(Number(shift.openingCash) + Number(shift.cashIn) - Number(shift.cashOut) + cashPayments);
    const closingCash = roundMoney(data.closingCash);
    const variance = roundMoney(closingCash - expectedCash);
    await tx.cashDrawerEvent.create({ data: { shopId, shiftId, userId, terminalId: data.terminalId || shift.terminalId, eventType: 'shift_close', amount: closingCash, reason: data.note || 'Close shift' } });
    return tx.registerShift.update({ where: { id: shiftId }, data: { status: 'closed', closedAt: new Date(), closingCash, expectedCash, variance, note: data.note || null } });
  });
}

async function listStockMovements(shopId, query) {
  const { skip, take, page, limit } = parsePagination(query);
  const where = { shopId, ...(query.productId ? { productId: query.productId } : {}) };
  const [items, total] = await Promise.all([
    db.stockMovement.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { product: true, variant: true, user: { select: { id: true, name: true } } } }),
    db.stockMovement.count({ where }),
  ]);
  return { items, meta: buildMeta(total, page, limit) };
}

async function adjustStock(shopId, userId, data) {
  await requirePermission(shopId, userId, 'inventory.adjust');
  return db.$transaction(async (tx) => {
    const quantity = Number(data.quantityDelta);
    if (!Number.isInteger(quantity) || quantity === 0) throw Object.assign(new Error('quantityDelta must be a non-zero integer'), { status: 400 });
    if (data.variantId) {
      const variant = await tx.productVariant.findFirst({ where: { id: data.variantId, shopId } });
      if (!variant) throw Object.assign(new Error('Variant not found'), { status: 404 });
      const stockBefore = Number(variant.stockOnHand);
      const stockAfter = stockBefore + quantity;
      if (stockAfter < 0) throw Object.assign(new Error('Stock cannot go below zero'), { status: 400 });
      await tx.productVariant.update({ where: { id: variant.id }, data: { stockOnHand: stockAfter } });
      return tx.stockMovement.create({ data: { shopId, productId: variant.productId, variantId: variant.id, userId, movementType: data.movementType || 'adjustment', quantityDelta: quantity, stockBefore, stockAfter, unitCost: data.unitCost ?? null, reason: data.reason || null } });
    }

    const product = await tx.product.findFirst({ where: { id: data.productId, shopId } });
    if (!product) throw Object.assign(new Error('Product not found'), { status: 404 });
    const stockBefore = Number(product.stockOnHand);
    const stockAfter = stockBefore + quantity;
    if (stockAfter < 0) throw Object.assign(new Error('Stock cannot go below zero'), { status: 400 });
    await tx.product.update({ where: { id: product.id }, data: { stockOnHand: stockAfter, trackInventory: true } });
    return tx.stockMovement.create({ data: { shopId, productId: product.id, userId, movementType: data.movementType || 'adjustment', quantityDelta: quantity, stockBefore, stockAfter, unitCost: data.unitCost ?? null, reason: data.reason || null } });
  });
}

async function listSuppliers(shopId) {
  return db.supplier.findMany({ where: { shopId }, orderBy: { name: 'asc' } });
}

async function createSupplier(shopId, data) {
  return db.supplier.create({ data: { shopId, name: data.name, phone: data.phone || null, email: data.email || null, address: data.address || null } });
}

async function updateSupplier(shopId, id, data) {
  await db.supplier.updateMany({ where: { id, shopId }, data });
  return db.supplier.findFirst({ where: { id, shopId } });
}

async function listPurchaseOrders(shopId, query) {
  const { skip, take, page, limit } = parsePagination(query);
  const where = { shopId, ...(query.status ? { status: query.status } : {}) };
  const [items, total] = await Promise.all([
    db.purchaseOrder.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { supplier: true, items: { include: { product: true, variant: true } } } }),
    db.purchaseOrder.count({ where }),
  ]);
  return { items, meta: buildMeta(total, page, limit) };
}

async function createPurchaseOrder(shopId, data) {
  const orderNumber = data.orderNumber || `PO-${Date.now()}`;
  const items = data.items || [];
  const subtotal = roundMoney(items.reduce((sum, i) => sum + Number(i.unitCost || 0) * Number(i.quantityOrdered || 0), 0));
  return db.purchaseOrder.create({
    data: {
      shopId,
      supplierId: data.supplierId || null,
      orderNumber,
      status: data.status || 'draft',
      expectedAt: data.expectedAt ? new Date(data.expectedAt) : null,
      subtotal,
      notes: data.notes || null,
      items: { create: items.map((i) => ({ productId: i.productId, variantId: i.variantId || null, quantityOrdered: Number(i.quantityOrdered), unitCost: Number(i.unitCost || 0) })) },
    },
    include: { supplier: true, items: true },
  });
}

async function receivePurchaseOrder(shopId, userId, id, data) {
  const order = await db.purchaseOrder.findFirst({ where: { id, shopId }, include: { items: true } });
  if (!order) throw Object.assign(new Error('Purchase order not found'), { status: 404 });
  return db.$transaction(async (tx) => {
    for (const item of order.items) {
      const requested = (data.items || []).find((i) => i.itemId === item.id);
      const receiveQty = requested ? Number(requested.quantityReceived) : Number(item.quantityOrdered) - Number(item.quantityReceived);
      if (receiveQty <= 0) continue;
      if (item.variantId) {
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
        const stockBefore = Number(variant.stockOnHand);
        await tx.productVariant.update({ where: { id: item.variantId }, data: { stockOnHand: { increment: receiveQty }, cost: item.unitCost } });
        await tx.stockMovement.create({ data: { shopId, productId: item.productId, variantId: item.variantId, supplierId: order.supplierId, purchaseOrderId: id, userId, movementType: 'receiving', quantityDelta: receiveQty, stockBefore, stockAfter: stockBefore + receiveQty, unitCost: item.unitCost, reason: `Receive ${order.orderNumber}` } });
      } else {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        const stockBefore = Number(product.stockOnHand);
        await tx.product.update({ where: { id: item.productId }, data: { stockOnHand: { increment: receiveQty }, cost: item.unitCost, trackInventory: true } });
        await tx.stockMovement.create({ data: { shopId, productId: item.productId, supplierId: order.supplierId, purchaseOrderId: id, userId, movementType: 'receiving', quantityDelta: receiveQty, stockBefore, stockAfter: stockBefore + receiveQty, unitCost: item.unitCost, reason: `Receive ${order.orderNumber}` } });
      }
      await tx.purchaseOrderItem.update({ where: { id: item.id }, data: { quantityReceived: { increment: receiveQty } } });
    }
    const freshItems = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: id } });
    const allReceived = freshItems.every((i) => Number(i.quantityReceived) >= Number(i.quantityOrdered));
    const anyReceived = freshItems.some((i) => Number(i.quantityReceived) > 0);
    return tx.purchaseOrder.update({ where: { id }, data: { status: allReceived ? 'received' : anyReceived ? 'partially_received' : order.status, receivedAt: allReceived ? new Date() : order.receivedAt } });
  });
}

async function listTaxRates(shopId) {
  return db.taxRate.findMany({ where: { shopId }, orderBy: [{ isDefault: 'desc' }, { name: 'asc' }] });
}

async function saveTaxRate(shopId, data, id = null) {
  if (data.isDefault) await db.taxRate.updateMany({ where: { shopId }, data: { isDefault: false } });
  if (id) {
    await db.taxRate.updateMany({ where: { id, shopId }, data });
    return db.taxRate.findFirst({ where: { id, shopId } });
  }
  return db.taxRate.create({ data: { shopId, name: data.name, rate: Number(data.rate), mode: data.mode || 'exclusive', isDefault: !!data.isDefault, isActive: data.isActive !== false } });
}

async function listHeldOrders(shopId, query) {
  return db.heldOrder.findMany({ where: { shopId, status: query.status || 'parked' }, orderBy: { createdAt: 'desc' } });
}

async function createHeldOrder(shopId, userId, data) {
  return db.heldOrder.create({ data: { shopId, userId, customerId: data.customerId || null, status: data.status || 'parked', label: data.label || null, cart: data.cart, subtotal: toNumber(data.subtotal), expiresAt: data.expiresAt ? new Date(data.expiresAt) : null } });
}

async function updateHeldOrder(shopId, id, data) {
  await db.heldOrder.updateMany({ where: { id, shopId }, data });
  return db.heldOrder.findFirst({ where: { id, shopId } });
}

async function listVariants(shopId, productId) {
  return db.productVariant.findMany({ where: { shopId, productId, deletedAt: null }, orderBy: { name: 'asc' } });
}

async function createVariant(shopId, productId, data) {
  return db.productVariant.create({ data: { shopId, productId, name: data.name, sku: data.sku, barcode: data.barcode || null, price: data.price ?? null, cost: data.cost ?? null, stockOnHand: data.stockOnHand || 0, reorderLevel: data.reorderLevel || 0 } });
}

async function listModifierGroups(shopId, productId) {
  return db.productModifierGroup.findMany({ where: { shopId, productId }, include: { options: true }, orderBy: { createdAt: 'asc' } });
}

async function createModifierGroup(shopId, productId, data) {
  return db.productModifierGroup.create({
    data: {
      shopId,
      productId,
      name: data.name,
      minSelect: data.minSelect || 0,
      maxSelect: data.maxSelect || 1,
      options: { create: (data.options || []).map((o) => ({ shopId, name: o.name, priceDelta: Number(o.priceDelta || 0) })) },
    },
    include: { options: true },
  });
}

async function listPermissions(shopId) {
  return db.rolePermission.findMany({ where: { shopId }, orderBy: [{ role: 'asc' }, { permissionKey: 'asc' }] });
}

async function setPermissions(shopId, data) {
  const rows = data.permissions || [];
  return db.$transaction(rows.map((row) => db.rolePermission.upsert({
    where: { shopId_role_permissionKey: { shopId, role: row.role, permissionKey: row.permissionKey } },
    create: { shopId, role: row.role, permissionKey: row.permissionKey, enabled: row.enabled !== false },
    update: { enabled: row.enabled !== false },
  })));
}

async function listKitchenTickets(shopId, query) {
  return db.kitchenTicket.findMany({ where: { shopId, ...(query.status ? { status: query.status } : {}) }, orderBy: { createdAt: 'desc' }, include: { purchase: true } });
}

async function createKitchenTicket(shopId, userId, data) {
  const ticketNumber = data.ticketNumber || `KOT-${Date.now()}`;
  return db.kitchenTicket.create({ data: { shopId, userId, purchaseId: data.purchaseId || null, ticketNumber, status: data.status || 'queued', items: data.items || [], note: data.note || null } });
}

async function updateKitchenTicket(shopId, id, data) {
  await db.kitchenTicket.updateMany({ where: { id, shopId }, data: { status: data.status, note: data.note } });
  return db.kitchenTicket.findFirst({ where: { id, shopId } });
}

async function listTerminals(shopId) {
  return db.posTerminal.findMany({ where: { shopId }, orderBy: { name: 'asc' } });
}

async function createTerminal(shopId, data) {
  return db.posTerminal.create({ data: { shopId, name: data.name, code: data.code, location: data.location || null } });
}

async function professionalReport(shopId, query, userId) {
  await requirePermission(shopId, userId, 'reports.view');
  const from = query.from ? new Date(query.from) : undefined;
  const to = query.to ? new Date(query.to) : undefined;
  const createdAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
  const [payments, refunds, shifts, stockValue, taxAgg] = await Promise.all([
    db.payment.groupBy({ by: ['tenderType'], where: { shopId, createdAt }, _sum: { amount: true }, _count: true }),
    db.refund.aggregate({ where: { shopId, createdAt }, _sum: { amount: true }, _count: true }),
    db.registerShift.findMany({ where: { shopId, ...(Object.keys(createdAt).length ? { openedAt: createdAt } : {}) }, orderBy: { openedAt: 'desc' }, take: 20 }),
    db.product.findMany({ where: { shopId, deletedAt: null, trackInventory: true }, select: { stockOnHand: true, cost: true, price: true } }),
    db.purchase.aggregate({ where: { shopId, createdAt }, _sum: { taxTotal: true, discountTotal: true, serviceCharge: true } }),
  ]);
  return {
    payments,
    refunds,
    shifts,
    inventoryValue: stockValue.reduce((sum, p) => sum + Number(p.stockOnHand || 0) * Number(p.cost ?? p.price ?? 0), 0),
    tax: {
      taxTotal: taxAgg._sum.taxTotal || 0,
      discountTotal: taxAgg._sum.discountTotal || 0,
      serviceCharge: taxAgg._sum.serviceCharge || 0,
    },
  };
}

module.exports = {
  listPayments,
  listReceipts,
  reprintReceipt,
  listRefunds,
  createRefund,
  openShift,
  currentShift,
  listShifts,
  cashEvent,
  closeShift,
  listStockMovements,
  adjustStock,
  listSuppliers,
  createSupplier,
  updateSupplier,
  listPurchaseOrders,
  createPurchaseOrder,
  receivePurchaseOrder,
  listTaxRates,
  saveTaxRate,
  listHeldOrders,
  createHeldOrder,
  updateHeldOrder,
  listVariants,
  createVariant,
  listModifierGroups,
  createModifierGroup,
  listPermissions,
  setPermissions,
  listKitchenTickets,
  createKitchenTicket,
  updateKitchenTicket,
  listTerminals,
  createTerminal,
  professionalReport,
};

DO $$ BEGIN CREATE TYPE "PaymentTenderType" AS ENUM ('cash','card','gift_card','store_credit','qr','bank_transfer','split','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "PaymentStatus" AS ENUM ('pending','authorized','captured','refunded','voided','failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ReceiptEventType" AS ENUM ('printed','reprinted','emailed','viewed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "RefundStatus" AS ENUM ('pending','completed','voided'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "RefundMethod" AS ENUM ('original_payment','cash','card','store_credit','gift_card','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ShiftStatus" AS ENUM ('open','closed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "CashDrawerEventType" AS ENUM ('shift_open','cash_in','cash_out','no_sale','payout','shift_close'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "StockMovementType" AS ENUM ('sale','refund','return','adjustment','receiving','waste','transfer','manual'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "PurchaseOrderStatus" AS ENUM ('draft','ordered','partially_received','received','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "TaxCalculationMode" AS ENUM ('exclusive','inclusive'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "HeldOrderStatus" AS ENUM ('parked','quote','layaway','tab','converted','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "KitchenTicketStatus" AS ENUM ('queued','preparing','ready','completed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "taxRateId" UUID;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "taxMode" "TaxCalculationMode" NOT NULL DEFAULT 'exclusive';

ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "taxTotal" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "serviceCharge" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "receiptNumber" TEXT;
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "terminalId" UUID;
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "shiftId" UUID;
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "heldOrderId" UUID;

ALTER TABLE "PurchaseItem" ADD COLUMN IF NOT EXISTS "variantId" UUID;
ALTER TABLE "PurchaseItem" ADD COLUMN IF NOT EXISTS "taxRate" DECIMAL(5,2);
ALTER TABLE "PurchaseItem" ADD COLUMN IF NOT EXISTS "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;

CREATE TABLE "ReceiptSequence" (
  "shopId" UUID NOT NULL,
  "prefix" TEXT NOT NULL DEFAULT 'INV',
  "nextNumber" INTEGER NOT NULL DEFAULT 1,
  "padding" INTEGER NOT NULL DEFAULT 6,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReceiptSequence_pkey" PRIMARY KEY ("shopId")
);

CREATE TABLE "TaxRate" (
  "id" UUID NOT NULL,
  "shopId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "rate" DECIMAL(5,2) NOT NULL,
  "mode" "TaxCalculationMode" NOT NULL DEFAULT 'exclusive',
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TaxRate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PosTerminal" (
  "id" UUID NOT NULL,
  "shopId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "location" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PosTerminal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductVariant" (
  "id" UUID NOT NULL,
  "shopId" UUID NOT NULL,
  "productId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "barcode" TEXT,
  "price" DECIMAL(12,2),
  "cost" DECIMAL(12,2),
  "stockOnHand" INTEGER NOT NULL DEFAULT 0,
  "reorderLevel" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductModifierGroup" (
  "id" UUID NOT NULL,
  "shopId" UUID NOT NULL,
  "productId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "minSelect" INTEGER NOT NULL DEFAULT 0,
  "maxSelect" INTEGER NOT NULL DEFAULT 1,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductModifierGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductModifierOption" (
  "id" UUID NOT NULL,
  "shopId" UUID NOT NULL,
  "groupId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "priceDelta" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductModifierOption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RegisterShift" (
  "id" UUID NOT NULL,
  "shopId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "terminalId" UUID,
  "status" "ShiftStatus" NOT NULL DEFAULT 'open',
  "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedAt" TIMESTAMP(3),
  "openingCash" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "cashIn" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "cashOut" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "expectedCash" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "closingCash" DECIMAL(12,2),
  "variance" DECIMAL(12,2),
  "note" TEXT,
  CONSTRAINT "RegisterShift_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
  "id" UUID NOT NULL,
  "shopId" UUID NOT NULL,
  "purchaseId" UUID,
  "refundId" UUID,
  "shiftId" UUID,
  "userId" UUID NOT NULL,
  "tenderType" "PaymentTenderType" NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "reference" TEXT,
  "status" "PaymentStatus" NOT NULL DEFAULT 'captured',
  "terminalId" UUID,
  "metadata" JSONB,
  "capturedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Receipt" (
  "id" UUID NOT NULL,
  "shopId" UUID NOT NULL,
  "purchaseId" UUID NOT NULL,
  "receiptNumber" TEXT NOT NULL,
  "businessName" TEXT,
  "businessTaxId" TEXT,
  "templateVersion" TEXT NOT NULL DEFAULT 'standard-v1',
  "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "discountTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "taxTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "serviceCharge" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "total" DECIMAL(12,2) NOT NULL,
  "reprintCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReceiptEvent" (
  "id" UUID NOT NULL,
  "receiptId" UUID NOT NULL,
  "eventType" "ReceiptEventType" NOT NULL,
  "userId" UUID,
  "terminalId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReceiptEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Refund" (
  "id" UUID NOT NULL,
  "shopId" UUID NOT NULL,
  "purchaseId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "refundNumber" TEXT,
  "method" "RefundMethod" NOT NULL DEFAULT 'original_payment',
  "reason" TEXT NOT NULL,
  "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "taxTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "amount" DECIMAL(12,2) NOT NULL,
  "status" "RefundStatus" NOT NULL DEFAULT 'completed',
  "managerApprovedBy" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "voidedAt" TIMESTAMP(3),
  CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RefundItem" (
  "id" UUID NOT NULL,
  "refundId" UUID NOT NULL,
  "purchaseItemId" UUID,
  "productId" UUID,
  "variantId" UUID,
  "name" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPrice" DECIMAL(12,2) NOT NULL,
  "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "lineTotal" DECIMAL(12,2) NOT NULL,
  CONSTRAINT "RefundItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CashDrawerEvent" (
  "id" UUID NOT NULL,
  "shopId" UUID NOT NULL,
  "shiftId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "terminalId" UUID,
  "eventType" "CashDrawerEventType" NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CashDrawerEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StockMovement" (
  "id" UUID NOT NULL,
  "shopId" UUID NOT NULL,
  "productId" UUID,
  "variantId" UUID,
  "purchaseId" UUID,
  "refundId" UUID,
  "supplierId" UUID,
  "purchaseOrderId" UUID,
  "userId" UUID,
  "movementType" "StockMovementType" NOT NULL,
  "quantityDelta" INTEGER NOT NULL,
  "stockBefore" INTEGER NOT NULL,
  "stockAfter" INTEGER NOT NULL,
  "unitCost" DECIMAL(12,2),
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Supplier" (
  "id" UUID NOT NULL,
  "shopId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "email" TEXT,
  "address" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PurchaseOrder" (
  "id" UUID NOT NULL,
  "shopId" UUID NOT NULL,
  "supplierId" UUID,
  "orderNumber" TEXT NOT NULL,
  "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'draft',
  "expectedAt" TIMESTAMP(3),
  "receivedAt" TIMESTAMP(3),
  "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PurchaseOrderItem" (
  "id" UUID NOT NULL,
  "purchaseOrderId" UUID NOT NULL,
  "productId" UUID NOT NULL,
  "variantId" UUID,
  "quantityOrdered" INTEGER NOT NULL,
  "quantityReceived" INTEGER NOT NULL DEFAULT 0,
  "unitCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
  CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HeldOrder" (
  "id" UUID NOT NULL,
  "shopId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "customerId" UUID,
  "status" "HeldOrderStatus" NOT NULL DEFAULT 'parked',
  "label" TEXT,
  "cart" JSONB NOT NULL,
  "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3),
  "convertedPurchaseId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HeldOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KitchenTicket" (
  "id" UUID NOT NULL,
  "shopId" UUID NOT NULL,
  "purchaseId" UUID,
  "userId" UUID NOT NULL,
  "ticketNumber" TEXT NOT NULL,
  "status" "KitchenTicketStatus" NOT NULL DEFAULT 'queued',
  "items" JSONB NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "KitchenTicket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RolePermission" (
  "id" UUID NOT NULL,
  "shopId" UUID NOT NULL,
  "role" TEXT NOT NULL,
  "permissionKey" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TaxRate_shopId_name_key" ON "TaxRate"("shopId","name");
CREATE UNIQUE INDEX "PosTerminal_shopId_code_key" ON "PosTerminal"("shopId","code");
CREATE UNIQUE INDEX "ProductVariant_shopId_sku_key" ON "ProductVariant"("shopId","sku");
CREATE UNIQUE INDEX "ProductVariant_shopId_barcode_key" ON "ProductVariant"("shopId","barcode");
CREATE UNIQUE INDEX "Purchase_shopId_receiptNumber_key" ON "Purchase"("shopId","receiptNumber");
CREATE UNIQUE INDEX "Receipt_shopId_receiptNumber_key" ON "Receipt"("shopId","receiptNumber");
CREATE UNIQUE INDEX "Refund_shopId_refundNumber_key" ON "Refund"("shopId","refundNumber");
CREATE UNIQUE INDEX "Supplier_shopId_name_key" ON "Supplier"("shopId","name");
CREATE UNIQUE INDEX "PurchaseOrder_shopId_orderNumber_key" ON "PurchaseOrder"("shopId","orderNumber");
CREATE UNIQUE INDEX "KitchenTicket_shopId_ticketNumber_key" ON "KitchenTicket"("shopId","ticketNumber");
CREATE UNIQUE INDEX "RolePermission_shopId_role_permissionKey_key" ON "RolePermission"("shopId","role","permissionKey");

CREATE INDEX "Payment_shopId_purchaseId_idx" ON "Payment"("shopId","purchaseId");
CREATE INDEX "Payment_shopId_shiftId_idx" ON "Payment"("shopId","shiftId");
CREATE INDEX "Receipt_shopId_purchaseId_idx" ON "Receipt"("shopId","purchaseId");
CREATE INDEX "Refund_shopId_purchaseId_idx" ON "Refund"("shopId","purchaseId");
CREATE INDEX "RegisterShift_shopId_userId_status_idx" ON "RegisterShift"("shopId","userId","status");
CREATE INDEX "CashDrawerEvent_shopId_shiftId_idx" ON "CashDrawerEvent"("shopId","shiftId");
CREATE INDEX "StockMovement_shopId_productId_createdAt_idx" ON "StockMovement"("shopId","productId","createdAt");
CREATE INDEX "PurchaseOrder_shopId_status_idx" ON "PurchaseOrder"("shopId","status");
CREATE INDEX "HeldOrder_shopId_status_createdAt_idx" ON "HeldOrder"("shopId","status","createdAt");
CREATE INDEX "KitchenTicket_shopId_status_idx" ON "KitchenTicket"("shopId","status");

ALTER TABLE "Product" ADD CONSTRAINT "Product_taxRateId_fkey" FOREIGN KEY ("taxRateId") REFERENCES "TaxRate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "PosTerminal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "RegisterShift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_heldOrderId_fkey" FOREIGN KEY ("heldOrderId") REFERENCES "HeldOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaxRate" ADD CONSTRAINT "TaxRate_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PosTerminal" ADD CONSTRAINT "PosTerminal_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductModifierGroup" ADD CONSTRAINT "ProductModifierGroup_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductModifierGroup" ADD CONSTRAINT "ProductModifierGroup_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductModifierOption" ADD CONSTRAINT "ProductModifierOption_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductModifierOption" ADD CONSTRAINT "ProductModifierOption_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ProductModifierGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RegisterShift" ADD CONSTRAINT "RegisterShift_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RegisterShift" ADD CONSTRAINT "RegisterShift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RegisterShift" ADD CONSTRAINT "RegisterShift_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "PosTerminal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "RegisterShift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "PosTerminal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReceiptEvent" ADD CONSTRAINT "ReceiptEvent_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "Refund"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RefundItem" ADD CONSTRAINT "RefundItem_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "Refund"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RefundItem" ADD CONSTRAINT "RefundItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RefundItem" ADD CONSTRAINT "RefundItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CashDrawerEvent" ADD CONSTRAINT "CashDrawerEvent_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashDrawerEvent" ADD CONSTRAINT "CashDrawerEvent_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "RegisterShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CashDrawerEvent" ADD CONSTRAINT "CashDrawerEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashDrawerEvent" ADD CONSTRAINT "CashDrawerEvent_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "PosTerminal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "Refund"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HeldOrder" ADD CONSTRAINT "HeldOrder_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HeldOrder" ADD CONSTRAINT "HeldOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "KitchenTicket" ADD CONSTRAINT "KitchenTicket_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "KitchenTicket" ADD CONSTRAINT "KitchenTicket_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "KitchenTicket" ADD CONSTRAINT "KitchenTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Receipt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Refund" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RegisterShift" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CashDrawerEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockMovement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Supplier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PurchaseOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TaxRate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HeldOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KitchenTicket" ENABLE ROW LEVEL SECURITY;

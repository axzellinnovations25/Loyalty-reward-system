-- CreateEnum
CREATE TYPE "PromotionKind" AS ENUM ('cart_percent', 'cart_amount', 'item_percent', 'item_amount', 'bogo', 'happy_hour_price');

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "Purchase" ADD COLUMN     "discountTotal" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PurchaseItem" ADD COLUMN     "originalUnitPrice" DECIMAL(12,2);
ALTER TABLE "PurchaseItem" ADD COLUMN     "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "PurchaseItem" ADD COLUMN     "finalUnitPrice" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" UUID NOT NULL,
    "shopId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "kind" "PromotionKind" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "stackable" BOOLEAN NOT NULL DEFAULT false,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "daysOfWeek" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "startTime" TEXT,
    "endTime" TEXT,
    "couponCode" TEXT,
    "usageLimit" INTEGER,
    "perCustomerLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchasePromotion" (
    "id" UUID NOT NULL,
    "purchaseId" UUID NOT NULL,
    "promotionId" UUID,
    "nameSnapshot" TEXT NOT NULL,
    "kindSnapshot" "PromotionKind" NOT NULL,
    "couponCode" TEXT,
    "discountAmount" DECIMAL(12,2) NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchasePromotion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Promotion_shopId_isActive_idx" ON "Promotion"("shopId", "isActive");

-- CreateIndex
CREATE INDEX "Promotion_shopId_kind_idx" ON "Promotion"("shopId", "kind");

-- CreateIndex
CREATE INDEX "Promotion_shopId_deletedAt_idx" ON "Promotion"("shopId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_shopId_couponCode_key" ON "Promotion"("shopId", "couponCode");

-- CreateIndex
CREATE INDEX "PurchasePromotion_purchaseId_idx" ON "PurchasePromotion"("purchaseId");

-- CreateIndex
CREATE INDEX "PurchasePromotion_promotionId_idx" ON "PurchasePromotion"("promotionId");

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasePromotion" ADD CONSTRAINT "PurchasePromotion_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasePromotion" ADD CONSTRAINT "PurchasePromotion_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Enable Row Level Security
ALTER TABLE "Promotion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PurchasePromotion" ENABLE ROW LEVEL SECURITY;

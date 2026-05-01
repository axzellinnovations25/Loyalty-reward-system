-- Reconcile drift between migration history and the current database/schema.
-- This migration is meant to be MARKED AS APPLIED on databases where these changes
-- were already made manually / via db push, using:
--   npx prisma migrate resolve --applied 20260501101000_reconcile_drift

-- Shop: contactInfo -> phone
ALTER TABLE "Shop" RENAME COLUMN "contactInfo" TO "phone";

-- ShopSettings: remove legacy redemption/SMS config
ALTER TABLE "ShopSettings" DROP COLUMN "maxRedeemValue";
ALTER TABLE "ShopSettings" DROP COLUMN "redemptionMode";
ALTER TABLE "ShopSettings" DROP COLUMN "smsEnabled";
ALTER TABLE "ShopSettings" DROP COLUMN "textlkSenderId";
ALTER TABLE "ShopSettings" DROP COLUMN "textlkApiKey";
ALTER TABLE "ShopSettings" DROP COLUMN "textlkApiUrl";

-- Enum no longer used by schema
DROP TYPE "RedemptionMode";

-- Redemption: add voiding + notes
ALTER TABLE "Redemption" ADD COLUMN "notes" TEXT;
ALTER TABLE "Redemption" ADD COLUMN "voidedBy" UUID;
ALTER TABLE "Redemption" ADD COLUMN "voidedAt" TIMESTAMP(3);

CREATE INDEX "Redemption_shopId_createdAt_idx" ON "Redemption"("shopId", "createdAt" DESC);

ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_voidedBy_fkey"
FOREIGN KEY ("voidedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

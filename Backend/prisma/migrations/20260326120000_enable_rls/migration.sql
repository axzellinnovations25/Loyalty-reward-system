-- Enable Row Level Security on all tables.
-- The postgres/service_role used by Prisma bypasses RLS automatically.
-- This blocks all direct Supabase client access (anon/authenticated roles).

ALTER TABLE "AdminUser"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Plan"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlanFeature"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Shop"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShopFeatureOverride" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShopSettings"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Purchase"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Redemption"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GiftCard"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reward"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BillingPayment"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlanChangeHistory"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MessageLog"          ENABLE ROW LEVEL SECURITY;

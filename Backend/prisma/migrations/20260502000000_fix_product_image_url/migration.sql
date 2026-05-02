-- Ensure Product.imageUrl exists even if earlier migrations were applied out of order.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;


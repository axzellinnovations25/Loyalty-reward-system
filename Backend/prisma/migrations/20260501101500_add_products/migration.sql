-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" UUID NOT NULL,
    "shopId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" UUID NOT NULL,
    "shopId" UUID NOT NULL,
    "categoryId" UUID,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "description" TEXT,
    "unit" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "cost" DECIMAL(12,2),
    "taxRate" DECIMAL(5,2),
    "trackInventory" BOOLEAN NOT NULL DEFAULT true,
    "stockOnHand" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_shopId_name_key" ON "ProductCategory"("shopId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_shopId_sku_key" ON "Product"("shopId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_shopId_barcode_key" ON "Product"("shopId", "barcode");

-- CreateIndex
CREATE INDEX "ProductCategory_shopId_name_idx" ON "ProductCategory"("shopId", "name");

-- CreateIndex
CREATE INDEX "Product_shopId_name_idx" ON "Product"("shopId", "name");

-- CreateIndex
CREATE INDEX "Product_shopId_categoryId_idx" ON "Product"("shopId", "categoryId");

-- CreateIndex
CREATE INDEX "Product_shopId_deletedAt_idx" ON "Product"("shopId", "deletedAt");

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Enable Row Level Security
ALTER TABLE "ProductCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product"         ENABLE ROW LEVEL SECURITY;


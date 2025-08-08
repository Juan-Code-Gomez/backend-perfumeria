-- Migration: Enhance Products Model for Perfumery Business
-- Adds fields for fragrance management, product variants, pricing, and supplier relationships

-- Agregar campos al modelo Product
ALTER TABLE "Product" ADD COLUMN "sku" VARCHAR(100);
ALTER TABLE "Product" ADD COLUMN "barcode" VARCHAR(255);
ALTER TABLE "Product" ADD COLUMN "fragranceName" VARCHAR(255);
ALTER TABLE "Product" ADD COLUMN "productType" VARCHAR(50) DEFAULT 'SIMPLE';
ALTER TABLE "Product" ADD COLUMN "size" VARCHAR(50);
ALTER TABLE "Product" ADD COLUMN "sizeValue" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN "suggestedPrice" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN "minPrice" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN "maxPrice" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN "hasVariants" BOOLEAN DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "parentProductId" INTEGER;
ALTER TABLE "Product" ADD COLUMN "variantType" VARCHAR(50);
ALTER TABLE "Product" ADD COLUMN "supplierId" INTEGER;
ALTER TABLE "Product" ADD COLUMN "supplierCode" VARCHAR(100);
ALTER TABLE "Product" ADD COLUMN "brand" VARCHAR(255);
ALTER TABLE "Product" ADD COLUMN "gender" VARCHAR(20);
ALTER TABLE "Product" ADD COLUMN "notes" TEXT;
ALTER TABLE "Product" ADD COLUMN "tags" TEXT[];
ALTER TABLE "Product" ADD COLUMN "isComposite" BOOLEAN DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "requiresPreparation" BOOLEAN DEFAULT false;

-- Crear índices para búsquedas eficientes
CREATE INDEX "Product_sku_idx" ON "Product"("sku");
CREATE INDEX "Product_barcode_idx" ON "Product"("barcode");
CREATE INDEX "Product_fragranceName_idx" ON "Product"("fragranceName");
CREATE INDEX "Product_productType_idx" ON "Product"("productType");
CREATE INDEX "Product_parentProductId_idx" ON "Product"("parentProductId");
CREATE INDEX "Product_supplierId_idx" ON "Product"("supplierId");
CREATE INDEX "Product_brand_idx" ON "Product"("brand");
CREATE INDEX "Product_tags_idx" ON "Product" USING gin("tags");

-- Agregar foreign key constraint para parent product
ALTER TABLE "Product" ADD CONSTRAINT "Product_parentProductId_fkey" FOREIGN KEY ("parentProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Agregar foreign key constraint para supplier
ALTER TABLE "Product" ADD CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Crear tabla para componentes de productos compuestos
CREATE TABLE "ProductComponent" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "componentProductId" INTEGER NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL DEFAULT 1,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductComponent_pkey" PRIMARY KEY ("id")
);

-- Crear índices para ProductComponent
CREATE INDEX "ProductComponent_productId_idx" ON "ProductComponent"("productId");
CREATE INDEX "ProductComponent_componentProductId_idx" ON "ProductComponent"("componentProductId");

-- Agregar foreign keys para ProductComponent
ALTER TABLE "ProductComponent" ADD CONSTRAINT "ProductComponent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductComponent" ADD CONSTRAINT "ProductComponent_componentProductId_fkey" FOREIGN KEY ("componentProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Crear tabla para precios históricos
CREATE TABLE "ProductPrice" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "purchasePrice" DECIMAL(10,2),
    "salePrice" DECIMAL(10,2),
    "suggestedPrice" DECIMAL(10,2),
    "supplierId" INTEGER,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductPrice_pkey" PRIMARY KEY ("id")
);

-- Crear índices para ProductPrice
CREATE INDEX "ProductPrice_productId_idx" ON "ProductPrice"("productId");
CREATE INDEX "ProductPrice_supplierId_idx" ON "ProductPrice"("supplierId");
CREATE INDEX "ProductPrice_effectiveDate_idx" ON "ProductPrice"("effectiveDate");
CREATE INDEX "ProductPrice_isActive_idx" ON "ProductPrice"("isActive");

-- Agregar foreign keys para ProductPrice
ALTER TABLE "ProductPrice" ADD CONSTRAINT "ProductPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductPrice" ADD CONSTRAINT "ProductPrice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Crear constraint único para evitar duplicados de SKU activos
CREATE UNIQUE INDEX "Product_sku_unique" ON "Product"("sku") WHERE "isActive" = true AND "sku" IS NOT NULL;

-- Crear constraint único para product components
CREATE UNIQUE INDEX "ProductComponent_unique" ON "ProductComponent"("productId", "componentProductId");

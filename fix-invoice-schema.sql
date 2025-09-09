-- Migration: Add missing Invoice columns
-- Este script debe ejecutarse en la base de datos de Railway

ALTER TABLE "Invoice" 
ADD COLUMN IF NOT EXISTS "hasInventoryImpact" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "inventoryProcessed" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "isHistorical" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "needsReconciliation" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "originalDocument" TEXT,
ADD COLUMN IF NOT EXISTS "pricesAnalyzed" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "supplierId" INTEGER;

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS "Invoice_isHistorical_idx" ON "Invoice"("isHistorical");
CREATE INDEX IF NOT EXISTS "Invoice_supplierId_idx" ON "Invoice"("supplierId");

-- Agregar foreign key constraint si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Invoice_supplierId_fkey'
    ) THEN
        ALTER TABLE "Invoice" 
        ADD CONSTRAINT "Invoice_supplierId_fkey" 
        FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Crear tabla InvoiceItem si no existe
CREATE TABLE IF NOT EXISTS "InvoiceItem" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "productId" INTEGER,
    "productName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "category" TEXT,
    "brand" TEXT,
    "sku" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- Crear índices para InvoiceItem si no existen
CREATE INDEX IF NOT EXISTS "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");
CREATE INDEX IF NOT EXISTS "InvoiceItem_productId_idx" ON "InvoiceItem"("productId");

-- Agregar foreign keys para InvoiceItem si no existen
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'InvoiceItem_invoiceId_fkey'
    ) THEN
        ALTER TABLE "InvoiceItem" 
        ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" 
        FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'InvoiceItem_productId_fkey'
    ) THEN
        ALTER TABLE "InvoiceItem" 
        ADD CONSTRAINT "InvoiceItem_productId_fkey" 
        FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

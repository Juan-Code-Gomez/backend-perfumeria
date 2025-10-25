-- ============================================
-- FIX UNIVERSAL: Todas las columnas faltantes
-- Fecha: 2025-10-25
-- Descripción: Agrega todas las columnas que faltaban en producción
-- Este script es IDEMPOTENTE (se puede ejecutar múltiples veces)
-- ============================================

-- ============================================
-- 1. TABLA PURCHASE - Agregar 6 columnas
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE '📦 Verificando tabla Purchase...'; 
END $$;

ALTER TABLE "Purchase" 
ADD COLUMN IF NOT EXISTS "subtotal" DOUBLE PRECISION;

ALTER TABLE "Purchase" 
ADD COLUMN IF NOT EXISTS "discount" DOUBLE PRECISION DEFAULT 0;

ALTER TABLE "Purchase" 
ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT;

ALTER TABLE "Purchase" 
ADD COLUMN IF NOT EXISTS "invoiceDate" TIMESTAMP(3);

ALTER TABLE "Purchase" 
ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3);

ALTER TABLE "Purchase" 
ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS "Purchase_invoiceNumber_key" ON "Purchase"("invoiceNumber") WHERE "invoiceNumber" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Purchase_invoiceDate_idx" ON "Purchase"("invoiceDate") WHERE "invoiceDate" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Purchase_dueDate_idx" ON "Purchase"("dueDate") WHERE "dueDate" IS NOT NULL;

-- Actualizar subtotal para registros existentes (si está NULL)
UPDATE "Purchase" 
SET "subtotal" = "totalAmount" 
WHERE "subtotal" IS NULL;

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Tabla Purchase actualizada'; 
END $$;

-- ============================================
-- 2. TABLA INVOICE - Agregar columna notes
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE '📄 Verificando tabla Invoice...'; 
END $$;

ALTER TABLE "Invoice" 
ADD COLUMN IF NOT EXISTS "notes" TEXT;

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Tabla Invoice actualizada'; 
END $$;

-- ============================================
-- 3. TABLA INVOICEITEM - Agregar 7 columnas
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE '📋 Verificando tabla InvoiceItem...'; 
END $$;

ALTER TABLE "InvoiceItem" 
ADD COLUMN IF NOT EXISTS "unitPrice" DOUBLE PRECISION;

ALTER TABLE "InvoiceItem" 
ADD COLUMN IF NOT EXISTS "shouldCreateProduct" BOOLEAN DEFAULT false;

ALTER TABLE "InvoiceItem" 
ADD COLUMN IF NOT EXISTS "affectInventory" BOOLEAN DEFAULT true;

ALTER TABLE "InvoiceItem" 
ADD COLUMN IF NOT EXISTS "currentMarketPrice" DOUBLE PRECISION;

ALTER TABLE "InvoiceItem" 
ADD COLUMN IF NOT EXISTS "priceVariation" DOUBLE PRECISION;

ALTER TABLE "InvoiceItem" 
ADD COLUMN IF NOT EXISTS "profitMargin" DOUBLE PRECISION;

ALTER TABLE "InvoiceItem" 
ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Calcular unitPrice para registros existentes
UPDATE "InvoiceItem" 
SET "unitPrice" = CASE 
  WHEN quantity > 0 THEN "totalPrice" / quantity 
  ELSE "totalPrice" 
END
WHERE "unitPrice" IS NULL;

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Tabla InvoiceItem actualizada'; 
END $$;

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================
DO $$ 
DECLARE
  purchase_count INTEGER;
  invoice_count INTEGER;
  invoice_item_count INTEGER;
BEGIN 
  -- Verificar Purchase
  SELECT COUNT(*) INTO purchase_count
  FROM information_schema.columns
  WHERE table_name = 'Purchase' 
  AND column_name IN ('subtotal', 'discount', 'invoiceNumber', 'invoiceDate', 'dueDate', 'notes');

  -- Verificar Invoice
  SELECT COUNT(*) INTO invoice_count
  FROM information_schema.columns
  WHERE table_name = 'Invoice' 
  AND column_name = 'notes';

  -- Verificar InvoiceItem
  SELECT COUNT(*) INTO invoice_item_count
  FROM information_schema.columns
  WHERE table_name = 'InvoiceItem' 
  AND column_name IN ('unitPrice', 'shouldCreateProduct', 'affectInventory', 'currentMarketPrice', 'priceVariation', 'profitMargin', 'notes');

  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '📊 VERIFICACIÓN DE COLUMNAS:';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Purchase: % de 6 columnas agregadas', purchase_count;
  RAISE NOTICE 'Invoice: % de 1 columna agregada', invoice_count;
  RAISE NOTICE 'InvoiceItem: % de 7 columnas agregadas', invoice_item_count;
  
  IF purchase_count = 6 AND invoice_count = 1 AND invoice_item_count = 7 THEN
    RAISE NOTICE '✅ TODAS LAS COLUMNAS AGREGADAS EXITOSAMENTE';
  ELSE
    RAISE WARNING '⚠️  Algunas columnas podrían no haberse agregado';
  END IF;
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

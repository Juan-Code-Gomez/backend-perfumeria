-- ============================================
-- FIX: Agregar columnas faltantes en InvoiceItem
-- Fecha: 2025-10-25
-- Descripción: Agrega 7 columnas faltantes en la tabla InvoiceItem
-- ============================================

-- Agregar columnas faltantes en InvoiceItem
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

-- Para registros existentes, calcular unitPrice desde totalPrice/quantity
UPDATE "InvoiceItem" 
SET "unitPrice" = CASE 
  WHEN quantity > 0 THEN "totalPrice" / quantity 
  ELSE "totalPrice" 
END
WHERE "unitPrice" IS NULL;

-- Verificación
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'InvoiceItem'
ORDER BY ordinal_position;

-- Mensaje de confirmación
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Columnas agregadas exitosamente a InvoiceItem'; 
END $$;

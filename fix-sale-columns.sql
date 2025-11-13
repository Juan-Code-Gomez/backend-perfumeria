-- SQL PARA AGREGAR COLUMNAS FALTANTES A LA TABLA Sale
-- Ejecuta esto DIRECTAMENTE en la BD que Railway está usando

-- 1. Agregar discountAmount
ALTER TABLE "Sale" 
ADD COLUMN IF NOT EXISTS "discountAmount" DOUBLE PRECISION DEFAULT 0;

-- 2. Agregar discountType
ALTER TABLE "Sale" 
ADD COLUMN IF NOT EXISTS "discountType" TEXT;

-- 3. Agregar discountValue  
ALTER TABLE "Sale" 
ADD COLUMN IF NOT EXISTS "discountValue" DOUBLE PRECISION;

-- 4. Agregar subtotalAmount
ALTER TABLE "Sale" 
ADD COLUMN IF NOT EXISTS "subtotalAmount" DOUBLE PRECISION DEFAULT 0;

-- 5. Agregar cashSessionId
ALTER TABLE "Sale" 
ADD COLUMN IF NOT EXISTS "cashSessionId" INTEGER;

-- 6. Verificar que se agregaron
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Sale' 
  AND column_name IN ('discountAmount', 'discountType', 'discountValue', 'subtotalAmount', 'cashSessionId')
ORDER BY column_name;

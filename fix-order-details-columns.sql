-- Agregar columnas faltantes a order_details
-- originalQty: para auditoría de cantidad original antes de ediciones
-- totalPrice: para almacenar el precio total calculado

DO $$ 
BEGIN
  -- Agregar originalQty si no existe
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'order_details' 
    AND column_name = 'originalQty'
  ) THEN
    ALTER TABLE "order_details" ADD COLUMN "originalQty" DOUBLE PRECISION;
    RAISE NOTICE '✅ Columna originalQty agregada';
  ELSE
    RAISE NOTICE 'ℹ️ La columna originalQty ya existe';
  END IF;

  -- Agregar totalPrice si no existe
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'order_details' 
    AND column_name = 'totalPrice'
  ) THEN
    ALTER TABLE "order_details" ADD COLUMN "totalPrice" DOUBLE PRECISION;
    -- Calcular totalPrice para registros existentes
    UPDATE "order_details" SET "totalPrice" = quantity * "unitPrice" WHERE "totalPrice" IS NULL;
    RAISE NOTICE '✅ Columna totalPrice agregada y calculada';
  ELSE
    RAISE NOTICE 'ℹ️ La columna totalPrice ya existe';
  END IF;

  -- Renombrar subtotal a totalPrice si existe subtotal pero no totalPrice
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'order_details' 
    AND column_name = 'subtotal'
  ) AND NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'order_details' 
    AND column_name = 'totalPrice'
  ) THEN
    ALTER TABLE "order_details" RENAME COLUMN "subtotal" TO "totalPrice";
    RAISE NOTICE '✅ Columna subtotal renombrada a totalPrice';
  END IF;

END $$;

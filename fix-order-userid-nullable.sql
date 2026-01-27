-- Hacer el campo userId nullable en la tabla orders
-- El schema de Prisma usa createdById, no userId

DO $$ 
BEGIN
  -- Verificar si la columna userId existe
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'userId'
  ) THEN
    -- Hacer la columna nullable
    ALTER TABLE "orders" ALTER COLUMN "userId" DROP NOT NULL;
    RAISE NOTICE '✅ Columna userId ahora es nullable';
  ELSE
    RAISE NOTICE 'ℹ️ La columna userId no existe';
  END IF;
END $$;

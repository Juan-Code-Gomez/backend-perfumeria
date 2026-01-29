-- Hacer columnas legacy nullable en orders
-- subtotal, tax, discount, total ya no se usan (se usa totalAmount)

DO $$ 
BEGIN
  -- Hacer subtotal nullable si existe
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'subtotal'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE "orders" ALTER COLUMN "subtotal" DROP NOT NULL;
    ALTER TABLE "orders" ALTER COLUMN "subtotal" SET DEFAULT 0;
    RAISE NOTICE '✅ Columna subtotal ahora es nullable';
  END IF;

  -- Hacer tax nullable si existe
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'tax'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE "orders" ALTER COLUMN "tax" DROP NOT NULL;
    ALTER TABLE "orders" ALTER COLUMN "tax" SET DEFAULT 0;
    RAISE NOTICE '✅ Columna tax ahora es nullable';
  END IF;

  -- Hacer discount nullable si existe
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'discount'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE "orders" ALTER COLUMN "discount" DROP NOT NULL;
    ALTER TABLE "orders" ALTER COLUMN "discount" SET DEFAULT 0;
    RAISE NOTICE '✅ Columna discount ahora es nullable';
  END IF;

  -- Hacer total nullable si existe
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'total'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE "orders" ALTER COLUMN "total" DROP NOT NULL;
    ALTER TABLE "orders" ALTER COLUMN "total" SET DEFAULT 0;
    RAISE NOTICE '✅ Columna total ahora es nullable';
  END IF;

  -- Hacer deliveryDate nullable si existe y no lo es
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'deliveryDate'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE "orders" ALTER COLUMN "deliveryDate" DROP NOT NULL;
    RAISE NOTICE '✅ Columna deliveryDate ahora es nullable';
  END IF;

END $$;

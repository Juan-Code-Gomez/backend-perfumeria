-- MIGRACIÓN: Reestructuración limpia del módulo de pedidos
-- Elimina campos legacy y sincroniza con el schema de Prisma

DO $$ 
BEGIN
  RAISE NOTICE '🚀 Iniciando reestructuración del módulo de pedidos...';

  -- ========================================
  -- 1. ELIMINAR COLUMNAS LEGACY DE ORDERS
  -- ========================================
  
  -- Eliminar userId (legacy, ahora se usa createdById)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'userId'
  ) THEN
    -- Primero eliminar el foreign key constraint
    ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_userId_fkey";
    -- Eliminar el índice
    DROP INDEX IF EXISTS "orders_userId_idx";
    -- Eliminar la columna
    ALTER TABLE "orders" DROP COLUMN "userId";
    RAISE NOTICE '✅ Columna userId eliminada de orders';
  END IF;

  -- Eliminar subtotal (legacy, ahora se usa totalAmount)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'subtotal'
  ) THEN
    ALTER TABLE "orders" DROP COLUMN "subtotal";
    RAISE NOTICE '✅ Columna subtotal eliminada de orders';
  END IF;

  -- Eliminar tax (legacy)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'tax'
  ) THEN
    ALTER TABLE "orders" DROP COLUMN "tax";
    RAISE NOTICE '✅ Columna tax eliminada de orders';
  END IF;

  -- Eliminar discount (legacy)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'discount'
  ) THEN
    ALTER TABLE "orders" DROP COLUMN "discount";
    RAISE NOTICE '✅ Columna discount eliminada de orders';
  END IF;

  -- Eliminar total (legacy, se usa totalAmount)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'total'
  ) THEN
    ALTER TABLE "orders" DROP COLUMN "total";
    RAISE NOTICE '✅ Columna total eliminada de orders';
  END IF;

  -- ========================================
  -- 2. AJUSTAR ORDER_DETAILS
  -- ========================================

  -- Eliminar subtotal de order_details (duplicado con totalPrice)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_details' AND column_name = 'subtotal'
  ) THEN
    ALTER TABLE "order_details" DROP COLUMN "subtotal";
    RAISE NOTICE '✅ Columna subtotal eliminada de order_details';
  END IF;

  -- Cambiar quantity de INTEGER a DOUBLE PRECISION (para aceptar decimales)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_details' 
    AND column_name = 'quantity' 
    AND data_type = 'integer'
  ) THEN
    ALTER TABLE "order_details" ALTER COLUMN "quantity" TYPE DOUBLE PRECISION;
    RAISE NOTICE '✅ Columna quantity cambiada a DOUBLE PRECISION';
  END IF;

  -- ========================================
  -- 3. ASEGURAR COLUMNA UPDATEDDAT CON TRIGGER
  -- ========================================

  -- Crear función para actualizar updatedAt automáticamente
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $trigger$
  BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
  END;
  $trigger$ language 'plpgsql';

  -- Aplicar trigger a orders
  DROP TRIGGER IF EXISTS update_orders_updated_at ON "orders";
  CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON "orders"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  -- Aplicar trigger a order_details
  DROP TRIGGER IF EXISTS update_order_details_updated_at ON "order_details";
  CREATE TRIGGER update_order_details_updated_at
    BEFORE UPDATE ON "order_details"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  RAISE NOTICE '✅ Triggers de updatedAt configurados';

  -- ========================================
  -- 4. VERIFICAR ESTRUCTURA FINAL
  -- ========================================

  RAISE NOTICE '';
  RAISE NOTICE '📊 Reestructuración completada exitosamente!';

END $$;

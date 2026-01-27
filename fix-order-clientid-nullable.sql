-- Hacer el campo clientId nullable en la tabla orders
-- Esto permite crear pedidos sin un cliente específico (clientes ocasionales)

DO $$ 
BEGIN
  -- Verificar si la columna existe y no es nullable
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'clientId' 
    AND is_nullable = 'NO'
  ) THEN
    -- Hacer la columna nullable
    ALTER TABLE "orders" ALTER COLUMN "clientId" DROP NOT NULL;
    RAISE NOTICE '✅ Columna clientId ahora es nullable';
  ELSE
    RAISE NOTICE 'ℹ️ La columna clientId ya es nullable o no existe';
  END IF;
END $$;

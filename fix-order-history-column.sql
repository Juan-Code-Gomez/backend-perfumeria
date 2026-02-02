-- Renombrar columna timestamp a createdAt en order_history
-- Este cambio alinea el schema de Prisma con la base de datos

-- Verificar si la columna timestamp existe
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'order_history' 
    AND column_name = 'timestamp'
  ) THEN
    -- Renombrar timestamp a createdAt
    ALTER TABLE order_history RENAME COLUMN timestamp TO "createdAt";
    RAISE NOTICE 'Columna timestamp renombrada a createdAt en order_history';
  ELSE
    RAISE NOTICE 'La columna timestamp no existe o ya fue renombrada';
  END IF;
END $$;

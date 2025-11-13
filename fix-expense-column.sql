-- SQL PARA AGREGAR COLUMNA FALTANTE EN PRODUCCIÓN
-- Ejecutar en Railway > PostgreSQL > Query

-- 1. Agregar columna cashSessionId a la tabla Expense
ALTER TABLE "Expense" 
ADD COLUMN IF NOT EXISTS "cashSessionId" INTEGER;

-- 2. Agregar foreign key constraint
ALTER TABLE "Expense" 
ADD CONSTRAINT "Expense_cashSessionId_fkey" 
FOREIGN KEY ("cashSessionId") REFERENCES "CashSession"("id") 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- 3. Verificar que se agregó correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Expense' 
  AND column_name = 'cashSessionId';

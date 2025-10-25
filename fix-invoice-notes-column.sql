-- ============================================
-- FIX: Agregar columna faltante en tabla Invoice
-- Fecha: 2025-10-25
-- Descripción: Agrega la columna 'notes' a la tabla Invoice
-- ============================================

-- Agregar columna notes (nullable)
ALTER TABLE "Invoice" 
ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Verificación
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Invoice'
ORDER BY ordinal_position;

-- Mensaje de confirmación
DO $$ 
BEGIN 
  RAISE NOTICE 'Columna notes agregada exitosamente a la tabla Invoice'; 
END $$;

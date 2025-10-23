-- Migración: Agregar campo notes a Invoice
-- Fecha: 2025-10-23
-- Descripción: Agrega campo notes (opcional) para notas adicionales en facturas

-- Agregar columna notes
ALTER TABLE "Invoice" 
ADD COLUMN "notes" TEXT;

-- Comentario para documentación
COMMENT ON COLUMN "Invoice"."notes" IS 'Notas adicionales sobre la factura';

-- Verificar
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'Invoice' AND column_name = 'notes';

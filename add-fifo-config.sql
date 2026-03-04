-- Migración: Agregar parámetro de configuración FIFO
-- Fecha: 2026-03-03
-- Descripción: Permite activar/desactivar el modelo FIFO de inventario

-- Agregar el campo useFifoInventory a la tabla company_config
ALTER TABLE company_config 
ADD COLUMN IF NOT EXISTS "useFifoInventory" BOOLEAN NOT NULL DEFAULT true;

-- Comentario explicativo
COMMENT ON COLUMN company_config."useFifoInventory" IS 
'Determina si se usa el modelo FIFO (First In, First Out) para el inventario. 
Si está en TRUE, se crean lotes y se usa FIFO para control de costos.
Si está en FALSE, se actualiza el precio de compra del producto con cada factura.';

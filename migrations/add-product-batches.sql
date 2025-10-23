-- Migración: Agregar tabla product_batches para sistema de lotes FIFO
-- Fecha: 2025-10-22
-- Descripción: Permite tracking de inventario por lotes con costos variables

-- Crear la tabla de lotes de productos
CREATE TABLE IF NOT EXISTS product_batches (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    purchase_id INTEGER,
    quantity DOUBLE PRECISION NOT NULL,
    remaining_qty DOUBLE PRECISION NOT NULL,
    unit_cost DOUBLE PRECISION NOT NULL,
    purchase_date TIMESTAMP(3) NOT NULL,
    expiry_date TIMESTAMP(3),
    batch_number VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_product_batch_product 
        FOREIGN KEY (product_id) 
        REFERENCES "Product"(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_product_batch_purchase 
        FOREIGN KEY (purchase_id) 
        REFERENCES "Purchase"(id) 
        ON DELETE SET NULL,
    
    CONSTRAINT check_remaining_qty 
        CHECK (remaining_qty >= 0 AND remaining_qty <= quantity)
);

-- Índices para optimizar consultas FIFO
CREATE INDEX IF NOT EXISTS idx_product_batches_product_date 
    ON product_batches(product_id, purchase_date);

CREATE INDEX IF NOT EXISTS idx_product_batches_product_remaining 
    ON product_batches(product_id, remaining_qty);

CREATE INDEX IF NOT EXISTS idx_product_batches_expiry 
    ON product_batches(expiry_date) 
    WHERE expiry_date IS NOT NULL;

-- Comentarios para documentación
COMMENT ON TABLE product_batches IS 'Lotes de productos para control de inventario FIFO';
COMMENT ON COLUMN product_batches.quantity IS 'Cantidad inicial del lote';
COMMENT ON COLUMN product_batches.remaining_qty IS 'Cantidad disponible actual';
COMMENT ON COLUMN product_batches.unit_cost IS 'Costo unitario de este lote específico';
COMMENT ON COLUMN product_batches.purchase_date IS 'Fecha de compra para ordenamiento FIFO';
COMMENT ON COLUMN product_batches.expiry_date IS 'Fecha de vencimiento del producto (opcional)';
COMMENT ON COLUMN product_batches.batch_number IS 'Número de lote del proveedor (opcional)';

-- Verificar que se creó correctamente
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'product_batches'
ORDER BY ordinal_position;

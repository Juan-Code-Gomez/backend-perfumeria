-- Crear tabla product_batches (ProductBatch)
-- Esta tabla es esencial para el sistema FIFO de inventario

CREATE TABLE IF NOT EXISTS "product_batches" (
  "id" SERIAL PRIMARY KEY,
  "product_id" INTEGER NOT NULL,
  "purchase_id" INTEGER,
  "quantity" DOUBLE PRECISION NOT NULL,
  "remaining_qty" DOUBLE PRECISION NOT NULL,
  "unit_cost" DOUBLE PRECISION NOT NULL,
  "purchase_date" TIMESTAMP(3) NOT NULL,
  "expiry_date" TIMESTAMP(3),
  "batch_number" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  CONSTRAINT "product_batches_product_id_fkey" 
    FOREIGN KEY ("product_id") 
    REFERENCES "Product"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
    
  CONSTRAINT "product_batches_purchase_id_fkey" 
    FOREIGN KEY ("purchase_id") 
    REFERENCES "Purchase"("id") 
    ON DELETE SET NULL 
    ON UPDATE CASCADE
);

-- Crear índice compuesto para búsqueda FIFO eficiente
CREATE INDEX IF NOT EXISTS "product_batches_product_id_purchase_date_idx" 
  ON "product_batches"("product_id", "purchase_date");

-- Índice adicional para purchase_id
CREATE INDEX IF NOT EXISTS "product_batches_purchase_id_idx" 
  ON "product_batches"("purchase_id");

-- Comentarios para documentación
COMMENT ON TABLE "product_batches" IS 'Lotes de productos para control FIFO de inventario';
COMMENT ON COLUMN "product_batches"."remaining_qty" IS 'Cantidad disponible del lote (se reduce con cada venta)';
COMMENT ON COLUMN "product_batches"."purchase_date" IS 'Fecha de compra - usado para ordenamiento FIFO';

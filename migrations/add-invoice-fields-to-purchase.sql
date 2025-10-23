-- Migración: Agregar campos de factura al modelo Purchase
-- Fecha: 2025-10-23
-- Descripción: Agrega campos para registrar datos de factura del proveedor (número, fechas, descuento)

-- 1. Agregar nuevos campos
ALTER TABLE "Purchase" 
ADD COLUMN "subtotal" DOUBLE PRECISION,
ADD COLUMN "discount" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN "invoiceNumber" TEXT,
ADD COLUMN "invoiceDate" TIMESTAMP(3),
ADD COLUMN "dueDate" TIMESTAMP(3),
ADD COLUMN "notes" TEXT;

-- 2. Migrar datos existentes: calcular subtotal desde details
UPDATE "Purchase" p
SET "subtotal" = (
  SELECT COALESCE(SUM(pd."totalCost"), 0)
  FROM "PurchaseDetail" pd
  WHERE pd."purchaseId" = p.id
)
WHERE "subtotal" IS NULL;

-- 3. Hacer subtotal NOT NULL después de migrar datos
ALTER TABLE "Purchase" 
ALTER COLUMN "subtotal" SET NOT NULL;

-- 4. Agregar constraint para invoiceNumber único (si no es null)
ALTER TABLE "Purchase"
ADD CONSTRAINT "Purchase_invoiceNumber_key" UNIQUE ("invoiceNumber");

-- 5. Crear índices para mejorar búsquedas
CREATE INDEX "Purchase_invoiceNumber_idx" ON "Purchase"("invoiceNumber");
CREATE INDEX "Purchase_invoiceDate_idx" ON "Purchase"("invoiceDate");
CREATE INDEX "Purchase_dueDate_idx" ON "Purchase"("dueDate");

-- 6. Agregar comentarios para documentación
COMMENT ON COLUMN "Purchase"."subtotal" IS 'Suma de (quantity * unitCost) de todos los detalles';
COMMENT ON COLUMN "Purchase"."discount" IS 'Descuento aplicado a la compra';
COMMENT ON COLUMN "Purchase"."totalAmount" IS 'Total final = subtotal - discount';
COMMENT ON COLUMN "Purchase"."invoiceNumber" IS 'Número de factura del proveedor';
COMMENT ON COLUMN "Purchase"."invoiceDate" IS 'Fecha de emisión de la factura';
COMMENT ON COLUMN "Purchase"."dueDate" IS 'Fecha de vencimiento para pago (compras a crédito)';
COMMENT ON COLUMN "Purchase"."notes" IS 'Notas adicionales sobre la compra/factura';

-- Verificación
SELECT 
  COUNT(*) as total_compras,
  COUNT("invoiceNumber") as con_factura,
  SUM("discount") as total_descuentos
FROM "Purchase";

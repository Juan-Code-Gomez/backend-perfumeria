-- Agregar campos faltantes a la tabla Purchase en producción

ALTER TABLE "Purchase" 
ADD COLUMN IF NOT EXISTS "subtotal" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "discount" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT,
ADD COLUMN IF NOT EXISTS "invoiceDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Crear índices
CREATE UNIQUE INDEX IF NOT EXISTS "Purchase_invoiceNumber_key" ON "Purchase"("invoiceNumber");
CREATE INDEX IF NOT EXISTS "Purchase_invoiceNumber_idx" ON "Purchase"("invoiceNumber");
CREATE INDEX IF NOT EXISTS "Purchase_invoiceDate_idx" ON "Purchase"("invoiceDate");
CREATE INDEX IF NOT EXISTS "Purchase_dueDate_idx" ON "Purchase"("dueDate");

-- Actualizar registros existentes (poner subtotal = totalAmount si es NULL)
UPDATE "Purchase" 
SET "subtotal" = "totalAmount" 
WHERE "subtotal" IS NULL;

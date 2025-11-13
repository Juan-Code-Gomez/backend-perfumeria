-- Agregar campos de descuento al modelo Sale
-- Migration: add_discount_fields_to_sales

ALTER TABLE "Sale" ADD COLUMN "subtotalAmount" DOUBLE PRECISION;
ALTER TABLE "Sale" ADD COLUMN "discountType" TEXT;
ALTER TABLE "Sale" ADD COLUMN "discountValue" DOUBLE PRECISION;  
ALTER TABLE "Sale" ADD COLUMN "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Migrar datos existentes: asumir que totalAmount actual es el subtotal
-- ya que no hay descuentos previos registrados
UPDATE "Sale" SET "subtotalAmount" = "totalAmount" WHERE "subtotalAmount" IS NULL;

-- Hacer NOT NULL el subtotalAmount después de la migración
ALTER TABLE "Sale" ALTER COLUMN "subtotalAmount" SET NOT NULL;
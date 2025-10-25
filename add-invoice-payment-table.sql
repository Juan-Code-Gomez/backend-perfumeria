-- Crear tabla InvoicePayment para registrar pagos/abonos de facturas
CREATE TABLE IF NOT EXISTS "InvoicePayment" (
    "id" SERIAL PRIMARY KEY,
    "invoiceId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT,
    "notes" TEXT,
    "expenseId" INTEGER UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvoicePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS "InvoicePayment_invoiceId_idx" ON "InvoicePayment"("invoiceId");
CREATE INDEX IF NOT EXISTS "InvoicePayment_paymentDate_idx" ON "InvoicePayment"("paymentDate");

-- Comentarios para documentación
COMMENT ON TABLE "InvoicePayment" IS 'Registro de pagos y abonos realizados a facturas de proveedores';
COMMENT ON COLUMN "InvoicePayment"."expenseId" IS 'ID del gasto generado automáticamente en la tabla Expense para el cierre de caja';

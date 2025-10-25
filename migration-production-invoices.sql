-- =====================================================
-- SCRIPT COMPLETO DE MIGRACIÓN - MÓDULO DE FACTURAS
-- Sistema de Perfumería - Producción
-- Fecha: 2025-10-25
-- =====================================================

-- Este script incluye TODAS las migraciones necesarias para:
-- 1. Tabla de Facturas (Invoice)
-- 2. Items de Facturas (InvoiceItem)
-- 3. Pagos de Facturas (InvoicePayment)
-- 4. Enum de categorías de gastos actualizado
-- 5. Relaciones y índices

BEGIN;

-- =====================================================
-- PASO 1: Crear tabla Invoice si no existe
-- =====================================================
CREATE TABLE IF NOT EXISTS "Invoice" (
  "id" SERIAL PRIMARY KEY,
  "invoiceNumber" VARCHAR(255) NOT NULL UNIQUE,
  "supplierName" VARCHAR(255) NOT NULL,
  "supplierId" INTEGER,
  "amount" DOUBLE PRECISION NOT NULL,
  "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  "description" TEXT,
  "notes" TEXT,
  "invoiceDate" TIMESTAMP(3) NOT NULL,
  "dueDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "hasInventoryImpact" BOOLEAN NOT NULL DEFAULT true,
  "inventoryProcessed" BOOLEAN NOT NULL DEFAULT false,
  "isHistorical" BOOLEAN NOT NULL DEFAULT false,
  "needsReconciliation" BOOLEAN NOT NULL DEFAULT false,
  "originalDocument" TEXT,
  "pricesAnalyzed" BOOLEAN NOT NULL DEFAULT false
);

-- =====================================================
-- PASO 2: Crear tabla InvoiceItem si no existe
-- =====================================================
CREATE TABLE IF NOT EXISTS "InvoiceItem" (
  "id" SERIAL PRIMARY KEY,
  "invoiceId" INTEGER NOT NULL,
  "productId" INTEGER NOT NULL,
  "description" VARCHAR(255) NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL,
  "unitCost" DOUBLE PRECISION NOT NULL,
  "totalPrice" DOUBLE PRECISION NOT NULL,
  "batchNumber" VARCHAR(100),
  "expiryDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PASO 3: Crear tabla InvoicePayment si no existe
-- =====================================================
CREATE TABLE IF NOT EXISTS "InvoicePayment" (
  "id" SERIAL PRIMARY KEY,
  "invoiceId" INTEGER NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paymentMethod" TEXT,
  "notes" TEXT,
  "expenseId" INTEGER UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PASO 4: Agregar Foreign Keys si no existen
-- =====================================================

-- FK de Invoice a Supplier
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Invoice_supplierId_fkey'
    ) THEN
        ALTER TABLE "Invoice" 
        ADD CONSTRAINT "Invoice_supplierId_fkey" 
        FOREIGN KEY ("supplierId") 
        REFERENCES "Supplier"("id") 
        ON DELETE SET NULL;
    END IF;
END $$;

-- FK de InvoiceItem a Invoice
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'InvoiceItem_invoiceId_fkey'
    ) THEN
        ALTER TABLE "InvoiceItem" 
        ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" 
        FOREIGN KEY ("invoiceId") 
        REFERENCES "Invoice"("id") 
        ON DELETE CASCADE;
    END IF;
END $$;

-- FK de InvoiceItem a Product
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'InvoiceItem_productId_fkey'
    ) THEN
        ALTER TABLE "InvoiceItem" 
        ADD CONSTRAINT "InvoiceItem_productId_fkey" 
        FOREIGN KEY ("productId") 
        REFERENCES "Product"("id") 
        ON DELETE RESTRICT;
    END IF;
END $$;

-- FK de InvoicePayment a Invoice
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'InvoicePayment_invoiceId_fkey'
    ) THEN
        ALTER TABLE "InvoicePayment" 
        ADD CONSTRAINT "InvoicePayment_invoiceId_fkey" 
        FOREIGN KEY ("invoiceId") 
        REFERENCES "Invoice"("id") 
        ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- PASO 5: Crear Índices para optimizar consultas
-- =====================================================

-- Índices para Invoice
CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX IF NOT EXISTS "Invoice_invoiceDate_idx" ON "Invoice"("invoiceDate");
CREATE INDEX IF NOT EXISTS "Invoice_dueDate_idx" ON "Invoice"("dueDate");
CREATE INDEX IF NOT EXISTS "Invoice_isHistorical_idx" ON "Invoice"("isHistorical");
CREATE INDEX IF NOT EXISTS "Invoice_supplierId_idx" ON "Invoice"("supplierId");

-- Índices para InvoiceItem
CREATE INDEX IF NOT EXISTS "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");
CREATE INDEX IF NOT EXISTS "InvoiceItem_productId_idx" ON "InvoiceItem"("productId");

-- Índices para InvoicePayment
CREATE INDEX IF NOT EXISTS "InvoicePayment_invoiceId_idx" ON "InvoicePayment"("invoiceId");
CREATE INDEX IF NOT EXISTS "InvoicePayment_paymentDate_idx" ON "InvoicePayment"("paymentDate");

-- =====================================================
-- PASO 6: Actualizar Enum ExpenseCategory
-- =====================================================

-- Agregar valor SUPPLIER_PAYMENT al enum si no existe
DO $$ 
BEGIN
    -- Verificar si el valor ya existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'SUPPLIER_PAYMENT' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ExpenseCategory')
    ) THEN
        -- Agregar el nuevo valor
        ALTER TYPE "ExpenseCategory" ADD VALUE 'SUPPLIER_PAYMENT';
        RAISE NOTICE '✅ Valor SUPPLIER_PAYMENT agregado al enum ExpenseCategory';
    ELSE
        RAISE NOTICE 'ℹ️  Valor SUPPLIER_PAYMENT ya existe en ExpenseCategory';
    END IF;
END $$;

-- =====================================================
-- PASO 7: Verificación de tablas creadas
-- =====================================================

DO $$
DECLARE
    invoice_count INTEGER;
    invoice_item_count INTEGER;
    invoice_payment_count INTEGER;
BEGIN
    -- Contar tablas existentes
    SELECT COUNT(*) INTO invoice_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'Invoice';
    
    SELECT COUNT(*) INTO invoice_item_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'InvoiceItem';
    
    SELECT COUNT(*) INTO invoice_payment_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'InvoicePayment';
    
    -- Mostrar resultados
    IF invoice_count > 0 THEN
        RAISE NOTICE '✅ Tabla Invoice creada correctamente';
    END IF;
    
    IF invoice_item_count > 0 THEN
        RAISE NOTICE '✅ Tabla InvoiceItem creada correctamente';
    END IF;
    
    IF invoice_payment_count > 0 THEN
        RAISE NOTICE '✅ Tabla InvoicePayment creada correctamente';
    END IF;
END $$;

COMMIT;

-- =====================================================
-- RESUMEN DE CAMBIOS
-- =====================================================
-- Tablas creadas:
--   1. Invoice - Facturas de proveedores
--   2. InvoiceItem - Items/productos de cada factura
--   3. InvoicePayment - Pagos y abonos a facturas
--
-- Relaciones:
--   - Invoice -> Supplier (opcional)
--   - InvoiceItem -> Invoice (cascade delete)
--   - InvoiceItem -> Product (restrict delete)
--   - InvoicePayment -> Invoice (cascade delete)
--
-- Funcionalidades:
--   - Gestión de facturas con FIFO
--   - Control de pagos parciales y totales
--   - Estados: PENDING, PARTIAL, PAID
--   - Integración con cierre de caja (gastos automáticos)
--   - Fecha de vencimiento para facturas a crédito
-- =====================================================

SELECT 'Migración completada exitosamente. El módulo de facturas está listo.' as mensaje;

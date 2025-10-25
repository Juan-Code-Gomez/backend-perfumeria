-- =====================================================
-- SCRIPT DE SINCRONIZACIÓN SEGURA PARA PRODUCCIÓN
-- =====================================================
-- Este script sincroniza SOLO las diferencias detectadas
-- Sin borrar tablas ni datos existentes
-- Versión: 2025-10-25
-- =====================================================

BEGIN;

-- =====================================================
-- 1. ACTUALIZAR ENUM ExpenseCategory
-- =====================================================
-- Agregar SUPPLIER_PAYMENT si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'ExpenseCategory' AND e.enumlabel = 'SUPPLIER_PAYMENT'
    ) THEN
        ALTER TYPE "ExpenseCategory" ADD VALUE 'SUPPLIER_PAYMENT';
    END IF;
END $$;

-- =====================================================
-- 2. TABLA User - Agregar companyCode
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'companyCode'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "companyCode" TEXT;
    END IF;
END $$;

-- =====================================================
-- 3. TABLA Supplier - Hacer NIT nullable
-- =====================================================
DO $$
BEGIN
    ALTER TABLE "Supplier" ALTER COLUMN "nit" DROP NOT NULL;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- =====================================================
-- 4. TABLA Purchase - Agregar campos faltantes
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Purchase' AND column_name = 'subtotal') THEN
        ALTER TABLE "Purchase" ADD COLUMN "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Purchase' AND column_name = 'discount') THEN
        ALTER TABLE "Purchase" ADD COLUMN "discount" DOUBLE PRECISION NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Purchase' AND column_name = 'invoiceNumber') THEN
        ALTER TABLE "Purchase" ADD COLUMN "invoiceNumber" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Purchase' AND column_name = 'invoiceDate') THEN
        ALTER TABLE "Purchase" ADD COLUMN "invoiceDate" TIMESTAMP(3);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Purchase' AND column_name = 'dueDate') THEN
        ALTER TABLE "Purchase" ADD COLUMN "dueDate" TIMESTAMP(3);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Purchase' AND column_name = 'notes') THEN
        ALTER TABLE "Purchase" ADD COLUMN "notes" TEXT;
    END IF;
END $$;

-- Índices para Purchase
CREATE INDEX IF NOT EXISTS "Purchase_invoiceNumber_idx" ON "Purchase"("invoiceNumber");
CREATE INDEX IF NOT EXISTS "Purchase_invoiceDate_idx" ON "Purchase"("invoiceDate");
CREATE INDEX IF NOT EXISTS "Purchase_dueDate_idx" ON "Purchase"("dueDate");
CREATE UNIQUE INDEX IF NOT EXISTS "Purchase_invoiceNumber_key" ON "Purchase"("invoiceNumber");

-- =====================================================
-- 5. TABLA Invoice - Agregar campos faltantes
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Invoice' AND column_name = 'hasInventoryImpact') THEN
        ALTER TABLE "Invoice" ADD COLUMN "hasInventoryImpact" BOOLEAN NOT NULL DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Invoice' AND column_name = 'inventoryProcessed') THEN
        ALTER TABLE "Invoice" ADD COLUMN "inventoryProcessed" BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Invoice' AND column_name = 'isHistorical') THEN
        ALTER TABLE "Invoice" ADD COLUMN "isHistorical" BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Invoice' AND column_name = 'needsReconciliation') THEN
        ALTER TABLE "Invoice" ADD COLUMN "needsReconciliation" BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Invoice' AND column_name = 'notes') THEN
        ALTER TABLE "Invoice" ADD COLUMN "notes" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Invoice' AND column_name = 'originalDocument') THEN
        ALTER TABLE "Invoice" ADD COLUMN "originalDocument" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Invoice' AND column_name = 'pricesAnalyzed') THEN
        ALTER TABLE "Invoice" ADD COLUMN "pricesAnalyzed" BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Invoice' AND column_name = 'supplierId') THEN
        ALTER TABLE "Invoice" ADD COLUMN "supplierId" INTEGER;
    END IF;
END $$;

-- Índices para Invoice
CREATE INDEX IF NOT EXISTS "Invoice_isHistorical_idx" ON "Invoice"("isHistorical");
CREATE INDEX IF NOT EXISTS "Invoice_supplierId_idx" ON "Invoice"("supplierId");

-- Foreign Key para Invoice.supplierId
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Invoice_supplierId_fkey'
    ) THEN
        ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_supplierId_fkey" 
        FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- =====================================================
-- 6. TABLA InvoiceItem - Crear si no existe
-- =====================================================
CREATE TABLE IF NOT EXISTS "InvoiceItem" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "productId" INTEGER,
    "shouldCreateProduct" BOOLEAN NOT NULL DEFAULT false,
    "affectInventory" BOOLEAN NOT NULL DEFAULT true,
    "currentMarketPrice" DOUBLE PRECISION,
    "priceVariation" DOUBLE PRECISION,
    "profitMargin" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- Índices para InvoiceItem
CREATE INDEX IF NOT EXISTS "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");
CREATE INDEX IF NOT EXISTS "InvoiceItem_productId_idx" ON "InvoiceItem"("productId");

-- Foreign Keys para InvoiceItem
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'InvoiceItem_invoiceId_fkey'
    ) THEN
        ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" 
        FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'InvoiceItem_productId_fkey'
    ) THEN
        ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_productId_fkey" 
        FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- =====================================================
-- 7. TABLA InvoicePayment - Crear si no existe
-- =====================================================
CREATE TABLE IF NOT EXISTS "InvoicePayment" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT,
    "notes" TEXT,
    "expenseId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoicePayment_pkey" PRIMARY KEY ("id")
);

-- Índices para InvoicePayment
CREATE UNIQUE INDEX IF NOT EXISTS "InvoicePayment_expenseId_key" ON "InvoicePayment"("expenseId");
CREATE INDEX IF NOT EXISTS "InvoicePayment_invoiceId_idx" ON "InvoicePayment"("invoiceId");
CREATE INDEX IF NOT EXISTS "InvoicePayment_paymentDate_idx" ON "InvoicePayment"("paymentDate");

-- Foreign Key para InvoicePayment
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'InvoicePayment_invoiceId_fkey'
    ) THEN
        ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_invoiceId_fkey" 
        FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- =====================================================
-- 8. TABLA company_config - Crear si no existe
-- =====================================================
CREATE TABLE IF NOT EXISTS "company_config" (
    "id" SERIAL NOT NULL,
    "companyName" TEXT NOT NULL,
    "nit" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "invoicePrefix" TEXT,
    "invoiceFooter" TEXT,
    "taxRate" DOUBLE PRECISION DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'COP',
    "posReceiptHeader" TEXT,
    "posReceiptFooter" TEXT,
    "printLogo" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT NOT NULL DEFAULT 'America/Bogota',
    "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "numberFormat" TEXT NOT NULL DEFAULT 'es-CO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_config_pkey" PRIMARY KEY ("id")
);

-- =====================================================
-- 9. TABLA system_modules - Crear si no existe
-- =====================================================
CREATE TABLE IF NOT EXISTS "system_modules" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "route" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "parentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_modules_pkey" PRIMARY KEY ("id")
);

-- Índices para system_modules
CREATE UNIQUE INDEX IF NOT EXISTS "system_modules_name_key" ON "system_modules"("name");

-- Foreign Key para system_modules
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'system_modules_parentId_fkey'
    ) THEN
        ALTER TABLE "system_modules" ADD CONSTRAINT "system_modules_parentId_fkey" 
        FOREIGN KEY ("parentId") REFERENCES "system_modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- =====================================================
-- 10. TABLA module_permissions - Crear si no existe
-- =====================================================
CREATE TABLE IF NOT EXISTS "module_permissions" (
    "id" SERIAL NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canCreate" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "canExport" BOOLEAN NOT NULL DEFAULT false,
    "customData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_permissions_pkey" PRIMARY KEY ("id")
);

-- Índices para module_permissions
CREATE UNIQUE INDEX IF NOT EXISTS "module_permissions_moduleId_roleId_key" ON "module_permissions"("moduleId", "roleId");

-- Foreign Keys para module_permissions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'module_permissions_moduleId_fkey'
    ) THEN
        ALTER TABLE "module_permissions" ADD CONSTRAINT "module_permissions_moduleId_fkey" 
        FOREIGN KEY ("moduleId") REFERENCES "system_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'module_permissions_roleId_fkey'
    ) THEN
        ALTER TABLE "module_permissions" ADD CONSTRAINT "module_permissions_roleId_fkey" 
        FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- =====================================================
-- 11. TABLA system_parameters - Crear si no existe
-- =====================================================
CREATE TABLE IF NOT EXISTS "system_parameters" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER,
    "parameter_key" TEXT NOT NULL,
    "parameter_value" BOOLEAN NOT NULL DEFAULT false,
    "parameter_type" TEXT NOT NULL DEFAULT 'boolean',
    "string_value" TEXT,
    "number_value" DECIMAL(65,30),
    "json_value" JSONB,
    "description" TEXT,
    "category" TEXT DEFAULT 'general',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_parameters_pkey" PRIMARY KEY ("id")
);

-- Índices para system_parameters
CREATE UNIQUE INDEX IF NOT EXISTS "system_parameters_parameter_key_key" ON "system_parameters"("parameter_key");

-- =====================================================
-- 12. TABLA product_batches - Crear si no existe
-- =====================================================
CREATE TABLE IF NOT EXISTS "product_batches" (
    "id" SERIAL NOT NULL,
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
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_batches_pkey" PRIMARY KEY ("id")
);

-- Índices para product_batches
CREATE INDEX IF NOT EXISTS "product_batches_expiry_date_idx" ON "product_batches"("expiry_date");
CREATE INDEX IF NOT EXISTS "product_batches_product_id_purchase_date_idx" ON "product_batches"("product_id", "purchase_date");
CREATE INDEX IF NOT EXISTS "product_batches_product_id_remaining_qty_idx" ON "product_batches"("product_id", "remaining_qty");

-- Foreign Keys para product_batches
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'product_batches_product_id_fkey'
    ) THEN
        ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_product_id_fkey" 
        FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'product_batches_purchase_id_fkey'
    ) THEN
        ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_purchase_id_fkey" 
        FOREIGN KEY ("purchase_id") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

COMMIT;

-- =====================================================
-- VERIFICACIONES POST-MIGRACIÓN
-- =====================================================

-- Verificar tablas creadas
SELECT 'Tablas creadas:' as status;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'InvoiceItem', 
    'InvoicePayment', 
    'company_config', 
    'module_permissions', 
    'product_batches', 
    'system_modules', 
    'system_parameters'
)
ORDER BY table_name;

-- Verificar enum actualizado
SELECT 'Valores del enum ExpenseCategory:' as status;
SELECT e.enumlabel 
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'ExpenseCategory'
ORDER BY e.enumlabel;

-- Verificar columnas agregadas a Invoice
SELECT 'Columnas de Invoice:' as status;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'Invoice'
AND column_name IN (
    'hasInventoryImpact', 
    'inventoryProcessed', 
    'isHistorical', 
    'supplierId',
    'notes'
)
ORDER BY column_name;

-- Verificar columnas agregadas a Purchase
SELECT 'Columnas de Purchase:' as status;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'Purchase'
AND column_name IN (
    'subtotal', 
    'discount', 
    'invoiceNumber', 
    'invoiceDate',
    'dueDate'
)
ORDER BY column_name;

SELECT 'SINCRONIZACIÓN COMPLETADA EXITOSAMENTE ✓' as status;

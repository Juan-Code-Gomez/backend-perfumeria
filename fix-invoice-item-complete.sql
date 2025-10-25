-- CORRECCIÓN COMPLETA DE InvoiceItem
-- Este script elimina campos obsoletos y asegura que coincida con schema.prisma

DO $$ 
DECLARE
    column_count INTEGER;
BEGIN
    -- 1. Verificar si unitCost existe (campo viejo)
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'InvoiceItem' AND column_name = 'unitCost';
    
    IF column_count > 0 THEN
        -- Migrar datos de unitCost a unitPrice si unitPrice no existe
        SELECT COUNT(*) INTO column_count
        FROM information_schema.columns
        WHERE table_name = 'InvoiceItem' AND column_name = 'unitPrice';
        
        IF column_count = 0 THEN
            ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "unitPrice" DOUBLE PRECISION;
            UPDATE "InvoiceItem" SET "unitPrice" = "unitCost" WHERE "unitPrice" IS NULL;
            RAISE NOTICE 'Datos migrados de unitCost a unitPrice';
        END IF;
        
        -- Eliminar unitCost
        ALTER TABLE "InvoiceItem" DROP COLUMN IF EXISTS "unitCost";
        RAISE NOTICE 'Columna unitCost eliminada';
    END IF;

    -- 2. Eliminar campos obsoletos que no están en schema.prisma
    ALTER TABLE "InvoiceItem" DROP COLUMN IF EXISTS "batchNumber";
    RAISE NOTICE 'Columna batchNumber eliminada si existía';
    
    ALTER TABLE "InvoiceItem" DROP COLUMN IF EXISTS "expiryDate";
    RAISE NOTICE 'Columna expiryDate eliminada si existía';

    -- 3. Asegurar que todos los campos del schema existan
    ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "unitPrice" DOUBLE PRECISION;
    ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "shouldCreateProduct" BOOLEAN DEFAULT false;
    ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "affectInventory" BOOLEAN DEFAULT true;
    ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "currentMarketPrice" DOUBLE PRECISION;
    ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "priceVariation" DOUBLE PRECISION;
    ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "profitMargin" DOUBLE PRECISION;
    ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "notes" TEXT;

    -- 4. Calcular unitPrice si está NULL (desde totalPrice / quantity)
    UPDATE "InvoiceItem" 
    SET "unitPrice" = "totalPrice" / NULLIF("quantity", 0)
    WHERE "unitPrice" IS NULL AND "quantity" > 0;

    RAISE NOTICE 'Tabla InvoiceItem actualizada correctamente';
END $$;

-- Verificar el resultado
SELECT 
    'InvoiceItem' as tabla,
    COUNT(*) as total_columnas,
    STRING_AGG(column_name, ', ' ORDER BY ordinal_position) as columnas
FROM information_schema.columns
WHERE table_name = 'InvoiceItem'
GROUP BY table_name;

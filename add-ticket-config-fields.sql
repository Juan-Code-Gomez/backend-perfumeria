-- Agregar campos de configuración de ticket POS a company_config
-- Usa IF NOT EXISTS para evitar errores si ya existen

DO $$ 
BEGIN
    -- showLogo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='company_config' AND column_name='showLogo') THEN
        ALTER TABLE company_config ADD COLUMN "showLogo" BOOLEAN DEFAULT true;
    END IF;
    
    -- showNIT
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='company_config' AND column_name='showNIT') THEN
        ALTER TABLE company_config ADD COLUMN "showNIT" BOOLEAN DEFAULT true;
    END IF;
    
    -- showAddress
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='company_config' AND column_name='showAddress') THEN
        ALTER TABLE company_config ADD COLUMN "showAddress" BOOLEAN DEFAULT true;
    END IF;
    
    -- showPhone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='company_config' AND column_name='showPhone') THEN
        ALTER TABLE company_config ADD COLUMN "showPhone" BOOLEAN DEFAULT true;
    END IF;
    
    -- showEmail
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='company_config' AND column_name='showEmail') THEN
        ALTER TABLE company_config ADD COLUMN "showEmail" BOOLEAN DEFAULT true;
    END IF;
    
    -- showWebsite
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='company_config' AND column_name='showWebsite') THEN
        ALTER TABLE company_config ADD COLUMN "showWebsite" BOOLEAN DEFAULT true;
    END IF;
    
    -- ticketWidth
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='company_config' AND column_name='ticketWidth') THEN
        ALTER TABLE company_config ADD COLUMN "ticketWidth" VARCHAR(10) DEFAULT '80mm';
    END IF;
    
    -- fontSize
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='company_config' AND column_name='fontSize') THEN
        ALTER TABLE company_config ADD COLUMN "fontSize" VARCHAR(10) DEFAULT 'medium';
    END IF;
    
    -- includeVendor
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='company_config' AND column_name='includeVendor') THEN
        ALTER TABLE company_config ADD COLUMN "includeVendor" BOOLEAN DEFAULT true;
    END IF;
    
    -- includeCashSession
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='company_config' AND column_name='includeCashSession') THEN
        ALTER TABLE company_config ADD COLUMN "includeCashSession" BOOLEAN DEFAULT false;
    END IF;
END $$;


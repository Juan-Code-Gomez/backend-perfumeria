#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

// Configurar la URL para el servidor de prueba
process.env.DATABASE_URL = 'postgresql://postgres:bFVTvxEHHlbUhYzAjePffYeBOFNmHrWy@mainline.proxy.rlwy.net:32067/railway';

const prisma = new PrismaClient();

async function main() {
  console.log('Creando tabla company_config...\n');
  
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "company_config" (
        "id" SERIAL PRIMARY KEY,
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
        "showLogo" BOOLEAN NOT NULL DEFAULT true,
        "showNIT" BOOLEAN NOT NULL DEFAULT true,
        "showAddress" BOOLEAN NOT NULL DEFAULT true,
        "showPhone" BOOLEAN NOT NULL DEFAULT true,
        "showEmail" BOOLEAN NOT NULL DEFAULT true,
        "showWebsite" BOOLEAN NOT NULL DEFAULT true,
        "ticketWidth" TEXT NOT NULL DEFAULT '80mm',
        "fontSize" TEXT NOT NULL DEFAULT 'medium',
        "includeVendor" BOOLEAN NOT NULL DEFAULT true,
        "includeCashSession" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✓ Tabla company_config creada exitosamente\n');
    
    // Verificar que la tabla existe
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'company_config'
      ) as exists
    `;
    
    console.log('Tabla existe:', tableExists[0].exists ? 'Sí' : 'No');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

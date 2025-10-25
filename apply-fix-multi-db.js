const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ============================================
// CONFIGURACIÓN DE BASES DE DATOS
// ============================================
// Leer desde variables de entorno
const databases = [
  {
    name: 'Producción Principal',
    url: process.env.DATABASE_URL,
  },
  {
    name: 'Cliente 2',
    url: process.env.DATABASE_URL_CLIENT_2,
  },
  {
    name: 'Cliente 3',
    url: process.env.DATABASE_URL_CLIENT_3,
  },
  {
    name: 'Cliente 4',
    url: process.env.DATABASE_URL_CLIENT_4,
  },
].filter(db => db.url); // Solo incluir bases de datos con URL configurada

// ============================================
// FUNCIÓN PARA APLICAR FIX EN UNA BD
// ============================================
async function applyFixToDatabase(dbConfig) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbConfig.url,
      },
    },
  });

  try {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`🔧 Aplicando fix a: ${dbConfig.name}`);
    console.log(`${'═'.repeat(60)}`);

    // Primero verificar conexión
    console.log('🔌 Probando conexión...');
    await prisma.$connect();
    console.log('✅ Conexión exitosa');

    // Ejecutar cada ALTER TABLE individualmente
    console.log('📝 Aplicando cambios en tabla Purchase...');
    
    // Purchase - subtotal
    await prisma.$executeRawUnsafe(`ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "subtotal" DOUBLE PRECISION;`);
    
    // Purchase - discount
    await prisma.$executeRawUnsafe(`ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "discount" DOUBLE PRECISION DEFAULT 0;`);
    
    // Purchase - invoiceNumber
    await prisma.$executeRawUnsafe(`ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT;`);
    
    // Purchase - invoiceDate
    await prisma.$executeRawUnsafe(`ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "invoiceDate" TIMESTAMP(3);`);
    
    // Purchase - dueDate
    await prisma.$executeRawUnsafe(`ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3);`);
    
    // Purchase - notes
    await prisma.$executeRawUnsafe(`ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "notes" TEXT;`);

    // Crear índices
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Purchase_invoiceNumber_key" ON "Purchase"("invoiceNumber") WHERE "invoiceNumber" IS NOT NULL;`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Purchase_invoiceDate_idx" ON "Purchase"("invoiceDate") WHERE "invoiceDate" IS NOT NULL;`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Purchase_dueDate_idx" ON "Purchase"("dueDate") WHERE "dueDate" IS NOT NULL;`);
    } catch (indexError) {
      console.log('⚠️  Advertencia al crear índices (probablemente ya existen)');
    }

    // Actualizar subtotal para registros existentes
    await prisma.$executeRawUnsafe(`UPDATE "Purchase" SET "subtotal" = "totalAmount" WHERE "subtotal" IS NULL;`);

    console.log('📝 Aplicando cambios en tabla Invoice...');
    
    // Invoice - notes
    await prisma.$executeRawUnsafe(`ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "notes" TEXT;`);

    console.log('📝 Aplicando cambios en tabla InvoiceItem...');
    
    // InvoiceItem - unitPrice
    await prisma.$executeRawUnsafe(`ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "unitPrice" DOUBLE PRECISION;`);
    
    // InvoiceItem - shouldCreateProduct
    await prisma.$executeRawUnsafe(`ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "shouldCreateProduct" BOOLEAN DEFAULT false;`);
    
    // InvoiceItem - affectInventory
    await prisma.$executeRawUnsafe(`ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "affectInventory" BOOLEAN DEFAULT true;`);
    
    // InvoiceItem - currentMarketPrice
    await prisma.$executeRawUnsafe(`ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "currentMarketPrice" DOUBLE PRECISION;`);
    
    // InvoiceItem - priceVariation
    await prisma.$executeRawUnsafe(`ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "priceVariation" DOUBLE PRECISION;`);
    
    // InvoiceItem - profitMargin
    await prisma.$executeRawUnsafe(`ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "profitMargin" DOUBLE PRECISION;`);
    
    // InvoiceItem - notes
    await prisma.$executeRawUnsafe(`ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "notes" TEXT;`);

    // Calcular unitPrice para registros existentes
    await prisma.$executeRawUnsafe(`
      UPDATE "InvoiceItem" 
      SET "unitPrice" = CASE 
        WHEN quantity > 0 THEN "totalPrice" / quantity 
        ELSE "totalPrice" 
      END
      WHERE "unitPrice" IS NULL;
    `);

    // Verificar columnas de Purchase
    const purchaseColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'Purchase' 
      AND column_name IN ('subtotal', 'discount', 'invoiceNumber', 'invoiceDate', 'dueDate', 'notes')
      ORDER BY column_name;
    `;

    // Verificar columnas de Invoice
    const invoiceNotes = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'Invoice' 
      AND column_name = 'notes';
    `;

    // Verificar columnas de InvoiceItem
    const invoiceItemColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'InvoiceItem' 
      AND column_name IN ('unitPrice', 'shouldCreateProduct', 'affectInventory', 'currentMarketPrice', 'priceVariation', 'profitMargin', 'notes')
      ORDER BY column_name;
    `;

    console.log('\n📊 Verificación:');
    console.log(`  Purchase: ${purchaseColumns.length}/6 columnas agregadas`);
    purchaseColumns.forEach(col => {
      console.log(`    ✓ ${col.column_name}`);
    });
    console.log(`  Invoice: ${invoiceNotes.length}/1 columna agregada`);
    if (invoiceNotes.length > 0) {
      console.log(`    ✓ notes`);
    }
    console.log(`  InvoiceItem: ${invoiceItemColumns.length}/7 columnas agregadas`);
    invoiceItemColumns.forEach(col => {
      console.log(`    ✓ ${col.column_name}`);
    });

    if (purchaseColumns.length === 6 && invoiceNotes.length === 1 && invoiceItemColumns.length === 7) {
      console.log('\n✅ FIX APLICADO EXITOSAMENTE');
      return { success: true, database: dbConfig.name };
    } else {
      console.log('\n⚠️  Algunas columnas podrían no haberse agregado');
      return { 
        success: false, 
        database: dbConfig.name,
        error: 'No todas las columnas fueron agregadas',
        details: {
          purchase: purchaseColumns.length,
          invoice: invoiceNotes.length,
          invoiceItem: invoiceItemColumns.length
        }
      };
    }

  } catch (error) {
    console.error(`\n❌ Error en ${dbConfig.name}:`, error.message);
    return { 
      success: false, 
      database: dbConfig.name, 
      error: error.message 
    };
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================
async function applyFixToAllDatabases() {
  console.log('🚀 INICIANDO APLICACIÓN DE FIXES EN MÚLTIPLES BASES DE DATOS');
  console.log(`Total de bases de datos configuradas: ${databases.length}\n`);

  if (databases.length === 0) {
    console.error('❌ No hay bases de datos configuradas.');
    console.error('📝 Configura las variables de entorno DATABASE_URL_CLIENT_X en tu archivo .env');
    process.exit(1);
  }

  const results = [];

  // Ejecutar en serie (una por una) para evitar problemas de conexión
  for (const db of databases) {
    const result = await applyFixToDatabase(db);
    results.push(result);
    
    // Pequeña pausa entre bases de datos
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Mostrar resumen final
  console.log('\n\n');
  console.log('═'.repeat(60));
  console.log('📈 RESUMEN FINAL');
  console.log('═'.repeat(60));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n✅ Exitosos: ${successful.length}/${results.length}`);
  successful.forEach(r => {
    console.log(`   ✓ ${r.database}`);
  });

  if (failed.length > 0) {
    console.log(`\n❌ Fallidos: ${failed.length}/${results.length}`);
    failed.forEach(r => {
      console.log(`   ✗ ${r.database}`);
      console.log(`     Error: ${r.error}`);
      if (r.details) {
        console.log(`     Detalles: Purchase ${r.details.purchase}/6, Invoice ${r.details.invoice}/1`);
      }
    });
  }

  console.log('\n' + '═'.repeat(60));

  return { successful: successful.length, failed: failed.length };
}

// ============================================
// EJECUTAR
// ============================================
if (require.main === module) {
  applyFixToAllDatabases()
    .then((summary) => {
      console.log('\n🎉 Proceso completado');
      console.log(`   Exitosos: ${summary.successful}`);
      console.log(`   Fallidos: ${summary.failed}`);
      process.exit(summary.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('\n💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { applyFixToAllDatabases };

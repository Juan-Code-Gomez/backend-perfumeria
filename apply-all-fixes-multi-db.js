const { PrismaClient } = require('@prisma/client');

// Script definitivo para aplicar TODOS los fixes a múltiples bases de datos
// Incluye: Purchase, Invoice e InvoiceItem

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
].filter(db => db.url); // Solo procesar las que tengan URL

async function applyAllFixes(databaseUrl, dbName) {
  const prisma = new PrismaClient({
    datasources: {
      db: { url: databaseUrl }
    }
  });

  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Base de datos: ${dbName}`);
    console.log(`${'='.repeat(60)}\n`);

    // ==================== PURCHASE ====================
    console.log('1️⃣  Tabla Purchase...');
    
    await prisma.$executeRaw`
      ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "subtotal" DOUBLE PRECISION;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "discount" DOUBLE PRECISION DEFAULT 0;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "invoiceDate" TIMESTAMP(3);
    `;
    await prisma.$executeRaw`
      ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3);
    `;
    await prisma.$executeRaw`
      ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "notes" TEXT;
    `;
    
    // Calcular subtotal donde sea NULL
    await prisma.$executeRaw`
      UPDATE "Purchase" 
      SET "subtotal" = "totalAmount" - COALESCE("discount", 0)
      WHERE "subtotal" IS NULL;
    `;
    
    console.log('   ✅ Purchase (6 columnas)');

    // ==================== INVOICE ====================
    console.log('2️⃣  Tabla Invoice...');
    
    await prisma.$executeRaw`
      ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "notes" TEXT;
    `;
    
    console.log('   ✅ Invoice (1 columna)');

    // ==================== INVOICE ITEM ====================
    console.log('3️⃣  Tabla InvoiceItem...');
    
    // Paso 1: Migrar unitCost a unitPrice si existe
    const hasUnitCost = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_name = 'InvoiceItem' AND column_name = 'unitCost';
    `;
    
    if (hasUnitCost[0].count > 0) {
      console.log('   → Migrando unitCost a unitPrice...');
      
      await prisma.$executeRaw`
        ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "unitPrice" DOUBLE PRECISION;
      `;
      
      await prisma.$executeRaw`
        UPDATE "InvoiceItem" SET "unitPrice" = "unitCost" WHERE "unitPrice" IS NULL;
      `;
      
      await prisma.$executeRaw`
        ALTER TABLE "InvoiceItem" DROP COLUMN "unitCost";
      `;
    }

    // Paso 2: Eliminar campos obsoletos
    try {
      await prisma.$executeRaw`
        ALTER TABLE "InvoiceItem" DROP COLUMN IF EXISTS "batchNumber";
      `;
    } catch (e) {}
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE "InvoiceItem" DROP COLUMN IF EXISTS "expiryDate";
      `;
    } catch (e) {}

    // Paso 3: Agregar campos del schema
    await prisma.$executeRaw`
      ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "unitPrice" DOUBLE PRECISION;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "shouldCreateProduct" BOOLEAN DEFAULT false;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "affectInventory" BOOLEAN DEFAULT true;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "currentMarketPrice" DOUBLE PRECISION;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "priceVariation" DOUBLE PRECISION;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "profitMargin" DOUBLE PRECISION;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "notes" TEXT;
    `;

    // Calcular unitPrice donde sea NULL
    await prisma.$executeRaw`
      UPDATE "InvoiceItem" 
      SET "unitPrice" = "totalPrice" / NULLIF("quantity", 0)
      WHERE "unitPrice" IS NULL AND "quantity" > 0;
    `;
    
    console.log('   ✅ InvoiceItem (7 columnas + limpieza)');

    // ==================== VERIFICACIÓN ====================
    console.log('\n📊 VERIFICACIÓN:');
    
    const purchaseCols = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'Purchase' 
      AND column_name IN ('subtotal', 'discount', 'invoiceNumber', 'invoiceDate', 'dueDate', 'notes');
    `;
    
    const invoiceCols = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'Invoice' AND column_name = 'notes';
    `;
    
    const invoiceItemCols = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'InvoiceItem' 
      AND column_name IN ('unitPrice', 'shouldCreateProduct', 'affectInventory', 'currentMarketPrice', 'priceVariation', 'profitMargin', 'notes');
    `;
    
    const purchaseOk = purchaseCols.length === 6;
    const invoiceOk = invoiceCols.length === 1;
    const invoiceItemOk = invoiceItemCols.length === 7;
    
    console.log(`   Purchase: ${purchaseCols.length}/6 columnas ${purchaseOk ? '✅' : '❌'}`);
    console.log(`   Invoice: ${invoiceCols.length}/1 columna ${invoiceOk ? '✅' : '❌'}`);
    console.log(`   InvoiceItem: ${invoiceItemCols.length}/7 columnas ${invoiceItemOk ? '✅' : '❌'}`);
    
    if (purchaseOk && invoiceOk && invoiceItemOk) {
      console.log('\n   ✅ TODOS LOS FIXES APLICADOS CORRECTAMENTE');
      return { success: true, dbName };
    } else {
      console.log('\n   ⚠️  ALGUNOS FIXES NO SE APLICARON COMPLETAMENTE');
      return { success: false, dbName, details: { purchaseOk, invoiceOk, invoiceItemOk } };
    }

  } catch (error) {
    console.error(`\n❌ Error en ${dbName}:`, error.message);
    return { success: false, dbName, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('\n🔧 APLICANDO FIXES COMPLETOS A TODAS LAS BASES DE DATOS\n');
  console.log(`Total de bases de datos: ${databases.length}\n`);

  const results = [];

  for (const db of databases) {
    const result = await applyAllFixes(db.url, db.name);
    results.push(result);
  }

  // Resumen
  console.log('\n\n' + '='.repeat(60));
  console.log('📈 RESUMEN FINAL');
  console.log('='.repeat(60) + '\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Exitosos: ${successful.length}/${databases.length}`);
  successful.forEach(r => console.log(`   ✓ ${r.dbName}`));

  if (failed.length > 0) {
    console.log(`\n❌ Fallidos: ${failed.length}/${databases.length}`);
    failed.forEach(r => {
      console.log(`   ✗ ${r.dbName}`);
      if (r.error) console.log(`     Error: ${r.error}`);
      if (r.details) console.log(`     Detalles:`, r.details);
    });
  }

  console.log('\n' + '='.repeat(60) + '\n');

  if (successful.length === databases.length) {
    console.log('🎉 ¡TODOS LOS FIXES APLICADOS EXITOSAMENTE!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Algunos fixes fallaron. Revisa los errores arriba.\n');
    process.exit(1);
  }
}

main();

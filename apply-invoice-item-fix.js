const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyFix() {
  try {
    console.log('📝 Aplicando corrección completa de InvoiceItem...\n');
    
    // 1. Migrar unitCost a unitPrice si existe
    console.log('1. Verificando campo unitCost...');
    const hasUnitCost = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_name = 'InvoiceItem' AND column_name = 'unitCost';
    `;
    
    if (hasUnitCost[0].count > 0) {
      console.log('   → Migrando datos de unitCost a unitPrice...');
      
      // Crear unitPrice si no existe
      await prisma.$executeRaw`
        ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "unitPrice" DOUBLE PRECISION;
      `;
      
      // Copiar datos
      await prisma.$executeRaw`
        UPDATE "InvoiceItem" SET "unitPrice" = "unitCost" WHERE "unitPrice" IS NULL;
      `;
      
      // Eliminar unitCost
      await prisma.$executeRaw`
        ALTER TABLE "InvoiceItem" DROP COLUMN "unitCost";
      `;
      
      console.log('   ✅ unitCost → unitPrice migrado y eliminado');
    } else {
      console.log('   ✅ unitCost no existe (correcto)');
    }

    // 2. Eliminar campos obsoletos
    console.log('\n2. Eliminando campos obsoletos...');
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE "InvoiceItem" DROP COLUMN IF EXISTS "batchNumber";
      `;
      console.log('   ✅ batchNumber eliminado');
    } catch (e) {
      console.log('   → batchNumber no existe');
    }
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE "InvoiceItem" DROP COLUMN IF EXISTS "expiryDate";
      `;
      console.log('   ✅ expiryDate eliminado');
    } catch (e) {
      console.log('   → expiryDate no existe');
    }

    // 3. Agregar campos del schema.prisma
    console.log('\n3. Agregando campos del schema...');
    
    await prisma.$executeRaw`
      ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "unitPrice" DOUBLE PRECISION;
    `;
    console.log('   ✅ unitPrice');
    
    await prisma.$executeRaw`
      ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "shouldCreateProduct" BOOLEAN DEFAULT false;
    `;
    console.log('   ✅ shouldCreateProduct');
    
    await prisma.$executeRaw`
      ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "affectInventory" BOOLEAN DEFAULT true;
    `;
    console.log('   ✅ affectInventory');
    
    await prisma.$executeRaw`
      ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "currentMarketPrice" DOUBLE PRECISION;
    `;
    console.log('   ✅ currentMarketPrice');
    
    await prisma.$executeRaw`
      ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "priceVariation" DOUBLE PRECISION;
    `;
    console.log('   ✅ priceVariation');
    
    await prisma.$executeRaw`
      ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "profitMargin" DOUBLE PRECISION;
    `;
    console.log('   ✅ profitMargin');
    
    await prisma.$executeRaw`
      ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "notes" TEXT;
    `;
    console.log('   ✅ notes');

    // 4. Calcular unitPrice donde sea NULL
    console.log('\n4. Calculando unitPrice faltantes...');
    const updated = await prisma.$executeRaw`
      UPDATE "InvoiceItem" 
      SET "unitPrice" = "totalPrice" / NULLIF("quantity", 0)
      WHERE "unitPrice" IS NULL AND "quantity" > 0;
    `;
    console.log(`   ✅ ${updated} registros actualizados`);

    // 5. Verificar resultado
    console.log('\n5. Verificando columnas finales...');
    const columns = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'InvoiceItem'
      ORDER BY ordinal_position;
    `;
    
    console.log('\n📊 RESULTADO FINAL:');
    console.log(`   Total columnas: ${columns.length}`);
    console.log(`   Columnas: ${columns.map(c => c.column_name).join(', ')}`);
    
    console.log('\n✅ InvoiceItem corregido completamente!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyFix();

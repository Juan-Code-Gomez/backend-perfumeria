const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProductBatchTable() {
  try {
    console.log('\n🔍 Verificando tabla product_batches...\n');
    
    // Verificar si la tabla existe
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%batch%'
      ORDER BY table_name;
    `;
    
    console.log('📋 Tablas relacionadas con "batch":\n');
    if (tables.length > 0) {
      tables.forEach(t => console.log(`   ✓ ${t.table_name}`));
    } else {
      console.log('   ❌ NO hay tablas con "batch" en el nombre');
    }
    
    // Intentar contar registros
    try {
      const count = await prisma.productBatch.count();
      console.log(`\n✅ Tabla ProductBatch existe con ${count} registros`);
    } catch (e) {
      console.log('\n❌ Tabla ProductBatch NO existe');
      console.log(`   Error: ${e.message}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductBatchTable();

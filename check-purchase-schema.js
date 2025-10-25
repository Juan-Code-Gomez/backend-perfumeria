const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPurchaseColumns() {
  console.log('\n🔍 Verificando columnas de la tabla Purchase...\n');
  
  try {
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Purchase'
      ORDER BY ordinal_position
    `;
    
    console.log('Columnas en la BD de producción:\n');
    columns.forEach(col => {
      console.log(`  ${col.column_name.padEnd(20)} ${col.data_type.padEnd(30)} ${col.is_nullable}`);
    });
    
    console.log('\n');
    
    // Verificar si existe subtotal
    const hasSubtotal = columns.some(col => col.column_name === 'subtotal');
    const hasDiscount = columns.some(col => col.column_name === 'discount');
    
    console.log('📊 Análisis:');
    console.log(`  ¿Existe 'subtotal'? ${hasSubtotal ? '✅ SÍ' : '❌ NO'}`);
    console.log(`  ¿Existe 'discount'? ${hasDiscount ? '✅ SÍ' : '❌ NO'}`);
    
    if (!hasSubtotal || !hasDiscount) {
      console.log('\n⚠️  PROBLEMA ENCONTRADO:');
      console.log('  El schema.prisma tiene campos que NO existen en la BD.');
      console.log('  Esto indica que falta una migración.\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPurchaseColumns();

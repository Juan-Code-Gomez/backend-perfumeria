const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyInvoiceItemStructure() {
  console.log('\n🔍 Verificando estructura de InvoiceItem en producción...\n');
  
  const columns = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'InvoiceItem' 
    ORDER BY ordinal_position;
  `;
  
  console.log('📋 Columnas actuales de InvoiceItem:\n');
  columns.forEach((c, i) => {
    console.log(`   ${i+1}. ${c.column_name.padEnd(25)} ${c.data_type.padEnd(30)} ${c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
  });
  
  console.log(`\n📊 Total: ${columns.length} columnas`);
  
  // Verificar campos específicos
  const requiredFields = ['id', 'invoiceId', 'productId', 'description', 'quantity', 'unitPrice', 'totalPrice'];
  const newFields = ['shouldCreateProduct', 'affectInventory', 'currentMarketPrice', 'priceVariation', 'profitMargin', 'notes'];
  const obsoleteFields = ['unitCost', 'batchNumber', 'expiryDate'];
  
  console.log('\n✅ Campos requeridos:');
  requiredFields.forEach(field => {
    const exists = columns.some(c => c.column_name === field);
    console.log(`   ${exists ? '✓' : '✗'} ${field}`);
  });
  
  console.log('\n✅ Campos nuevos del schema:');
  newFields.forEach(field => {
    const exists = columns.some(c => c.column_name === field);
    console.log(`   ${exists ? '✓' : '✗'} ${field}`);
  });
  
  console.log('\n❌ Campos obsoletos (NO deben existir):');
  obsoleteFields.forEach(field => {
    const exists = columns.some(c => c.column_name === field);
    console.log(`   ${exists ? '✗ EXISTE (PROBLEMA)' : '✓ No existe (correcto)'} ${field}`);
  });
  
  await prisma.$disconnect();
}

verifyInvoiceItemStructure();

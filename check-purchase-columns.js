const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPurchaseColumns() {
  const cols = await prisma.$queryRaw`
    SELECT column_name, data_type
    FROM information_schema.columns 
    WHERE table_name = 'Purchase' 
    ORDER BY ordinal_position;
  `;
  
  console.log('\n📋 Columnas de Purchase:\n');
  cols.forEach(c => console.log(`   ${c.column_name} (${c.data_type})`));
  console.log(`\nTotal: ${cols.length} columnas\n`);
  
  await prisma.$disconnect();
}

checkPurchaseColumns();

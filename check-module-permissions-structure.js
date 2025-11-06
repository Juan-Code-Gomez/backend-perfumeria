const { PrismaClient } = require('@prisma/client');

const PRODUCTION_DB = 'postgresql://postgres:huyVrrXIlyNOWCIXYnMuHNSACuYhDbog@tramway.proxy.rlwy.net:58936/railway';

async function checkModulePermissionsStructure() {
  const prisma = new PrismaClient({
    datasources: { db: { url: PRODUCTION_DB } }
  });

  try {
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'module_permissions'
      ORDER BY ordinal_position;
    `;
    
    console.log('\nColumnas de module_permissions:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}) default=${col.column_default || 'none'}`);
    });

    const example = await prisma.$queryRaw`
      SELECT * FROM module_permissions LIMIT 1;
    `;
    
    console.log('\nEjemplo:');
    console.log(example[0]);
  } finally {
    await prisma.$disconnect();
  }
}

checkModulePermissionsStructure();

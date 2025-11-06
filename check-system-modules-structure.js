const { PrismaClient } = require('@prisma/client');

const PRODUCTION_DB = 'postgresql://postgres:huyVrrXIlyNOWCIXYnMuHNSACuYhDbog@tramway.proxy.rlwy.net:58936/railway';

async function checkSystemModulesColumns() {
  const prisma = new PrismaClient({
    datasources: { db: { url: PRODUCTION_DB } }
  });

  try {
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'system_modules'
      ORDER BY ordinal_position;
    `;
    
    console.log('\nColumnas de system_modules:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}) default=${col.column_default || 'none'}`);
    });

    // Verificar un módulo existente
    const existingModule = await prisma.$queryRaw`
      SELECT * FROM system_modules LIMIT 1;
    `;
    
    console.log('\nEjemplo de módulo existente:');
    console.log(existingModule[0]);
  } finally {
    await prisma.$disconnect();
  }
}

checkSystemModulesColumns();

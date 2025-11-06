/**
 * Verificar nombres de tablas en producción
 */
const { PrismaClient } = require('@prisma/client');

const PRODUCTION_DB = 'postgresql://postgres:huyVrrXIlyNOWCIXYnMuHNSACuYhDbog@tramway.proxy.rlwy.net:58936/railway';

async function checkTableNames() {
  const prisma = new PrismaClient({
    datasources: { db: { url: PRODUCTION_DB } }
  });

  try {
    const tables = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' AND (
        tablename LIKE '%client%' OR
        tablename LIKE '%user%' OR
        tablename LIKE '%product%'
      )
      ORDER BY tablename;
    `;
    
    console.log('Tablas relacionadas:');
    tables.forEach(t => console.log(`  - ${t.tablename}`));
  } finally {
    await prisma.$disconnect();
  }
}

checkTableNames();

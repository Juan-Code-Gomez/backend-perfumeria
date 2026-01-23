// Aplicar campos de configuración de ticket a todas las bases de datos
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Lista de URLs de bases de datos (actualizar según necesites)
const databases = [
  process.env.DATABASE_URL, // BD actual configurada en .env
];

const sqlFile = path.join(__dirname, 'add-ticket-config-fields.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

async function applyMigration(databaseUrl) {
  console.log(`\n🔄 Aplicando migración a: ${databaseUrl.substring(0, 50)}...`);
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  try {
    await prisma.$executeRawUnsafe(sql);
    console.log('✅ Migración aplicada exitosamente');
  } catch (error) {
    console.error('❌ Error al aplicar migración:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('🚀 Iniciando aplicación de migración de configuración de ticket...\n');
  
  for (const dbUrl of databases) {
    if (dbUrl) {
      await applyMigration(dbUrl);
    }
  }
  
  console.log('\n✅ Proceso completado');
}

main().catch(console.error);

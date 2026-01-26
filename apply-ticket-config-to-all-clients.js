// Aplicar campos de configuración de ticket a TODAS las bases de datos de clientes
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// ========================================
// 🔧 CONFIGURACIÓN: Agregar URLs de todos los clientes aquí
// ========================================
const databases = [
  // Base de datos principal (del .env)
  process.env.DATABASE_URL,
  
  // 🔽 Agrega aquí las URLs de tus otros clientes:
  // Ejemplo:
  // "postgresql://postgres:PASSWORD@HOST:PORT/railway",
  // "postgresql://postgres:PASSWORD@HOST:PORT/railway",
  
  // Cliente Trolley (ejemplo - actualizar con credenciales correctas)
  // "postgresql://postgres:PASSWORD@trolley.proxy.rlwy.net:45234/railway",
];

const sqlFile = path.join(__dirname, 'add-ticket-config-fields.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

async function applyMigration(databaseUrl, index) {
  const dbName = databaseUrl.includes('trolley') ? 'Trolley' : 
                 databaseUrl.includes('turntable') ? 'Principal' : 
                 `Cliente ${index + 1}`;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔄 Aplicando migración a: ${dbName}`);
  console.log(`   URL: ${databaseUrl.substring(0, 50)}...`);
  console.log('='.repeat(60));
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  try {
    // Verificar conexión
    await prisma.$connect();
    console.log('✅ Conexión exitosa');
    
    // Aplicar SQL
    await prisma.$executeRawUnsafe(sql);
    console.log('✅ Migración aplicada exitosamente');
    
    // Verificar que las columnas existen
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'company_config' 
      AND column_name IN ('showLogo', 'showNIT', 'ticketWidth', 'fontSize')
    `;
    
    console.log(`✅ Verificación: ${result.length}/4 columnas encontradas`);
    
    return { success: true, dbName };
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return { success: false, dbName, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 MIGRACIÓN DE CONFIGURACIÓN DE TICKETS POS');
  console.log('='.repeat(60));
  console.log(`📊 Total de bases de datos a actualizar: ${databases.filter(Boolean).length}`);
  console.log('='.repeat(60));
  
  const results = [];
  
  for (let i = 0; i < databases.length; i++) {
    const dbUrl = databases[i];
    if (dbUrl && dbUrl.startsWith('postgresql://')) {
      const result = await applyMigration(dbUrl, i);
      results.push(result);
    } else if (dbUrl) {
      console.log(`\n⚠️  Omitiendo entrada ${i + 1} (URL inválida o vacía)`);
    }
  }
  
  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📋 RESUMEN FINAL');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Exitosas: ${successful.length}`);
  if (successful.length > 0) {
    successful.forEach(r => console.log(`   - ${r.dbName}`));
  }
  
  console.log(`\n❌ Fallidas: ${failed.length}`);
  if (failed.length > 0) {
    failed.forEach(r => console.log(`   - ${r.dbName}: ${r.error}`));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(failed.length === 0 ? '🎉 ¡Proceso completado exitosamente!' : '⚠️  Proceso completado con errores');
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);

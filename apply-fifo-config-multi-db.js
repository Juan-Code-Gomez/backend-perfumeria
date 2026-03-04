const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// ============================================
// CONFIGURACIÓN DE BASES DE DATOS
// ============================================
const databases = [
  {
    name: 'Producción Principal',
    url: process.env.DATABASE_URL,
  },
  {
    name: 'Cliente 2',
    url: process.env.DATABASE_URL_CLIENT_2,
  },
  {
    name: 'Cliente 3',
    url: process.env.DATABASE_URL_CLIENT_3,
  },
  {
    name: 'Cliente 4',
    url: process.env.DATABASE_URL_CLIENT_4,
  },
].filter(db => db.url); // Solo incluir bases de datos con URL configurada

// ============================================
// FUNCIÓN PARA APLICAR MIGRACIÓN EN UNA BD
// ============================================
async function applyMigrationToDatabase(dbConfig) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbConfig.url,
      },
    },
  });

  try {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`🔧 Aplicando migración FIFO a: ${dbConfig.name}`);
    console.log(`${'═'.repeat(70)}`);

    // Verificar conexión
    console.log('🔌 Probando conexión...');
    await prisma.$connect();
    console.log('✅ Conexión exitosa');

    // Aplicar migración: Agregar campo useFifoInventory
    console.log('📝 Agregando campo useFifoInventory a company_config...');
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE company_config 
      ADD COLUMN IF NOT EXISTS "useFifoInventory" BOOLEAN NOT NULL DEFAULT true;
    `);
    
    console.log('✅ Campo agregado exitosamente');

    // Verificar la configuración actual
    const config = await prisma.companyConfig.findFirst();
    
    if (config) {
      console.log('\n📊 Configuración actual:');
      console.log(`   Empresa: ${config.companyName}`);
      console.log(`   Usar FIFO: ${config.useFifoInventory ? '✅ SÍ (activado por defecto)' : '❌ NO'}`);
    } else {
      console.log('⚠️  No se encontró configuración de empresa');
    }

    console.log(`\n✅ Migración completada en: ${dbConfig.name}`);

    return {
      success: true,
      database: dbConfig.name,
      config: config,
    };

  } catch (error) {
    console.error(`\n❌ Error en ${dbConfig.name}:`);
    console.error(error.message);
    
    return {
      success: false,
      database: dbConfig.name,
      error: error.message,
    };
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================
async function main() {
  console.log('🚀 INICIANDO MIGRACIÓN: Agregar parámetro FIFO a múltiples bases de datos\n');
  console.log(`📋 Total de bases de datos configuradas: ${databases.length}\n`);

  if (databases.length === 0) {
    console.log('⚠️  No se encontraron bases de datos configuradas');
    console.log('💡 Asegúrate de tener DATABASE_URL configurado en .env');
    process.exit(1);
  }

  const results = [];

  // Aplicar migración a cada base de datos
  for (const db of databases) {
    const result = await applyMigrationToDatabase(db);
    results.push(result);
    
    // Pausa breve entre bases de datos
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // ============================================
  // RESUMEN FINAL
  // ============================================
  console.log('\n\n');
  console.log('═'.repeat(70));
  console.log('📊 RESUMEN DE MIGRACIÓN');
  console.log('═'.repeat(70));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n✅ Exitosas: ${successful.length}/${databases.length}`);
  if (failed.length > 0) {
    console.log(`❌ Fallidas: ${failed.length}/${databases.length}`);
  }

  console.log('\n📋 Detalle por base de datos:\n');
  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.database}`);
      if (result.config) {
        console.log(`   └─ Empresa: ${result.config.companyName}`);
        console.log(`   └─ FIFO: ${result.config.useFifoInventory ? 'Activado' : 'Desactivado'}`);
      }
    } else {
      console.log(`❌ ${result.database}`);
      console.log(`   └─ Error: ${result.error}`);
    }
  });

  console.log('\n');
  console.log('═'.repeat(70));
  console.log('💡 INFORMACIÓN IMPORTANTE');
  console.log('═'.repeat(70));
  console.log('\n📖 Modo de uso del parámetro FIFO:');
  console.log('   • FIFO Activado: Se crean lotes de inventario (control FIFO)');
  console.log('   • FIFO Desactivado: Se actualiza precio de compra con cada factura');
  console.log('\n🎯 Para cambiar este parámetro:');
  console.log('   1. Ir a Configuración → Sistema');
  console.log('   2. Sección "Configuración de Inventario"');
  console.log('   3. Activar/Desactivar el switch "Usar Modelo FIFO"');
  console.log('   4. Guardar cambios\n');

  if (failed.length > 0) {
    console.log('⚠️  Algunas migraciones fallaron. Revisa los errores arriba.\n');
    process.exit(1);
  } else {
    console.log('✅ Todas las migraciones se aplicaron exitosamente\n');
  }
}

// Ejecutar
main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

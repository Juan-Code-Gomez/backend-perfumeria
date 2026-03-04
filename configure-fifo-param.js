// Script para verificar y configurar el parámetro FIFO en todas las bases de datos
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

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
].filter(db => db.url);

async function checkAndConfigureFifo(dbConfig, enableFifo = true) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbConfig.url,
      },
    },
  });

  try {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`🔍 Verificando configuración FIFO en: ${dbConfig.name}`);
    console.log(`${'═'.repeat(70)}`);

    await prisma.$connect();

    // Obtener configuración actual
    const config = await prisma.companyConfig.findFirst();
    
    if (!config) {
      console.log('⚠️  No se encontró configuración de empresa');
      return { success: false, database: dbConfig.name };
    }

    console.log('\n📊 Estado actual:');
    console.log(`   Empresa: ${config.companyName}`);
    console.log(`   FIFO actual: ${config.useFifoInventory ? '✅ Activado' : '❌ Desactivado'}`);
    console.log(`   FIFO deseado: ${enableFifo ? '✅ Activado' : '❌ Desactivado'}`);

    // Si el valor actual es diferente al deseado, actualizar
    if (config.useFifoInventory !== enableFifo) {
      console.log(`\n🔄 Actualizando configuración FIFO a: ${enableFifo ? 'Activado' : 'Desactivado'}...`);
      
      await prisma.companyConfig.update({
        where: { id: config.id },
        data: { useFifoInventory: enableFifo },
      });
      
      console.log('✅ Configuración actualizada');
    } else {
      console.log('\n✓ La configuración ya está correcta, no se requieren cambios');
    }

    return {
      success: true,
      database: dbConfig.name,
      companyName: config.companyName,
      useFifoInventory: enableFifo,
      wasUpdated: config.useFifoInventory !== enableFifo,
    };

  } catch (error) {
    console.error(`\n❌ Error en ${dbConfig.name}:`, error.message);
    return {
      success: false,
      database: dbConfig.name,
      error: error.message,
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('🚀 VERIFICACIÓN Y CONFIGURACIÓN DEL PARÁMETRO FIFO\n');
  
  // Preguntar si desea activar o desactivar FIFO
  const args = process.argv.slice(2);
  let enableFifo = true; // Default: activar FIFO
  
  if (args[0] === '--disable') {
    enableFifo = false;
    console.log('⚙️  Modo: Desactivar FIFO (actualizar precios con cada factura)\n');
  } else if (args[0] === '--enable') {
    enableFifo = true;
    console.log('⚙️  Modo: Activar FIFO (usar lotes de inventario)\n');
  } else {
    console.log('⚙️  Modo: Activar FIFO por defecto (usar lotes de inventario)');
    console.log('💡 Usa --disable para desactivar FIFO o --enable para activar\n');
  }

  console.log(`📋 Total de bases de datos: ${databases.length}\n`);

  const results = [];

  for (const db of databases) {
    const result = await checkAndConfigureFifo(db, enableFifo);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Resumen
  console.log('\n\n');
  console.log('═'.repeat(70));
  console.log('📊 RESUMEN FINAL');
  console.log('═'.repeat(70));

  const successful = results.filter(r => r.success);
  const updated = results.filter(r => r.success && r.wasUpdated);

  console.log(`\n✅ Procesadas: ${successful.length}/${databases.length}`);
  if (updated.length > 0) {
    console.log(`🔄 Actualizadas: ${updated.length}`);
  }

  console.log('\n📋 Detalle:\n');
  results.forEach(result => {
    if (result.success) {
      console.log(`${result.wasUpdated ? '🔄' : '✓'} ${result.database}`);
      console.log(`   └─ Empresa: ${result.companyName}`);
      console.log(`   └─ FIFO: ${result.useFifoInventory ? 'Activado' : 'Desactivado'}`);
      if (result.wasUpdated) {
        console.log(`   └─ Estado: Actualizado`);
      }
    } else {
      console.log(`❌ ${result.database}`);
      console.log(`   └─ Error: ${result.error}`);
    }
  });

  console.log('\n');
  console.log('═'.repeat(70));
  console.log('💡 RECORDATORIO');
  console.log('═'.repeat(70));
  console.log('\n📖 Comportamiento según configuración:');
  console.log('\n   🟢 FIFO Activado:');
  console.log('      • Se crean lotes de inventario al registrar compras');
  console.log('      • El costo se calcula usando FIFO (lote más antiguo)');
  console.log('      • purchasePrice del producto NO se actualiza');
  console.log('      • Ideal para: productos perecederos, trazabilidad\n');
  console.log('   🔴 FIFO Desactivado:');
  console.log('      • NO se crean lotes de inventario');
  console.log('      • purchasePrice se actualiza con la última factura');
  console.log('      • Se registra historial de cambios de precios');
  console.log('      • Ideal para: alta rotación, precios estables\n');
  
  console.log('🎯 Los usuarios pueden cambiar esto en: Configuración → Sistema → Inventario\n');
}

main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

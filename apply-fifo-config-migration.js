// Script para aplicar migración: Agregar parámetro useFifoInventory
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando migración: Agregar parámetro FIFO...\n');

  try {
    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, 'add-fifo-config.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Extraer solo la sentencia ALTER TABLE (ignorar comentarios)
    const alterTableQuery = `
      ALTER TABLE company_config 
      ADD COLUMN IF NOT EXISTS "useFifoInventory" BOOLEAN NOT NULL DEFAULT true;
    `;

    console.log('📝 Ejecutando migración SQL...');
    await prisma.$executeRawUnsafe(alterTableQuery);
    console.log('✅ Campo useFifoInventory agregado exitosamente\n');

    // Verificar la configuración actual
    const config = await prisma.companyConfig.findFirst();
    if (config) {
      console.log('📊 Configuración actual:');
      console.log(`   Empresa: ${config.companyName}`);
      console.log(`   Usar FIFO: ${config.useFifoInventory ? 'SÍ (por defecto)' : 'NO'}`);
      console.log('\n💡 Puedes cambiar este parámetro desde la pantalla de Configuración del Sistema');
    }

    console.log('\n✅ Migración completada exitosamente');
    console.log('\n📖 Modo de uso:');
    console.log('   • FIFO Activado: Se crean lotes de inventario para control FIFO');
    console.log('   • FIFO Desactivado: El precio de compra se actualiza con cada factura');

  } catch (error) {
    console.error('❌ Error al ejecutar migración:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

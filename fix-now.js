// fix-now.js - Script de emergencia para aplicar la migración AHORA
// Uso: railway run node fix-now.js
// O directamente: node fix-now.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixNow() {
  console.log('\n🚨 APLICANDO MIGRACIÓN DE EMERGENCIA\n');
  console.log('Migración: Agregar campo useFifoInventory\n');

  try {
    console.log('🔌 Conectando a base de datos...');
    await prisma.$connect();
    console.log('✅ Conectado\n');

    // Verificar si el campo ya existe
    console.log('🔍 Verificando si el campo ya existe...');
    try {
      await prisma.$queryRaw`SELECT "useFifoInventory" FROM company_config LIMIT 1`;
      console.log('✅ El campo ya existe - no se requiere migración');
      console.log('\n💡 Si aún hay errores, intenta reiniciar el servicio:\n');
      console.log('   railway restart\n');
      return;
    } catch (checkError) {
      console.log('❌ El campo NO existe - aplicando migración...\n');
    }

    // Aplicar la migración
    console.log('🔧 Ejecutando ALTER TABLE...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE company_config 
      ADD COLUMN IF NOT EXISTS "useFifoInventory" BOOLEAN NOT NULL DEFAULT true;
    `);
    console.log('✅ Campo agregado exitosamente\n');

    // Verificar que se aplicó correctamente
    const config = await prisma.companyConfig.findFirst();
    if (config) {
      console.log('📊 Verificación:');
      console.log(`   Empresa: ${config.companyName}`);
      console.log(`   useFifoInventory: ${config.useFifoInventory}\n`);
    }

    console.log('✅ MIGRACIÓN COMPLETADA CON ÉXITO\n');
    console.log('🔄 Ahora reinicia el servicio:\n');
    console.log('   railway restart\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\n💡 Intenta ejecutar manualmente:');
    console.error('   railway run psql $DATABASE_URL');
    console.error('   Luego ejecuta:');
    console.error('   ALTER TABLE company_config ADD COLUMN IF NOT EXISTS "useFifoInventory" BOOLEAN DEFAULT true;\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

console.log('═'.repeat(70));
console.log('🚨 FIX NOW - Migración de Emergencia');
console.log('═'.repeat(70));

fixNow()
  .then(() => {
    console.log('═'.repeat(70));
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });

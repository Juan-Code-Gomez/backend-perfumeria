// Script mejorado: Lee las URLs desde variables de entorno o archivo
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Leer URLs desde archivo .env o definir aquí
const databases = [
  process.env.DATABASE_URL, // Turntable (Principal actual)
  process.env.DATABASE_URL_MUNDO_PERFUMES, // Trolley
  process.env.DATABASE_URL_DOHA, // Ballast
  process.env.DATABASE_URL_MILAN, // Tramway
].filter(Boolean); // Elimina valores undefined/null

const sqlFile = path.join(__dirname, 'add-ticket-config-fields.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

async function applyMigration(databaseUrl, index) {
  // Extraer nombre del host para identificar cliente
  const hostMatch = databaseUrl.match(/\/\/.*@(.*?):/);
  const host = hostMatch ? hostMatch[1].split('.')[0] : `Cliente ${index + 1}`;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔄 Base de datos: ${host.toUpperCase()}`);
  console.log('='.repeat(60));
  
  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });

  try {
    await prisma.$connect();
    console.log('✅ Conectado');
    
    await prisma.$executeRawUnsafe(sql);
    console.log('✅ Migración aplicada');
    
    // Verificar columnas
    const check = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.columns 
      WHERE table_name = 'company_config' 
      AND column_name IN ('showLogo', 'showNIT', 'ticketWidth', 'fontSize')
    `;
    
    const count = Number(check[0].count);
    console.log(`✅ Verificado: ${count}/4 columnas`);
    
    return { success: true, host, count };
  } catch (error) {
    const errorMsg = error.message.includes('already exists') 
      ? 'Columnas ya existen (OK)' 
      : error.message;
    
    console.error(`${error.message.includes('already exists') ? '⚠️' : '❌'} ${errorMsg}`);
    
    return { 
      success: error.message.includes('already exists'), 
      host, 
      error: errorMsg,
      skipped: error.message.includes('already exists')
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('\n' + '🚀 '.repeat(30));
  console.log('   MIGRACIÓN DE CONFIGURACIÓN DE TICKETS POS');
  console.log('🚀 '.repeat(30));
  console.log(`\n📊 Bases de datos encontradas: ${databases.length}\n`);
  
  if (databases.length === 0) {
    console.log('❌ No se encontraron URLs de bases de datos.');
    console.log('\n💡 Agrega las URLs en tu archivo .env:');
    console.log('   DATABASE_URL=postgresql://...');
    console.log('   DATABASE_URL_TROLLEY=postgresql://...');
    console.log('   DATABASE_URL_CLIENTE3=postgresql://...\n');
    return;
  }
  
  const results = [];
  
  for (let i = 0; i < databases.length; i++) {
    const result = await applyMigration(databases[i], i);
    results.push(result);
    
    // Pausa breve entre bases de datos
    if (i < databases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Resumen
  console.log('\n' + '='.repeat(60));
  console.log('📋 RESUMEN');
  console.log('='.repeat(60));
  
  const success = results.filter(r => r.success && !r.skipped);
  const skipped = results.filter(r => r.skipped);
  const failed = results.filter(r => !r.success && !r.skipped);
  
  console.log(`✅ Aplicadas correctamente: ${success.length}`);
  success.forEach(r => console.log(`   • ${r.host}`));
  
  if (skipped.length > 0) {
    console.log(`\n⚠️  Ya tenían las columnas: ${skipped.length}`);
    skipped.forEach(r => console.log(`   • ${r.host}`));
  }
  
  if (failed.length > 0) {
    console.log(`\n❌ Con errores: ${failed.length}`);
    failed.forEach(r => console.log(`   • ${r.host}: ${r.error}`));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(failed.length === 0 ? '🎉 ¡TODO LISTO!' : '⚠️  Revisa los errores arriba');
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);

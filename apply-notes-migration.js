const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configurations
const databases = [
  {
    name: 'MUNDO PERFUMES',
    connectionString: 'postgresql://postgres:wGcAKDSKDggpmWPulURTqPDEYOPovsPy@trolley.proxy.rlwy.net:45234/railway'
  },
  {
    name: 'PARFUM',
    connectionString: 'postgresql://postgres:sramdnCvXZjwgHUZBUBvkvWGSvRuGgrZ@turntable.proxy.rlwy.net:38668/railway'
  },
  {
    name: 'PARFUM2',
    connectionString: 'postgresql://postgres:rOrTEiOgEyAuZDvAxtTBrdfCyaWGCVIq@ballast.proxy.rlwy.net:14597/railway'
  },
  {
    name: 'MILAN FRAGANCIAS',
    connectionString: 'postgresql://postgres:huyVrrXIlyNOWCIXYnMuHNSACuYhDbog@tramway.proxy.rlwy.net:58936/railway'
  }
];

async function applyMigration(db) {
  const pool = new Pool({ 
    connectionString: db.connectionString,
    ssl: { rejectUnauthorized: false }
  });
  const client = await pool.connect();
  
  try {
    console.log(`\n📦 Conectando a ${db.name}...`);
    
    // Test connection
    await client.query('SELECT 1');
    console.log(`   ✓ Conexión establecida`);
    
    // SQL directo
    const sql = 'ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "notes" TEXT';
    
    console.log(`   Ejecutando migración...`);
    await client.query(sql);
    
    console.log(`   ✅ Migración aplicada exitosamente en ${db.name}`);
    
    // Verificar que la columna existe
    const checkResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Sale' 
      AND column_name = 'notes'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log(`   ✓ Columna 'notes' verificada:`, checkResult.rows[0]);
    } else {
      console.log(`   ⚠️ Advertencia: No se pudo verificar la columna`);
    }
    
  } catch (error) {
    console.error(`   ❌ Error en ${db.name}:`, error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Iniciando migración: Agregar campo notes a tabla Sale');
  console.log(`   Fecha: ${new Date().toLocaleString()}`);
  console.log(`   Bases de datos: ${databases.length}`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const db of databases) {
    try {
      await applyMigration(db);
      successCount++;
    } catch (error) {
      errorCount++;
      console.error(`\n❌ Fallo en ${db.name}:`, error.message);
      console.error(`   Stack:`, error.stack);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE MIGRACIÓN');
  console.log('='.repeat(60));
  console.log(`✅ Exitosas: ${successCount}/${databases.length}`);
  console.log(`❌ Fallidas: ${errorCount}/${databases.length}`);
  console.log('='.repeat(60));
  
  if (errorCount > 0) {
    process.exit(1);
  }
}

main().catch(console.error);

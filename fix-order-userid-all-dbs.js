// Aplicar fix de userId nullable en tabla orders a todas las bases de datos
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

const color = (text, colorCode) => `${colorCode}${text}${colors.reset}`;

const sqlPath = path.join(__dirname, 'fix-order-userid-nullable.sql');
const migrationSQL = fs.readFileSync(sqlPath, 'utf8');

const databases = {
  turntable: process.env.DATABASE_URL,
  'mundo-perfumes': process.env.DATABASE_URL_MUNDO_PERFUMES,
  doha: process.env.DATABASE_URL_DOHA,
  milan: process.env.DATABASE_URL_MILAN,
};

async function applyMigration(dbName, connectionString) {
  console.log('\n' + '='.repeat(60));
  console.log(color(`🔄 Base de datos: ${dbName.toUpperCase()}`, colors.blue));
  console.log('='.repeat(60));

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log(color('✅ Conectado', colors.green));

    await client.query(migrationSQL);
    console.log(color('✅ Migración aplicada', colors.green));

    const result = await client.query(`
      SELECT is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name = 'userId';
    `);

    if (result.rows.length > 0 && result.rows[0].is_nullable === 'YES') {
      console.log(color('✅ Verificado: userId es nullable', colors.green));
    } else if (result.rows.length === 0) {
      console.log(color('ℹ️ La columna userId no existe', colors.yellow));
    } else {
      console.log(color('⚠️ Advertencia: No se pudo verificar', colors.yellow));
    }

  } catch (error) {
    console.error(color(`❌ Error: ${error.message}`, colors.red));
    throw error;
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('\n' + color('🚀 '.repeat(30), colors.bright));
  console.log(color('   FIX: USERID NULLABLE EN TABLA ORDERS', colors.bright));
  console.log(color('🚀 '.repeat(30), colors.bright) + '\n');

  const dbEntries = Object.entries(databases).filter(([_, url]) => url);
  console.log(color(`📊 Bases de datos encontradas: ${dbEntries.length}\n`, colors.blue));

  const results = {
    success: [],
    failed: [],
  };

  for (const [name, url] of dbEntries) {
    try {
      await applyMigration(name, url);
      results.success.push(name);
    } catch (error) {
      results.failed.push({ name, error: error.message });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(color('📋 RESUMEN', colors.bright));
  console.log('='.repeat(60));

  if (results.success.length > 0) {
    console.log(color(`✅ Aplicadas correctamente: ${results.success.length}`, colors.green));
    results.success.forEach(name => console.log(`   • ${name}`));
  }

  if (results.failed.length > 0) {
    console.log(color(`\n❌ Fallidas: ${results.failed.length}`, colors.red));
    results.failed.forEach(({ name, error }) => {
      console.log(`   • ${name}: ${error}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  if (results.failed.length === 0) {
    console.log(color('🎉 ¡TODO LISTO!', colors.green));
  } else {
    console.log(color('⚠️ COMPLETADO CON ERRORES', colors.yellow));
  }
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);

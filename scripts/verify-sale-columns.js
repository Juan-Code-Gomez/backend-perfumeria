/**
 * VERIFICAR COLUMNAS DE SALE EN PRODUCCIÓN
 */

const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL no definida');
  process.exit(1);
}

async function verifyColumns() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado\n');

    console.log('📋 Columnas de la tabla Sale:');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Sale'
      ORDER BY ordinal_position;
    `);

    columns.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
      console.log(`   ${col.column_name}: ${col.data_type} ${nullable}`);
    });

    // Verificar columnas críticas
    const critical = ['discountAmount', 'discountType', 'discountValue', 'subtotalAmount', 'cashSessionId'];
    console.log('\n🔍 Verificación de columnas críticas:');
    critical.forEach(colName => {
      const exists = columns.rows.find(r => r.column_name === colName);
      if (exists) {
        console.log(`   ✅ ${colName}`);
      } else {
        console.log(`   ❌ ${colName} - FALTA`);
      }
    });

    await client.end();
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await client.end();
    process.exit(1);
  }
}

verifyColumns();

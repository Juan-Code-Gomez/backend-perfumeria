/**
 * VERIFICAR SI LA COLUMNA cashSessionId EXISTE EN EXPENSE
 */

const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: La variable de entorno DATABASE_URL no está definida');
  process.exit(1);
}

async function verifyColumn() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // Verificar columnas de Expense
    console.log('🔍 Columnas de la tabla Expense:');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'Expense'
      ORDER BY ordinal_position;
    `);

    if (columns.rows.length === 0) {
      console.log('❌ La tabla Expense NO existe\n');
    } else {
      console.log('\n📋 Columnas encontradas:');
      columns.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(not null)';
        console.log(`   - ${col.column_name}: ${col.data_type} ${nullable}`);
      });
      
      const hasCashSessionId = columns.rows.some(col => col.column_name === 'cashSessionId');
      console.log('\n');
      if (hasCashSessionId) {
        console.log('✅ La columna cashSessionId EXISTE');
      } else {
        console.log('❌ La columna cashSessionId NO EXISTE');
      }
    }

    await client.end();
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await client.end();
    process.exit(1);
  }
}

verifyColumn();

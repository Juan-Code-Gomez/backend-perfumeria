// Verificar columnas de la tabla orders
const { Client } = require('pg');
require('dotenv').config();

async function checkOrdersColumns() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    const result = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'orders'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Columnas de la tabla "orders":\n');
    console.log('Columna'.padEnd(20), 'Tipo'.padEnd(15), 'Nullable'.padEnd(10), 'Default');
    console.log('-'.repeat(70));
    
    result.rows.forEach(row => {
      console.log(
        row.column_name.padEnd(20),
        row.data_type.padEnd(15),
        row.is_nullable.padEnd(10),
        row.column_default || ''
      );
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkOrdersColumns();

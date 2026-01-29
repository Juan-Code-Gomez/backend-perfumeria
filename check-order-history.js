// Verificar estructura de order_history
const { Client } = require('pg');
require('dotenv').config();

async function checkOrderHistory() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();

    const result = await client.query(`
      SELECT 
        column_name, 
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'order_history'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Estructura de order_history:\n');
    result.rows.forEach(row => {
      console.log(
        row.column_name.padEnd(20),
        `[${row.data_type}]`.padEnd(25),
        `Nullable: ${row.is_nullable}`,
        row.column_default ? `Default: ${row.column_default}` : ''
      );
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkOrderHistory();

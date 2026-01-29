// Verificar tipos de columnas específicas en orders
const { Client } = require('pg');
require('dotenv').config();

async function checkColumnsTypes() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();

    const result = await client.query(`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name IN ('orderNumber', 'status', 'customerName', 'clientId', 'totalAmount', 'orderDate')
      ORDER BY ordinal_position;
    `);

    console.log('📋 Tipos de datos en orders:\n');
    result.rows.forEach(row => {
      console.log(`${row.column_name.padEnd(20)} - ${row.data_type.padEnd(20)} (${row.udt_name})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkColumnsTypes();

// Verificar el enum OrderStatus
const { Client } = require('pg');
require('dotenv').config();

async function checkEnum() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();

    const result = await client.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'OrderStatus'
      )
      ORDER BY enumsortorder;
    `);

    console.log('📋 Valores del enum OrderStatus:\n');
    result.rows.forEach(row => {
      console.log(`  - ${row.enumlabel}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkEnum();

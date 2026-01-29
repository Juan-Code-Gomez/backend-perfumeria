// Análisis completo del módulo de pedidos - Schema vs DB real
const { Client } = require('pg');
require('dotenv').config();

async function analyzeOrdersModule() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    console.log('🔍 ANÁLISIS COMPLETO DEL MÓDULO DE PEDIDOS\n');
    console.log('='.repeat(80));

    // 1. Estructura de la tabla orders
    console.log('\n📋 TABLA ORDERS - Estructura completa:\n');
    const ordersColumns = await client.query(`
      SELECT 
        ordinal_position,
        column_name, 
        data_type,
        udt_name,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'orders'
      ORDER BY ordinal_position;
    `);

    ordersColumns.rows.forEach(row => {
      console.log(
        `${String(row.ordinal_position).padStart(2)}.`,
        row.column_name.padEnd(20),
        `[${row.data_type}/${row.udt_name}]`.padEnd(35),
        `Nullable: ${row.is_nullable}`.padEnd(15),
        row.column_default ? `Default: ${row.column_default}` : ''
      );
    });

    // 2. Estructura de la tabla order_details
    console.log('\n\n📋 TABLA ORDER_DETAILS - Estructura completa:\n');
    const detailsColumns = await client.query(`
      SELECT 
        ordinal_position,
        column_name, 
        data_type,
        udt_name,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'order_details'
      ORDER BY ordinal_position;
    `);

    detailsColumns.rows.forEach(row => {
      console.log(
        `${String(row.ordinal_position).padStart(2)}.`,
        row.column_name.padEnd(20),
        `[${row.data_type}/${row.udt_name}]`.padEnd(35),
        `Nullable: ${row.is_nullable}`.padEnd(15),
        row.column_default ? `Default: ${row.column_default}` : ''
      );
    });

    // 3. Verificar valores del enum OrderStatus
    console.log('\n\n📋 ENUM OrderStatus - Valores:\n');
    const enumValues = await client.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'OrderStatus')
      ORDER BY enumsortorder;
    `);

    enumValues.rows.forEach(row => {
      console.log(`  - ${row.enumlabel}`);
    });

    // 4. Verificar constraints y foreign keys
    console.log('\n\n📋 CONSTRAINTS y FOREIGN KEYS en orders:\n');
    const constraints = await client.query(`
      SELECT
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'orders'
      ORDER BY tc.constraint_type, tc.constraint_name;
    `);

    constraints.rows.forEach(row => {
      if (row.foreign_table_name) {
        console.log(
          `  ${row.constraint_type}: ${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`
        );
      } else {
        console.log(`  ${row.constraint_type}: ${row.constraint_name} (${row.column_name})`);
      }
    });

    // 5. Verificar índices
    console.log('\n\n📋 ÍNDICES en orders:\n');
    const indexes = await client.query(`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'orders'
      ORDER BY indexname;
    `);

    indexes.rows.forEach(row => {
      console.log(`  ${row.indexname}`);
      console.log(`    ${row.indexdef}\n`);
    });

    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

analyzeOrdersModule();

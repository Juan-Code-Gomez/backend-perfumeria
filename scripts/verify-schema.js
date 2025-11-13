/**
 * VERIFICAR SCHEMA COMPLETO - ANTES DE DEPLOY
 * 
 * Compara el schema.prisma con la BD real y reporta diferencias
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL no definida');
  process.exit(1);
}

// Tablas y columnas esperadas según schema.prisma
const EXPECTED_SCHEMA = {
  Sale: ['id', 'date', 'customerName', 'totalAmount', 'paidAmount', 'isPaid', 'createdAt', 'updatedAt', 'paymentMethod', 'clientId', 'discountAmount', 'discountType', 'discountValue', 'subtotalAmount', 'cashSessionId'],
  Expense: ['id', 'date', 'amount', 'description', 'createdAt', 'updatedAt', 'deletedAt', 'notes', 'category', 'paymentMethod', 'recurringExpenseId', 'cashSessionId'],
  CashClosing: ['id', 'date', 'openingCash', 'closingCash', 'systemCash', 'difference', 'notes', 'createdAt', 'updatedAt', 'createdById', 'cashSessionId'],
};

async function verifySchema() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la BD\n');

    let hasMissingColumns = false;

    for (const [tableName, expectedColumns] of Object.entries(EXPECTED_SCHEMA)) {
      console.log(`\n📋 Verificando tabla: ${tableName}`);
      console.log('─'.repeat(50));

      // Obtener columnas actuales
      const result = await client.query(`
        SELECT column_name 
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      const actualColumns = result.rows.map(r => r.column_name);

      // Verificar columnas faltantes
      const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
      const extraColumns = actualColumns.filter(col => !expectedColumns.includes(col));

      if (missingColumns.length > 0) {
        console.log('   ❌ COLUMNAS FALTANTES:');
        missingColumns.forEach(col => console.log(`      - ${col}`));
        hasMissingColumns = true;
      } else {
        console.log('   ✅ Todas las columnas existen');
      }

      if (extraColumns.length > 0) {
        console.log('   ℹ️  Columnas extra (no en schema):');
        extraColumns.forEach(col => console.log(`      - ${col}`));
      }
    }

    await client.end();

    console.log('\n' + '='.repeat(50));
    if (hasMissingColumns) {
      console.log('❌ HAY COLUMNAS FALTANTES - Ejecuta sync-all-databases.ps1');
      process.exit(1);
    } else {
      console.log('✅ SCHEMA VERIFICADO - Todo está sincronizado');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await client.end();
    process.exit(1);
  }
}

verifySchema();

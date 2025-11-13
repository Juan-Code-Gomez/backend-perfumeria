/**
 * SCRIPT COMPLETO PARA SINCRONIZAR SCHEMA DE PRODUCCIÓN
 * 
 * Agrega todas las columnas faltantes que están en schema.prisma pero no en la BD
 */

const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: La variable de entorno DATABASE_URL no está definida');
  process.exit(1);
}

async function syncSchema() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos de producción\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('  🔧 SINCRONIZACIÓN DE SCHEMA - PRODUCCIÓN');
    console.log('═══════════════════════════════════════════════════\n');

    let columnsAdded = 0;
    let constraintsAdded = 0;

    // ====================================================================
    // TABLA: Sale
    // ====================================================================
    console.log('📋 TABLA: Sale');
    console.log('─────────────────────────────────────────────────────');
    
    // Agregar columnas de descuento
    const saleColumns = [
      { name: 'discountAmount', type: 'DOUBLE PRECISION', default: '0' },
      { name: 'discountType', type: 'TEXT', default: null },
      { name: 'discountValue', type: 'DOUBLE PRECISION', default: null },
      { name: 'subtotalAmount', type: 'DOUBLE PRECISION', default: '0' },
      { name: 'cashSessionId', type: 'INTEGER', default: null }
    ];

    for (const col of saleColumns) {
      try {
        const exists = await client.query(`
          SELECT column_name FROM information_schema.columns
          WHERE table_name = 'Sale' AND column_name = $1
        `, [col.name]);

        if (exists.rows.length === 0) {
          const defaultClause = col.default ? `DEFAULT ${col.default}` : '';
          await client.query(`
            ALTER TABLE "Sale" 
            ADD COLUMN "${col.name}" ${col.type} ${defaultClause}
          `);
          console.log(`   ✅ Agregada: ${col.name} (${col.type})`);
          columnsAdded++;
        } else {
          console.log(`   ℹ️  Ya existe: ${col.name}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Error con ${col.name}: ${error.message}`);
      }
    }

    // ====================================================================
    // TABLA: Expense
    // ====================================================================
    console.log('\n📋 TABLA: Expense');
    console.log('─────────────────────────────────────────────────────');
    
    const expenseColumns = [
      { name: 'cashSessionId', type: 'INTEGER', default: null }
    ];

    for (const col of expenseColumns) {
      try {
        const exists = await client.query(`
          SELECT column_name FROM information_schema.columns
          WHERE table_name = 'Expense' AND column_name = $1
        `, [col.name]);

        if (exists.rows.length === 0) {
          const defaultClause = col.default ? `DEFAULT ${col.default}` : '';
          await client.query(`
            ALTER TABLE "Expense" 
            ADD COLUMN "${col.name}" ${col.type} ${defaultClause}
          `);
          console.log(`   ✅ Agregada: ${col.name} (${col.type})`);
          columnsAdded++;
        } else {
          console.log(`   ℹ️  Ya existe: ${col.name}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Error con ${col.name}: ${error.message}`);
      }
    }

    // ====================================================================
    // FOREIGN KEYS (solo si existe CashSession)
    // ====================================================================
    console.log('\n🔗 FOREIGN KEYS');
    console.log('─────────────────────────────────────────────────────');
    
    const cashSessionExists = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'CashSession'
    `);

    if (cashSessionExists.rows.length > 0) {
      console.log('   ✅ Tabla CashSession existe - agregando FKs...\n');
      
      // FK para Sale.cashSessionId
      try {
        await client.query(`
          ALTER TABLE "Sale" 
          ADD CONSTRAINT "Sale_cashSessionId_fkey" 
          FOREIGN KEY ("cashSessionId") REFERENCES "CashSession"("id") 
          ON DELETE SET NULL ON UPDATE CASCADE
        `);
        console.log('   ✅ FK agregado: Sale.cashSessionId');
        constraintsAdded++;
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('   ℹ️  FK ya existe: Sale.cashSessionId');
        } else {
          console.log(`   ⚠️  Error FK Sale: ${error.message}`);
        }
      }

      // FK para Expense.cashSessionId
      try {
        await client.query(`
          ALTER TABLE "Expense" 
          ADD CONSTRAINT "Expense_cashSessionId_fkey" 
          FOREIGN KEY ("cashSessionId") REFERENCES "CashSession"("id") 
          ON DELETE SET NULL ON UPDATE CASCADE
        `);
        console.log('   ✅ FK agregado: Expense.cashSessionId');
        constraintsAdded++;
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('   ℹ️  FK ya existe: Expense.cashSessionId');
        } else {
          console.log(`   ⚠️  Error FK Expense: ${error.message}`);
        }
      }
    } else {
      console.log('   ⚠️  Tabla CashSession no existe - saltando FKs');
    }

    // ====================================================================
    // RESUMEN
    // ====================================================================
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  📊 RESUMEN DE SINCRONIZACIÓN');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  ✅ Columnas agregadas: ${columnsAdded}`);
    console.log(`  🔗 Constraints agregados: ${constraintsAdded}`);
    console.log('═══════════════════════════════════════════════════\n');

    if (columnsAdded > 0 || constraintsAdded > 0) {
      console.log('🎉 SINCRONIZACIÓN COMPLETADA');
      console.log('💡 El backend de Railway necesita reiniciarse para usar las nuevas columnas');
      console.log('   → Railway lo hará automáticamente en el próximo deploy\n');
    } else {
      console.log('✅ Schema ya estaba sincronizado - no se requieren cambios\n');
    }

  } catch (error) {
    console.error('\n❌ ERROR durante la sincronización:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada');
  }
}

syncSchema();

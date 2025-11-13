/**
 * SINCRONIZAR SCHEMA EN LAS 3 BASES DE DATOS DE PRODUCCIÓN
 * 
 * Agrega las columnas faltantes en todas las BDs de clientes
 */

const { Client } = require('pg');

// Las 3 bases de datos de producción
const DATABASES = [
  {
    name: 'tramway (Cliente Principal)',
    url: 'postgresql://postgres:huyVrrXIlyNOWCIXYnMuHNSACuYhDbog@tramway.proxy.rlwy.net:58936/railway'
  },
  {
    name: 'shinkansen (Cliente 2)',
    url: 'postgresql://postgres:SJBYEwPzlxYkrgMupzDOWYTAUXICMCHT@shinkansen.proxy.rlwy.net:21931/railway'
  },
  {
    name: 'turntable (Cliente 3)',
    url: 'postgresql://postgres:sramdnCvXZjwgHUZBUBvkvWGSvRuGgrZ@turntable.proxy.rlwy.net:38668/railway'
  }
];

async function syncDatabase(dbConfig) {
  const client = new Client({
    connectionString: dbConfig.url,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 ${dbConfig.name}`);
    console.log('='.repeat(60));

    let columnsAdded = 0;

    // ===== CREAR ENUM OrderStatus si no existe =====
    console.log('\n🔧 ENUM: OrderStatus');
    try {
      const enumExists = await client.query(`
        SELECT 1 FROM pg_type WHERE typname = 'OrderStatus'
      `);

      if (enumExists.rows.length === 0) {
        await client.query(`
          CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'APPROVED', 'CANCELLED')
        `);
        console.log('   ✅ ENUM OrderStatus creado');
      } else {
        console.log('   ℹ️  ENUM OrderStatus ya existe');
      }
    } catch (error) {
      console.log(`   ⚠️  Error con ENUM: ${error.message}`);
    }

    // ===== TABLA Sale =====
    console.log('\n📋 Tabla: Sale');
    
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
          console.log(`   ✅ Agregada: ${col.name}`);
          columnsAdded++;
        } else {
          console.log(`   ℹ️  Ya existe: ${col.name}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${col.name} - ${error.message}`);
      }
    }

    // ===== TABLA Expense =====
    console.log('\n📋 Tabla: Expense');
    
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
          console.log(`   ✅ Agregada: ${col.name}`);
          columnsAdded++;
        } else {
          console.log(`   ℹ️  Ya existe: ${col.name}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${col.name} - ${error.message}`);
      }
    }

    // ===== TABLA CashClosing =====
    console.log('\n📋 Tabla: CashClosing');
    
    const cashClosingColumns = [
      { name: 'cashSessionId', type: 'INTEGER', default: null }
    ];

    for (const col of cashClosingColumns) {
      try {
        const exists = await client.query(`
          SELECT column_name FROM information_schema.columns
          WHERE table_name = 'CashClosing' AND column_name = $1
        `, [col.name]);

        if (exists.rows.length === 0) {
          const defaultClause = col.default ? `DEFAULT ${col.default}` : '';
          await client.query(`
            ALTER TABLE "CashClosing" 
            ADD COLUMN "${col.name}" ${col.type} ${defaultClause}
          `);
          console.log(`   ✅ Agregada: ${col.name}`);
          columnsAdded++;
        } else {
          console.log(`   ℹ️  Ya existe: ${col.name}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${col.name} - ${error.message}`);
      }
    }

    // ===== TABLA Order (si existe) =====
    console.log('\n📋 Tabla: Order / orders');
    
    // Verificar si la tabla existe (puede ser "Order" o "orders")
    const orderTableCheck = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND (tablename = 'Order' OR tablename = 'orders')
    `);

    if (orderTableCheck.rows.length > 0) {
      const orderTableName = orderTableCheck.rows[0].tablename;
      console.log(`   📌 Tabla encontrada: ${orderTableName}`);

      const orderColumns = [
        { name: 'totalAmount', type: 'DOUBLE PRECISION', default: null }
      ];

      for (const col of orderColumns) {
        try {
          const exists = await client.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = $1 AND column_name = $2
          `, [orderTableName, col.name]);

          if (exists.rows.length === 0) {
            const defaultClause = col.default ? `DEFAULT ${col.default}` : '';
            await client.query(`
              ALTER TABLE "${orderTableName}" 
              ADD COLUMN "${col.name}" ${col.type} ${defaultClause}
            `);
            console.log(`   ✅ Agregada: ${col.name}`);
            columnsAdded++;
          } else {
            console.log(`   ℹ️  Ya existe: ${col.name}`);
          }
        } catch (error) {
          console.log(`   ❌ Error: ${col.name} - ${error.message}`);
        }
      }
    } else {
      console.log('   ⚠️  Tabla Order/orders no existe - saltando');
    }

    console.log(`\n📊 Total columnas agregadas: ${columnsAdded}`);
    
    await client.end();
    return { success: true, columnsAdded };
    
  } catch (error) {
    console.error(`\n❌ ERROR en ${dbConfig.name}:`, error.message);
    try {
      await client.end();
    } catch (e) {}
    return { success: false, error: error.message };
  }
}

async function syncAllDatabases() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  🚀 SINCRONIZACIÓN DE SCHEMA - TODAS LAS BDs           ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  const results = [];

  for (const db of DATABASES) {
    const result = await syncDatabase(db);
    results.push({ name: db.name, ...result });
  }

  // Resumen final
  console.log('\n\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  📊 RESUMEN FINAL                                       ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  let allSuccess = true;
  let totalColumnsAdded = 0;

  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const detail = result.success 
      ? `${result.columnsAdded} columnas agregadas`
      : `Error: ${result.error}`;
    
    console.log(`${status} ${result.name}: ${detail}`);
    
    if (result.success) {
      totalColumnsAdded += result.columnsAdded;
    } else {
      allSuccess = false;
    }
  });

  console.log(`\n📊 Total columnas agregadas en todas las BDs: ${totalColumnsAdded}`);
  
  if (allSuccess) {
    console.log('\n🎉 ¡SINCRONIZACIÓN COMPLETADA EN TODAS LAS BDs!');
    console.log('💡 Ahora Railway debe reiniciarse para usar las nuevas columnas\n');
  } else {
    console.log('\n⚠️  Algunas BDs tuvieron errores - revisa los detalles arriba\n');
    process.exit(1);
  }
}

// Ejecutar
syncAllDatabases()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });

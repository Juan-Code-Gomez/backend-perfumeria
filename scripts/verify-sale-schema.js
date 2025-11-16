const { Client } = require('pg');

const databases = [
  {
    name: 'tramway (Cliente Principal)',
    connectionString: 'postgresql://postgres:huyVrrXIlyNOWCIXYnMuHNSACuYhDbog@tramway.proxy.rlwy.net:58936/railway'
  },
  {
    name: 'shinkansen (Cliente 2)',
    connectionString: 'postgresql://postgres:SJBYEwPzlxYkrgMupzDOWYTAUXICMCHT@shinkansen.proxy.rlwy.net:21931/railway'
  },
  {
    name: 'turntable (Cliente 3)',
    connectionString: 'postgresql://postgres:sramdnCvXZjwgHUZBUBvkvWGSvRuGgrZ@turntable.proxy.rlwy.net:38668/railway'
  }
];

async function verifySaleSchema() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  🔍 VERIFICACIÓN DE SCHEMA - Tabla Sale                ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  for (const db of databases) {
    console.log('============================================================');
    console.log(`📊 ${db.name}`);
    console.log('============================================================\n');

    const client = new Client({ connectionString: db.connectionString });

    try {
      await client.connect();

      // Obtener columnas de Sale
      const saleColumns = await client.query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = 'Sale'
        ORDER BY ordinal_position
      `);

      console.log('📋 Columnas en tabla Sale:');
      if (saleColumns.rows.length === 0) {
        console.log('   ⚠️  Tabla Sale NO EXISTE\n');
      } else {
        saleColumns.rows.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          console.log(`   • ${col.column_name.padEnd(20)} ${col.data_type.padEnd(20)} ${nullable}${defaultVal}`);
        });
        console.log(`\n   Total: ${saleColumns.rows.length} columnas\n`);
      }

      // Verificar si SalePayment existe
      const salePaymentExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'SalePayment'
        );
      `);

      if (salePaymentExists.rows[0].exists) {
        console.log('✅ Tabla SalePayment existe\n');
      } else {
        console.log('❌ Tabla SalePayment NO EXISTE\n');
      }

      // Verificar constraints
      const constraints = await client.query(`
        SELECT 
          constraint_name, 
          constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'Sale'
      `);

      console.log('🔗 Constraints:');
      constraints.rows.forEach(c => {
        console.log(`   • ${c.constraint_name} (${c.constraint_type})`);
      });
      console.log('');

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    } finally {
      await client.end();
    }
  }

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  ✅ VERIFICACIÓN COMPLETADA                            ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
}

verifySaleSchema().catch(console.error);

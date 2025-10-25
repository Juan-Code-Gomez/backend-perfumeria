const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de las 3 bases de datos de Railway
const databases = [
  {
    name: 'DATABASE_URL (tramway - principal)',
    config: {
      host: 'tramway.proxy.rlwy.net',
      port: 58936,
      user: 'postgres',
      password: 'huyVrrXIlyNOWCIXYnMuHNSACuYhDbog',
      database: 'railway',
      ssl: { rejectUnauthorized: false }
    }
  },
  {
    name: 'DATABASE_URL_CLIENT_2 (shinkansen)',
    config: {
      host: 'shinkansen.proxy.rlwy.net',
      port: 21931,
      user: 'postgres',
      password: 'SJBYEwPzlxYkrgMupzDOWYTAUXICMCHT',
      database: 'railway',
      ssl: { rejectUnauthorized: false }
    }
  },
  {
    name: 'DATABASE_URL_CLIENT_3 (turntable)',
    config: {
      host: 'turntable.proxy.rlwy.net',
      port: 38668,
      user: 'postgres',
      password: 'sramdnCvXZjwgHUZBUBvkvWGSvRuGgrZ',
      database: 'railway',
      ssl: { rejectUnauthorized: false }
    }
  }
];

async function createProductBatchTable() {
  // Leer el SQL
  const sqlPath = path.join(__dirname, 'create-product-batch-table.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('🚀 Iniciando creación de tabla product_batches en múltiples bases de datos...\n');

  for (const db of databases) {
    console.log(`\n📊 Procesando: ${db.name}`);
    console.log(`   Host: ${db.config.host}:${db.config.port}`);
    
    const client = new Client(db.config);
    
    try {
      await client.connect();
      console.log('   ✅ Conectado');

      // Verificar si la tabla ya existe
      const checkTableQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'product_batches'
        );
      `;
      
      const checkResult = await client.query(checkTableQuery);
      const tableExists = checkResult.rows[0].exists;

      if (tableExists) {
        console.log('   ℹ️  La tabla product_batches ya existe - omitiendo');
      } else {
        console.log('   🔨 Creando tabla product_batches...');
        
        // Ejecutar el SQL
        await client.query(sql);
        
        console.log('   ✅ Tabla creada exitosamente');
        
        // Verificar la creación
        const verifyQuery = `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'product_batches'
          ORDER BY ordinal_position;
        `;
        
        const columns = await client.query(verifyQuery);
        console.log(`   📋 Columnas creadas: ${columns.rows.length}`);
        
        // Verificar índices
        const indexQuery = `
          SELECT indexname
          FROM pg_indexes
          WHERE tablename = 'product_batches';
        `;
        
        const indexes = await client.query(indexQuery);
        console.log(`   🔍 Índices creados: ${indexes.rows.length}`);
        indexes.rows.forEach(idx => {
          console.log(`      - ${idx.indexname}`);
        });
      }

    } catch (error) {
      console.error(`   ❌ Error en ${db.name}:`, error.message);
      if (error.detail) console.error('      Detalle:', error.detail);
    } finally {
      await client.end();
      console.log('   🔌 Desconectado');
    }
  }

  console.log('\n✅ Proceso completado\n');
}

// Ejecutar
createProductBatchTable()
  .then(() => {
    console.log('🎉 ¡Todas las bases de datos han sido actualizadas!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });

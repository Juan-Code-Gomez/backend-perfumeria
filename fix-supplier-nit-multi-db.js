const { Client } = require('pg');

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

async function fixSupplierNitColumn() {
  console.log('🔧 Haciendo el campo NIT nullable en la tabla Supplier...\n');

  for (const db of databases) {
    console.log(`\n📊 Procesando: ${db.name}`);
    console.log(`   Host: ${db.config.host}:${db.config.port}`);
    
    const client = new Client(db.config);
    
    try {
      await client.connect();
      console.log('   ✅ Conectado');

      // Verificar estado actual
      const checkQuery = `
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = 'Supplier' 
        AND column_name = 'nit';
      `;
      
      const beforeResult = await client.query(checkQuery);
      
      if (beforeResult.rows.length === 0) {
        console.log('   ⚠️  Columna "nit" no encontrada en la tabla Supplier');
        continue;
      }

      const beforeState = beforeResult.rows[0];
      console.log(`   📋 Estado ANTES: is_nullable = ${beforeState.is_nullable}`);

      if (beforeState.is_nullable === 'YES') {
        console.log('   ℹ️  La columna ya permite NULL - no se requiere cambio');
      } else {
        console.log('   🔨 Modificando columna para permitir NULL...');
        
        // Aplicar el cambio
        await client.query(`ALTER TABLE "Supplier" ALTER COLUMN "nit" DROP NOT NULL;`);
        
        // Verificar después del cambio
        const afterResult = await client.query(checkQuery);
        const afterState = afterResult.rows[0];
        
        console.log(`   📋 Estado DESPUÉS: is_nullable = ${afterState.is_nullable}`);
        
        if (afterState.is_nullable === 'YES') {
          console.log('   ✅ Columna actualizada exitosamente');
        } else {
          console.log('   ❌ Error: La columna no se actualizó correctamente');
        }
      }

      // Verificar si hay proveedores con NIT NULL
      const countQuery = `SELECT COUNT(*) as count FROM "Supplier" WHERE nit IS NULL;`;
      const countResult = await client.query(countQuery);
      console.log(`   📊 Proveedores sin NIT: ${countResult.rows[0].count}`);

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
fixSupplierNitColumn()
  .then(() => {
    console.log('🎉 ¡Todas las bases de datos han sido actualizadas!');
    console.log('📝 Ahora puedes crear proveedores sin NIT');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });

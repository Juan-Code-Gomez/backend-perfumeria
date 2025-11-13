/**
 * SCRIPT DE MIGRACIÓN PARA PRODUCCIÓN - VERSIÓN SIMPLIFICADA
 * 
 * Este script elimina los constraints únicos de CashSession y CashClosing
 * Compatible con cualquier nombre de tabla (mayúsculas/minúsculas)
 */

const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: La variable de entorno DATABASE_URL no está definida');
  process.exit(1);
}

async function removeConstraintsProduction() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos de producción\n');

    // PASO 1: Buscar las tablas
    console.log('🔍 Buscando tablas...');
    const tables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND (tablename ILIKE '%cashsession%' OR tablename ILIKE '%cashclosing%')
      ORDER BY tablename;
    `);
    
    if (tables.rows.length === 0) {
      console.log('⚠️  No se encontraron las tablas de cierre de caja');
      await client.end();
      return;
    }
    
    console.log('📋 Tablas encontradas:');
    tables.rows.forEach(row => console.log(`   - ${row.tablename}`));
    console.log('');

    // PASO 2: Para cada tabla, buscar y eliminar constraints
    for (const table of tables.rows) {
      const tableName = table.tablename;
      
      console.log(`🔍 Procesando tabla: ${tableName}`);
      
      // Buscar constraints únicos relacionados con date o isActive
      // Usamos comillas dobles para preservar mayúsculas/minúsculas
      const constraints = await client.query(`
        SELECT conname, pg_get_constraintdef(oid) as definition
        FROM pg_constraint
        WHERE conrelid = '"${tableName}"'::regclass
          AND contype = 'u'
          AND (conname ILIKE '%date%' OR conname ILIKE '%active%')
        ORDER BY conname;
      `);

      if (constraints.rows.length > 0) {
        console.log(`   📋 Constraints encontrados:`);
        constraints.rows.forEach(row => {
          console.log(`      - ${row.conname}`);
        });

        // Eliminar cada constraint
        console.log(`   🔧 Eliminando constraints...`);
        for (const constraint of constraints.rows) {
          try {
            await client.query(`ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${constraint.conname}"`);
            console.log(`      ✅ ${constraint.conname}`);
          } catch (error) {
            console.log(`      ⚠️  Error: ${constraint.conname} - ${error.message}`);
          }
        }
      } else {
        console.log(`   ✅ No hay constraints problemáticos`);
      }
      console.log('');
    }

    // PASO 3: Verificación final
    console.log('✅ Verificación final...');
    const finalCheck = await client.query(`
      SELECT 
        t.tablename as tabla,
        c.conname
      FROM pg_constraint c
      JOIN pg_class pc ON c.conrelid = pc.oid
      JOIN pg_tables t ON pc.relname = t.tablename
      WHERE t.schemaname = 'public'
        AND (t.tablename ILIKE '%cashsession%' OR t.tablename ILIKE '%cashclosing%')
        AND c.contype = 'u'
        AND (c.conname ILIKE '%date%' OR c.conname ILIKE '%active%')
      ORDER BY tabla, conname;
    `);

    if (finalCheck.rows.length === 0) {
      console.log('   ✅ Todos los constraints problemáticos fueron eliminados');
    } else {
      console.log('   ⚠️  Aún quedan constraints:');
      finalCheck.rows.forEach(row => {
        console.log(`      - ${row.tabla}.${row.conname}`);
      });
    }

    console.log('\n🎉 MIGRACIÓN COMPLETADA');
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Despliega el backend (git push)');
    console.log('   2. Despliega el frontend (git push)');
    console.log('   3. Prueba en producción');

  } catch (error) {
    console.error('\n❌ ERROR durante la migración:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Conexión cerrada');
  }
}

console.log('🚀 INICIANDO MIGRACIÓN DE PRODUCCIÓN');
console.log('=====================================\n');

removeConstraintsProduction().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

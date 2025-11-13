/**
 * SCRIPT DE VERIFICACIÓN POST-DESPLIEGUE
 * 
 * Ejecuta este script DESPUÉS de desplegar a producción para verificar
 * que todo funciona correctamente.
 * 
 * USO:
 * $env:DATABASE_URL="postgresql://..." ; node scripts/verify-production-deployment.js
 */

const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: La variable de entorno DATABASE_URL no está definida');
  console.log('\n💡 Uso:');
  console.log('   $env:DATABASE_URL="postgresql://..." ; node scripts/verify-production-deployment.js');
  process.exit(1);
}

async function verifyDeployment() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  let allTestsPassed = true;

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos de producción\n');

    // TEST 1: Verificar que NO existan constraints problemáticos
    console.log('🧪 TEST 1: Verificando que constraints fueron eliminados...');
    const badConstraints = await client.query(`
      SELECT conname, 
             CASE 
               WHEN conrelid = '"CashSession"'::regclass THEN 'CashSession'
               WHEN conrelid = '"CashClosing"'::regclass THEN 'CashClosing'
             END as tabla
      FROM pg_constraint
      WHERE conrelid IN ('"CashSession"'::regclass, '"CashClosing"'::regclass)
        AND contype = 'u'
        AND (conname LIKE '%date%' OR conname LIKE '%isActive%');
    `);

    if (badConstraints.rows.length === 0) {
      console.log('   ✅ PASS - No se encontraron constraints problemáticos\n');
    } else {
      console.log('   ❌ FAIL - Aún existen constraints que deben eliminarse:');
      badConstraints.rows.forEach(row => {
        console.log(`      - ${row.tabla}.${row.conname}`);
      });
      console.log('   ⚠️  Ejecuta el script de migración: production-migration-remove-constraints.js\n');
      allTestsPassed = false;
    }

    // TEST 2: Verificar que las tablas existan
    console.log('🧪 TEST 2: Verificando existencia de tablas...');
    const tables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename IN ('CashSession', 'CashClosing')
      ORDER BY tablename;
    `);

    if (tables.rows.length === 2) {
      console.log('   ✅ PASS - Tablas CashSession y CashClosing existen\n');
    } else {
      console.log('   ❌ FAIL - Faltan tablas requeridas');
      allTestsPassed = false;
    }

    // TEST 3: Verificar índices importantes
    console.log('🧪 TEST 3: Verificando índices de rendimiento...');
    const indexes = await client.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE tablename IN ('CashSession', 'CashClosing')
        AND indexname NOT LIKE '%pkey%'
      ORDER BY tablename, indexname;
    `);

    if (indexes.rows.length > 0) {
      console.log('   ✅ PASS - Índices encontrados:');
      indexes.rows.forEach(row => {
        console.log(`      - ${row.tablename}.${row.indexname}`);
      });
      console.log();
    } else {
      console.log('   ⚠️  WARNING - No se encontraron índices (esto puede afectar rendimiento)\n');
    }

    // TEST 4: Verificar estructura de columnas de CashSession
    console.log('🧪 TEST 4: Verificando estructura de CashSession...');
    const sessionColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'CashSession'
        AND column_name IN ('id', 'date', 'isActive', 'openingCash', 'closingCash', 'sessionNumber')
      ORDER BY column_name;
    `);

    const requiredColumns = ['date', 'id', 'isActive', 'openingCash', 'sessionNumber'];
    const foundColumns = sessionColumns.rows.map(r => r.column_name);
    const missingColumns = requiredColumns.filter(col => !foundColumns.includes(col));

    if (missingColumns.length === 0) {
      console.log('   ✅ PASS - Todas las columnas requeridas existen\n');
    } else {
      console.log('   ❌ FAIL - Faltan columnas:');
      missingColumns.forEach(col => console.log(`      - ${col}`));
      console.log();
      allTestsPassed = false;
    }

    // TEST 5: Verificar estructura de CashClosing
    console.log('🧪 TEST 5: Verificando estructura de CashClosing...');
    const closingColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'CashClosing'
        AND column_name IN ('id', 'date', 'openingCash', 'closingCash', 'difference', 'totalSales')
      ORDER BY column_name;
    `);

    const requiredClosingColumns = ['id', 'date', 'openingCash', 'closingCash', 'difference', 'totalSales'];
    const foundClosingColumns = closingColumns.rows.map(r => r.column_name);
    const missingClosingColumns = requiredClosingColumns.filter(col => !foundClosingColumns.includes(col));

    if (missingClosingColumns.length === 0) {
      console.log('   ✅ PASS - Todas las columnas requeridas existen\n');
    } else {
      console.log('   ❌ FAIL - Faltan columnas:');
      missingClosingColumns.forEach(col => console.log(`      - ${col}`));
      console.log();
      allTestsPassed = false;
    }

    // TEST 6: Contar registros existentes
    console.log('🧪 TEST 6: Verificando datos existentes...');
    const sessionCount = await client.query('SELECT COUNT(*) as count FROM "CashSession"');
    const closingCount = await client.query('SELECT COUNT(*) as count FROM "CashClosing"');

    console.log(`   📊 CashSession: ${sessionCount.rows[0].count} registros`);
    console.log(`   📊 CashClosing: ${closingCount.rows[0].count} registros\n`);

    // TEST 7: Verificar si hay sesiones activas
    console.log('🧪 TEST 7: Verificando sesiones activas...');
    const activeSessions = await client.query(`
      SELECT id, "sessionNumber", date, "isActive", "openingCash"
      FROM "CashSession"
      WHERE "isActive" = true
      ORDER BY date DESC
      LIMIT 5;
    `);

    if (activeSessions.rows.length > 0) {
      console.log(`   ⚠️  Se encontraron ${activeSessions.rows.length} sesión(es) activa(s):`);
      activeSessions.rows.forEach(session => {
        console.log(`      - Sesión #${session.sessionNumber} (${new Date(session.date).toISOString().split('T')[0]}) - $${session.openingCash}`);
      });
      console.log();
    } else {
      console.log('   ℹ️  No hay sesiones activas actualmente\n');
    }

    // TEST 8: Verificar último cierre
    console.log('🧪 TEST 8: Verificando últimos cierres...');
    const recentClosings = await client.query(`
      SELECT id, date, "totalSales", difference, "createdAt"
      FROM "CashClosing"
      ORDER BY "createdAt" DESC
      LIMIT 3;
    `);

    if (recentClosings.rows.length > 0) {
      console.log(`   ✅ Últimos ${recentClosings.rows.length} cierres:`);
      recentClosings.rows.forEach(closing => {
        const date = new Date(closing.date).toISOString().split('T')[0];
        const time = new Date(closing.createdAt).toISOString().split('T')[1].substring(0, 8);
        console.log(`      - ${date} ${time} | Ventas: $${closing.totalSales} | Dif: $${closing.difference}`);
      });
      console.log();
    } else {
      console.log('   ℹ️  No hay cierres registrados aún\n');
    }

    // RESUMEN FINAL
    console.log('═══════════════════════════════════════════════════════════');
    if (allTestsPassed) {
      console.log('✅ ¡VERIFICACIÓN EXITOSA!');
      console.log('✅ La base de datos está correctamente configurada');
      console.log('✅ Puedes proceder con el despliegue del código');
    } else {
      console.log('❌ VERIFICACIÓN FALLIDA');
      console.log('⚠️  Hay problemas que deben corregirse antes de desplegar');
      console.log('⚠️  Revisa los tests que fallaron arriba');
    }
    console.log('═══════════════════════════════════════════════════════════\n');

    // Instrucciones siguientes
    if (allTestsPassed) {
      console.log('📝 PRÓXIMOS PASOS:');
      console.log('   1. Hacer commit de los cambios en el código');
      console.log('   2. Push a Railway (main branch)');
      console.log('   3. Esperar que Railway complete el deployment');
      console.log('   4. Probar en producción:');
      console.log('      - Abrir sesión de caja');
      console.log('      - Registrar cierre');
      console.log('      - Abrir nueva sesión el mismo día');
      console.log('      - Registrar segundo cierre');
      console.log('      - Descargar PDF de cualquier cierre');
    }

  } catch (error) {
    console.error('\n❌ ERROR durante la verificación:', error.message);
    console.error(error);
    allTestsPassed = false;
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada\n');
  }

  process.exit(allTestsPassed ? 0 : 1);
}

console.log('🔍 VERIFICACIÓN POST-DESPLIEGUE');
console.log('════════════════════════════════\n');

verifyDeployment().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

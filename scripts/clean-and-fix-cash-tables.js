const { Client } = require('pg');

async function cleanAndFixCashTables() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'perfumeria',
    user: 'postgres',
    password: 'admin', // Cambia esto según tu configuración
  });

  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL');

    // 1. Eliminar todos los datos de cierre de caja
    console.log('\n🗑️  Eliminando todos los datos de CashClosing...');
    const deleteClosings = await client.query('DELETE FROM "CashClosing"');
    console.log(`   ✅ ${deleteClosings.rowCount} registros eliminados de CashClosing`);

    // 2. Eliminar todos los datos de sesiones de caja
    console.log('\n🗑️  Eliminando todos los datos de CashSession...');
    const deleteSessions = await client.query('DELETE FROM "CashSession"');
    console.log(`   ✅ ${deleteSessions.rowCount} registros eliminados de CashSession`);

    // 3. Verificar constraints existentes en CashSession
    console.log('\n🔍 Buscando constraints en CashSession...');
    const constraints = await client.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = '"CashSession"'::regclass
        AND (conname LIKE '%date%' OR conname LIKE '%isActive%' OR contype = 'u')
    `);

    if (constraints.rows.length > 0) {
      console.log('\n📋 Constraints encontrados:');
      constraints.rows.forEach(row => {
        console.log(`   - ${row.conname} (${row.contype}): ${row.definition}`);
      });

      // 4. Eliminar constraints únicos que contengan date o isActive
      console.log('\n🔧 Eliminando constraints únicos...');
      for (const constraint of constraints.rows) {
        if (constraint.contype === 'u' && 
            (constraint.conname.includes('date') || 
             constraint.conname.includes('isActive') ||
             constraint.definition.includes('date') || 
             constraint.definition.includes('isActive'))) {
          try {
            await client.query(`ALTER TABLE "CashSession" DROP CONSTRAINT "${constraint.conname}"`);
            console.log(`   ✅ Eliminado: ${constraint.conname}`);
          } catch (error) {
            console.log(`   ⚠️  Error al eliminar ${constraint.conname}: ${error.message}`);
          }
        }
      }
    } else {
      console.log('   ℹ️  No se encontraron constraints relacionados con date o isActive');
    }

    // 5. Verificar constraints en CashClosing también
    console.log('\n🔍 Buscando constraints en CashClosing...');
    const closingConstraints = await client.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = '"CashClosing"'::regclass
        AND conname LIKE '%date%' AND contype = 'u'
    `);

    if (closingConstraints.rows.length > 0) {
      console.log('\n📋 Constraints en CashClosing:');
      closingConstraints.rows.forEach(row => {
        console.log(`   - ${row.conname}: ${row.definition}`);
      });

      console.log('\n🔧 Eliminando constraints únicos de date en CashClosing...');
      for (const constraint of closingConstraints.rows) {
        try {
          await client.query(`ALTER TABLE "CashClosing" DROP CONSTRAINT "${constraint.conname}"`);
          console.log(`   ✅ Eliminado: ${constraint.conname}`);
        } catch (error) {
          console.log(`   ⚠️  Error al eliminar ${constraint.conname}: ${error.message}`);
        }
      }
    }

    // 6. Verificación final
    console.log('\n✅ Verificación final...');
    const finalCheck = await client.query(`
      SELECT conname, contype 
      FROM pg_constraint 
      WHERE conrelid IN ('"CashSession"'::regclass, '"CashClosing"'::regclass)
        AND contype = 'u'
        AND (conname LIKE '%date%' OR conname LIKE '%isActive%')
    `);

    if (finalCheck.rows.length === 0) {
      console.log('   ✅ Todos los constraints problemáticos fueron eliminados exitosamente');
    } else {
      console.log('   ⚠️  Aún quedan algunos constraints:');
      finalCheck.rows.forEach(row => {
        console.log(`      - ${row.conname}`);
      });
    }

    console.log('\n🎉 Proceso completado');
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Reinicia el backend: npm run start:dev');
    console.log('   2. Prueba crear un cierre de caja nuevo');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
    console.log('\n🔌 Conexión cerrada');
  }
}

cleanAndFixCashTables();

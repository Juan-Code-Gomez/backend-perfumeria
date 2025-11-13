const { Client } = require('pg');

async function removeConstraintDirectly() {
  // Crear cliente de PostgreSQL directamente
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'perfumeria',
    user: 'postgres',
    password: process.env.DB_PASSWORD || 'postgres', // Cambia esto por tu contraseña
  });

  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL\n');

    // 1. Listar todos los constraints de CashSession
    console.log('🔍 Buscando constraints en CashSession...\n');
    const constraintsQuery = `
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'public."CashSession"'::regclass
        AND contype = 'u';
    `;
    
    const result = await client.query(constraintsQuery);
    
    if (result.rows.length === 0) {
      console.log('ℹ️  No se encontraron constraints únicos en CashSession\n');
    } else {
      console.log('📋 Constraints únicos encontrados:');
      result.rows.forEach(row => {
        console.log(`  - ${row.constraint_name}: ${row.definition}`);
      });
      console.log('\n');

      // 2. Eliminar cada constraint encontrado
      for (const row of result.rows) {
        console.log(`🗑️  Eliminando constraint: ${row.constraint_name}`);
        
        const dropQuery = `ALTER TABLE "CashSession" DROP CONSTRAINT "${row.constraint_name}";`;
        
        try {
          await client.query(dropQuery);
          console.log(`   ✅ Eliminado exitosamente\n`);
        } catch (error) {
          console.log(`   ⚠️  Error: ${error.message}\n`);
        }
      }
    }

    // 3. Verificación final
    console.log('🔍 Verificación final...\n');
    const finalCheck = await client.query(constraintsQuery);
    
    if (finalCheck.rows.length === 0) {
      console.log('✅ ¡Perfecto! No quedan constraints únicos en CashSession\n');
    } else {
      console.log('⚠️  Aún quedan constraints:');
      finalCheck.rows.forEach(row => {
        console.log(`  - ${row.constraint_name}: ${row.definition}`);
      });
    }

    console.log('\n✅ Proceso completado. Ahora reinicia el backend.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Tip: Asegúrate de que:');
    console.error('  1. PostgreSQL está corriendo');
    console.error('  2. La base de datos "perfumeria" existe');
    console.error('  3. Las credenciales son correctas\n');
  } finally {
    await client.end();
  }
}

removeConstraintDirectly();

// resolve-failed-migration.js
// Script para resolver migraciones fallidas del cliente

const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:wGcAKDSKDggpmWPulURTqPDEYOPovsPy@trolley.proxy.rlwy.net:45234/railway';

async function resolverMigracionFallida() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✓ Conectado a la base de datos\n');

    // 1. Ver todas las migraciones fallidas
    console.log('=== MIGRACIONES FALLIDAS ===');
    const failed = await client.query(`
      SELECT * FROM _prisma_migrations 
      WHERE finished_at IS NULL OR logs LIKE '%failed%'
      ORDER BY started_at DESC
    `);

    if (failed.rows.length === 0) {
      console.log('No hay migraciones fallidas.\n');
    } else {
      console.log(`Encontradas ${failed.rows.length} migraciones con problemas:\n`);
      failed.rows.forEach(row => {
        console.log(`Migración: ${row.migration_name}`);
        console.log(`Iniciada: ${row.started_at}`);
        console.log(`Finalizada: ${row.finished_at || 'NO FINALIZADA'}`);
        console.log(`---`);
      });
      console.log();
    }

    // 2. Opción 1: Marcar como completada (si ya se aplicó manualmente)
    console.log('OPCIÓN 1: Marcar migración como completada');
    console.log('  (Usa esto si las tablas/cambios ya existen en la DB)\n');
    
    const markAsCompleted = `
UPDATE _prisma_migrations 
SET finished_at = NOW(), 
    logs = 'Migración marcada como completada manualmente. Los cambios ya existían en la base de datos.',
    rolled_back_at = NULL
WHERE migration_name = '20250711044208_init' 
AND finished_at IS NULL;
    `.trim();

    console.log('SQL para marcar como completada:');
    console.log(markAsCompleted);
    console.log();

    // 3. Opción 2: Eliminar el registro (forzar reaplicación)
    console.log('OPCIÓN 2: Eliminar registro de migración');
    console.log('  (Usa esto para intentar reaplicar la migración)\n');
    
    const deleteRecord = `
DELETE FROM _prisma_migrations 
WHERE migration_name = '20250711044208_init';
    `.trim();

    console.log('SQL para eliminar:');
    console.log(deleteRecord);
    console.log();

    // 4. Ejecutar la opción seleccionada
    const action = process.argv[2];
    
    if (action === '--mark-completed') {
      console.log('Ejecutando: Marcar como completada...');
      await client.query(markAsCompleted);
      console.log('✓ Migración marcada como completada\n');
      
      console.log('Ahora ejecuta:');
      console.log('DATABASE_URL="..." npx prisma migrate deploy');
      
    } else if (action === '--delete') {
      console.log('Ejecutando: Eliminar registro...');
      await client.query(deleteRecord);
      console.log('✓ Registro eliminado\n');
      
      console.log('Ahora ejecuta:');
      console.log('DATABASE_URL="..." npx prisma migrate deploy');
      
    } else if (action === '--force-resolve') {
      console.log('Ejecutando: Resolución forzada (marcar como completada)...');
      
      // Marcar TODAS las migraciones fallidas como completadas
      await client.query(`
        UPDATE _prisma_migrations 
        SET finished_at = COALESCE(finished_at, NOW()),
            logs = CASE 
              WHEN finished_at IS NULL THEN 'Marcada como completada - cambios existentes en DB'
              ELSE logs 
            END
        WHERE finished_at IS NULL OR logs LIKE '%failed%'
      `);
      
      console.log('✓ Todas las migraciones fallidas marcadas como completadas\n');
      
      console.log('Ahora ejecuta:');
      console.log('DATABASE_URL="..." npx prisma migrate deploy');
      
    } else {
      console.log('USO:');
      console.log('  node resolve-failed-migration.js --mark-completed   (marca como completada)');
      console.log('  node resolve-failed-migration.js --delete           (elimina el registro)');
      console.log('  node resolve-failed-migration.js --force-resolve    (marca todas como completadas)');
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

resolverMigracionFallida();

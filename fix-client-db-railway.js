// fix-client-db-railway.js
// Script para diagnosticar y arreglar la base de datos del cliente en Railway

const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:wGcAKDSKDggpmWPulURTqPDEYOPovsPy@trolley.proxy.rlwy.net:45234/railway';

async function diagnosticarYArreglar() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✓ Conectado a la base de datos del cliente\n');

    // 1. Verificar estado de la tabla _prisma_migrations
    console.log('=== VERIFICANDO MIGRACIONES ===');
    const migrations = await client.query(`
      SELECT migration_name, finished_at, logs 
      FROM _prisma_migrations 
      ORDER BY finished_at DESC 
      LIMIT 10
    `);
    
    console.log('Últimas migraciones:');
    migrations.rows.forEach(row => {
      console.log(`  - ${row.migration_name}: ${row.finished_at ? '✓ OK' : '✗ FALLIDA'}`);
      if (!row.finished_at) {
        console.log(`    Log: ${row.logs}`);
      }
    });
    console.log();

    // 2. Verificar tablas existentes
    console.log('=== VERIFICANDO TABLAS ===');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('Tablas existentes:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    console.log();

    // 3. Verificar enums existentes
    console.log('=== VERIFICANDO ENUMS ===');
    const enums = await client.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e' 
      ORDER BY typname
    `);
    
    console.log('Enums existentes:');
    enums.rows.forEach(row => {
      console.log(`  - ${row.typname}`);
    });
    console.log();

    // 4. Verificar si company_config existe
    const companyConfigExists = tables.rows.some(row => row.table_name === 'company_config');
    console.log(`Tabla company_config: ${companyConfigExists ? '✓ EXISTE' : '✗ NO EXISTE'}\n`);

    // 5. Preguntar que hacer
    console.log('=== DIAGNÓSTICO COMPLETO ===\n');
    
    if (!companyConfigExists) {
      console.log('PROBLEMA DETECTADO:');
      console.log('  - La tabla company_config NO existe');
      console.log('  - Los enums existen (migraciones parciales)');
      console.log('  - Se necesita resetear y reaplicar migraciones\n');
      
      console.log('OPCIONES:');
      console.log('  1. Limpiar migraciones fallidas y reaplicar');
      console.log('  2. Hacer reset completo de la base de datos');
      console.log('\nEjecuta:');
      console.log('  node fix-client-db-railway.js --fix-migrations  (opción 1)');
      console.log('  node fix-client-db-railway.js --reset-db        (opción 2)');
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

async function limpiarYReaplicarMigraciones() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✓ Conectado a la base de datos\n');

    console.log('=== LIMPIANDO MIGRACIONES FALLIDAS ===');
    
    // Marcar la migración fallida como completada o eliminarla
    await client.query(`
      DELETE FROM _prisma_migrations 
      WHERE migration_name = '20251025161155_baseline_complete_schema' 
      AND finished_at IS NULL
    `);
    console.log('✓ Migración fallida eliminada\n');

    // Verificar si el enum existe y quitarlo si está causando problemas
    console.log('=== VERIFICANDO ENUMS PROBLEMÁTICOS ===');
    const enumCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'MovementType'
      ) as exists
    `);

    if (enumCheck.rows[0].exists) {
      console.log('Enum MovementType existe. Verificando si está en uso...');
      
      // Verificar si alguna tabla lo usa
      const usageCheck = await client.query(`
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE udt_name = 'MovementType'
      `);

      if (usageCheck.rows.length > 0) {
        console.log('El enum está en uso por:');
        usageCheck.rows.forEach(row => {
          console.log(`  - ${row.table_name}.${row.column_name}`);
        });
      } else {
        console.log('El enum NO está en uso. Eliminándolo...');
        await client.query('DROP TYPE IF EXISTS "MovementType" CASCADE');
        console.log('✓ Enum eliminado\n');
      }
    }

    console.log('\n=== SIGUIENTE PASO ===');
    console.log('Ahora ejecuta desde tu proyecto backend:');
    console.log('  DATABASE_URL="' + DATABASE_URL + '" npx prisma migrate deploy');
    console.log('\nEsto reaplicará las migraciones correctamente.');

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

async function resetearBaseDeDatos() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✓ Conectado a la base de datos\n');
    
    console.log('⚠️  ADVERTENCIA: Esto eliminará TODOS los datos de la base de datos\n');
    
    console.log('=== ELIMINANDO TODAS LAS TABLAS ===');
    
    // Obtener todas las tablas
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name != '_prisma_migrations'
    `);

    for (const row of tables.rows) {
      console.log(`Eliminando tabla ${row.table_name}...`);
      await client.query(`DROP TABLE IF EXISTS "${row.table_name}" CASCADE`);
    }

    // Obtener todos los enums
    const enums = await client.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e'
    `);

    console.log('\n=== ELIMINANDO ENUMS ===');
    for (const row of enums.rows) {
      console.log(`Eliminando enum ${row.typname}...`);
      await client.query(`DROP TYPE IF EXISTS "${row.typname}" CASCADE`);
    }

    // Limpiar tabla de migraciones
    console.log('\n=== LIMPIANDO HISTORIAL DE MIGRACIONES ===');
    await client.query('DELETE FROM _prisma_migrations');
    console.log('✓ Base de datos limpiada\n');

    console.log('=== SIGUIENTE PASO ===');
    console.log('Ahora ejecuta desde tu proyecto backend:');
    console.log('  DATABASE_URL="' + DATABASE_URL + '" npx prisma migrate deploy');

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

// Ejecutar según argumentos
const args = process.argv.slice(2);

if (args.includes('--fix-migrations')) {
  limpiarYReaplicarMigraciones();
} else if (args.includes('--reset-db')) {
  resetearBaseDeDatos();
} else {
  diagnosticarYArreglar();
}

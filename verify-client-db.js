// verify-client-db.js
// Script para verificar y regenerar Prisma Client para este cliente

const { Client } = require('pg');
const { execSync } = require('child_process');

// URL exacta que proporcionó el usuario
const DATABASE_URL = 'postgresql://postgres:wGcAKDSKDggpmWPulURTqPDEYOPovsPy@trolley.proxy.rlwy.net:45234/railway';

async function verificarYRegenerar() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // 1. Verificar conexión y tabla company_config
    await client.connect();
    console.log('✓ Conectado a la base de datos\n');

    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'company_config'
      ) as exists
    `);

    console.log('Tabla company_config:', tableCheck.rows[0].exists ? '✓ EXISTE' : '✗ NO EXISTE');

    if (tableCheck.rows[0].exists) {
      // Verificar columnas
      const columns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'company_config'
        ORDER BY ordinal_position
      `);

      console.log('\nColumnas de company_config:');
      columns.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });

      // Contar registros
      const count = await client.query('SELECT COUNT(*) as total FROM company_config');
      console.log(`\nRegistros en company_config: ${count.rows[0].total}`);
    }

    await client.end();

    // 2. Regenerar Prisma Client con la URL correcta
    console.log('\n=== REGENERANDO PRISMA CLIENT ===');
    console.log('Ejecutando: DATABASE_URL="***" npx prisma generate\n');
    
    try {
      execSync(`npx prisma generate`, {
        env: { ...process.env, DATABASE_URL },
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('\n✓ Prisma Client regenerado exitosamente');
    } catch (error) {
      console.error('\n✗ Error al regenerar Prisma Client');
      throw error;
    }

    // 3. Verificar estado de migraciones
    console.log('\n=== VERIFICANDO MIGRACIONES ===');
    try {
      execSync(`npx prisma migrate status`, {
        env: { ...process.env, DATABASE_URL },
        stdio: 'inherit',
        cwd: process.cwd()
      });
    } catch (error) {
      console.log('\nSi hay migraciones pendientes, ejecuta:');
      console.log(`DATABASE_URL="${DATABASE_URL}" npx prisma migrate deploy`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verificarYRegenerar();

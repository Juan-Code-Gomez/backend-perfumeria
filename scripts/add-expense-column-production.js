/**
 * SCRIPT PARA AGREGAR COLUMNA cashSessionId A LA TABLA Expense EN PRODUCCIÓN
 * 
 * Este script agrega la columna faltante que está causando el error en el dashboard
 */

const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: La variable de entorno DATABASE_URL no está definida');
  console.error('Uso: DATABASE_URL="tu_url" node scripts/add-expense-column-production.js');
  process.exit(1);
}

async function addExpenseColumn() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos de producción\n');

    // PASO 1: Verificar si la columna ya existe
    console.log('🔍 Verificando si la columna cashSessionId existe...');
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'Expense' 
        AND column_name = 'cashSessionId';
    `);

    if (checkColumn.rows.length > 0) {
      console.log('   ℹ️  La columna cashSessionId ya existe en la tabla Expense');
      console.log('   ✅ No se requiere migración\n');
      await client.end();
      return;
    }

    console.log('   ⚠️  La columna no existe, procediendo a agregarla...\n');

    // PASO 2: Verificar que existe la tabla CashSession
    console.log('🔍 Verificando tabla CashSession...');
    const checkCashSession = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename = 'CashSession';
    `);

    const cashSessionExists = checkCashSession.rows.length > 0;
    if (cashSessionExists) {
      console.log('   ✅ Tabla CashSession encontrada\n');
    } else {
      console.log('   ⚠️  Tabla CashSession no existe - agregando columna sin foreign key\n');
    }

    // PASO 3: Agregar la columna
    console.log('🔧 Agregando columna cashSessionId a la tabla Expense...');
    await client.query(`
      ALTER TABLE "Expense" 
      ADD COLUMN IF NOT EXISTS "cashSessionId" INTEGER;
    `);
    console.log('   ✅ Columna agregada\n');

    // PASO 4: Agregar el foreign key constraint (solo si existe CashSession)
    if (cashSessionExists) {
      console.log('🔗 Agregando foreign key constraint...');
      try {
        await client.query(`
          ALTER TABLE "Expense" 
          ADD CONSTRAINT "Expense_cashSessionId_fkey" 
          FOREIGN KEY ("cashSessionId") REFERENCES "CashSession"("id") 
          ON DELETE SET NULL 
          ON UPDATE CASCADE;
        `);
        console.log('   ✅ Constraint agregado\n');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('   ℹ️  El constraint ya existe\n');
        } else {
          throw error;
        }
      }
    } else {
      console.log('   ℹ️  Saltando foreign key (CashSession no existe)\n');
    }

    // PASO 5: Verificar que todo está correcto
    console.log('✅ Verificación final...');
    const finalCheck = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'Expense' 
        AND column_name = 'cashSessionId';
    `);

    if (finalCheck.rows.length > 0) {
      console.log('   ✅ Columna verificada:');
      console.log(`      - Tipo: ${finalCheck.rows[0].data_type}`);
      console.log(`      - Nullable: ${finalCheck.rows[0].is_nullable}`);
      console.log('');
    }

    console.log('🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE\n');
    console.log('📝 La columna cashSessionId ha sido agregada a la tabla Expense');
    console.log('💡 El dashboard ahora debería funcionar correctamente');

  } catch (error) {
    console.error('\n❌ ERROR durante la migración:', error.message);
    console.error('\nDetalles del error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Conexión cerrada');
  }
}

// Ejecutar la migración
addExpenseColumn()
  .then(() => {
    console.log('\n✅ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });

// mark-applied-migrations.js
// Script para marcar migraciones que ya fueron aplicadas en la base de datos

const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:wGcAKDSKDggpmWPulURTqPDEYOPovsPy@trolley.proxy.rlwy.net:45234/railway';

// Lista de migraciones que sabemos que ya están aplicadas según los errores
const migrationsToMark = [
  '20250712165332_add_payment_method_to_sale', // paymentMethod ya existe en Sale
  '20250712203045_add_cash_closing',
  '20250712204235_add_expense',
  '20250714054232_add_sale_payments',
  '20250804194809_add_clients',
  '20250806030249_add_credit_notes',
  '20250806042806_expense_category_softdelete',
  '20250806045730_add_recurring_expenses',
  '20250806050821_add_expense_fields',
  '20250806203446_add_recurring_expenses',
  '20250807211735_add_notifications_system',
  '20250807222806_improve_categories',
  '20250807223443_update_category_model',
  '20250807223550_add_isactive_to_product',
  '20250807230026_enhance_unit_model',
  '20250807231421_enhance_supplier_model',
  '20250808004723_enhance_products_for_perfumery',
  '20250808005534_update_product_movement_fields',
  '20250808080715_add_profit_tracking_to_sale_details',
  '20250821171938_add_capital_table',
  '20250821172634_add_invoice_table',
  '20250826184420_add_sales_type_to_products',
  '20250827055423_add_capital_movement_model',
  '20250929000001_add_company_code_to_user',
  '20251105000001_add_orders_module'
];

async function marcarMigracionesAplicadas() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✓ Conectado a la base de datos\n');

    console.log('=== VERIFICANDO MIGRACIONES PENDIENTES ===\n');

    // Ver cuáles migraciones ya están registradas
    const existing = await client.query(`
      SELECT migration_name FROM _prisma_migrations
      WHERE migration_name = ANY($1)
    `, [migrationsToMark]);

    const existingNames = existing.rows.map(r => r.migration_name);
    const toInsert = migrationsToMark.filter(m => !existingNames.includes(m));

    console.log(`Migraciones ya registradas: ${existingNames.length}`);
    console.log(`Migraciones a agregar: ${toInsert.length}\n`);

    if (toInsert.length === 0) {
      console.log('✓ Todas las migraciones ya están registradas\n');
      return;
    }

    console.log('Migraciones a marcar como aplicadas:');
    toInsert.forEach(m => console.log(`  - ${m}`));
    console.log();

    // Insertar registros de migraciones como completadas
    console.log('=== MARCANDO MIGRACIONES COMO APLICADAS ===\n');

    for (const migration of toInsert) {
      const checksum = ''; // Prisma no requiere checksum para migraciones ya aplicadas
      
      await client.query(`
        INSERT INTO _prisma_migrations (
          id, 
          checksum, 
          finished_at, 
          migration_name, 
          logs, 
          rolled_back_at, 
          started_at, 
          applied_steps_count
        ) VALUES (
          gen_random_uuid()::text,
          $1,
          NOW(),
          $2,
          'Migración marcada como aplicada - cambios ya existían en la base de datos',
          NULL,
          NOW(),
          1
        )
      `, [checksum, migration]);

      console.log(`✓ ${migration}`);
    }

    console.log('\n✓ Todas las migraciones marcadas como aplicadas\n');
    console.log('=== SIGUIENTE PASO ===');
    console.log('Ejecuta:');
    console.log('  DATABASE_URL="..." npx prisma migrate deploy');
    console.log('\nPara verificar que no quedan migraciones pendientes.');

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

marcarMigracionesAplicadas();

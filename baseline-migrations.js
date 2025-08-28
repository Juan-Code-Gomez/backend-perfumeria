#!/usr/bin/env node
// Script para marcar todas las migraciones como aplicadas
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const migrations = [
  '20250711044208_init',
  '20250712165332_add_payment_method_to_sale',
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
  '20250827055423_add_capital_movement_model'
];

async function markAllMigrationsApplied() {
  console.log('🔧 Marcando todas las migraciones como aplicadas...');
  
  for (const migration of migrations) {
    try {
      console.log(`✅ Marcando: ${migration}`);
      await execAsync(`npx prisma migrate resolve --applied ${migration}`);
    } catch (error) {
      if (error.stderr.includes('already recorded as applied')) {
        console.log(`⚠️  Ya aplicada: ${migration}`);
      } else {
        console.error(`❌ Error en ${migration}:`, error.stderr);
      }
    }
  }
  
  console.log('🎉 Baseline completado!');
}

markAllMigrationsApplied().catch(console.error);

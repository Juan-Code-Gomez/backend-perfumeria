#!/bin/bash
# Script para hacer baseline de la base de datos existente
echo "🔧 Iniciando baseline de la base de datos..."

# 1. Sincronizar el esquema actual con db push
echo "📊 Sincronizando esquema actual..."
npx prisma db push

# 2. Marcar todas las migraciones como aplicadas
echo "✅ Marcando migraciones como aplicadas..."
npx prisma migrate resolve --applied 20250711044208_init
npx prisma migrate resolve --applied 20250712165332_add_payment_method_to_sale
npx prisma migrate resolve --applied 20250712203045_add_cash_closing
npx prisma migrate resolve --applied 20250712204235_add_expense
npx prisma migrate resolve --applied 20250714054232_add_sale_payments
npx prisma migrate resolve --applied 20250804194809_add_clients
npx prisma migrate resolve --applied 20250806030249_add_credit_notes
npx prisma migrate resolve --applied 20250806042806_expense_category_softdelete
npx prisma migrate resolve --applied 20250806045730_add_recurring_expenses
npx prisma migrate resolve --applied 20250806050821_add_expense_fields
npx prisma migrate resolve --applied 20250806203446_add_recurring_expenses
npx prisma migrate resolve --applied 20250807211735_add_notifications_system
npx prisma migrate resolve --applied 20250807222806_improve_categories
npx prisma migrate resolve --applied 20250807223443_update_category_model
npx prisma migrate resolve --applied 20250807223550_add_isactive_to_product
npx prisma migrate resolve --applied 20250807230026_enhance_unit_model
npx prisma migrate resolve --applied 20250807231421_enhance_supplier_model
npx prisma migrate resolve --applied 20250808004723_enhance_products_for_perfumery
npx prisma migrate resolve --applied 20250808005534_update_product_movement_fields
npx prisma migrate resolve --applied 20250808080715_add_profit_tracking_to_sale_details
npx prisma migrate resolve --applied 20250821171938_add_capital_table
npx prisma migrate resolve --applied 20250821172634_add_invoice_table
npx prisma migrate resolve --applied 20250826184420_add_sales_type_to_products
npx prisma migrate resolve --applied 20250827055423_add_capital_movement_model

echo "🎉 Baseline completado! La base de datos ahora está sincronizada con las migraciones."

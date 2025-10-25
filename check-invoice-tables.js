const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkInvoiceTables() {
  try {
    console.log('🔍 Verificando tablas de Invoice en la base de datos...\n');

    // Verificar tablas existentes
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('Invoice', 'InvoiceItem', 'InvoicePayment')
      ORDER BY table_name;
    `;

    console.log('📋 Tablas encontradas:');
    tables.forEach(t => console.log(`  - ${t.table_name}`));
    console.log('');

    // Verificar columnas de Invoice
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 TABLA: Invoice');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const invoiceColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Invoice'
      ORDER BY ordinal_position;
    `;

    const expectedInvoiceColumns = [
      'id', 'invoiceNumber', 'supplierName', 'amount', 'paidAmount',
      'status', 'description', 'invoiceDate', 'dueDate', 'createdAt',
      'updatedAt', 'hasInventoryImpact', 'inventoryProcessed', 'isHistorical',
      'needsReconciliation', 'originalDocument', 'pricesAnalyzed', 'supplierId', 'notes'
    ];

    console.log(`Total columnas encontradas: ${invoiceColumns.length}`);
    console.log(`Columnas esperadas: ${expectedInvoiceColumns.length}\n`);

    const foundInvoiceColumns = invoiceColumns.map(c => c.column_name);
    const missingInvoice = expectedInvoiceColumns.filter(c => !foundInvoiceColumns.includes(c));

    if (missingInvoice.length > 0) {
      console.log('❌ COLUMNAS FALTANTES EN Invoice:');
      missingInvoice.forEach(col => console.log(`  - ${col}`));
    } else {
      console.log('✅ Invoice tiene todas las columnas necesarias');
    }
    console.log('');

    // Verificar columnas de InvoiceItem
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 TABLA: InvoiceItem');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const invoiceItemColumns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'InvoiceItem'
        ORDER BY ordinal_position;
      `;

      const expectedItemColumns = [
        'id', 'invoiceId', 'description', 'quantity', 'unitPrice',
        'totalPrice', 'productId', 'shouldCreateProduct', 'affectInventory',
        'currentMarketPrice', 'priceVariation', 'profitMargin', 'notes',
        'createdAt', 'updatedAt'
      ];

      console.log(`Total columnas encontradas: ${invoiceItemColumns.length}`);
      console.log(`Columnas esperadas: ${expectedItemColumns.length}\n`);

      const foundItemColumns = invoiceItemColumns.map(c => c.column_name);
      const missingItem = expectedItemColumns.filter(c => !foundItemColumns.includes(c));

      if (missingItem.length > 0) {
        console.log('❌ COLUMNAS FALTANTES EN InvoiceItem:');
        missingItem.forEach(col => console.log(`  - ${col}`));
      } else {
        console.log('✅ InvoiceItem tiene todas las columnas necesarias');
      }
    } catch (error) {
      console.log('❌ ERROR: La tabla InvoiceItem NO EXISTE en la base de datos');
      console.log('   Necesitas crear la tabla completa.');
    }
    console.log('');

    // Verificar columnas de InvoicePayment
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 TABLA: InvoicePayment');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const paymentColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'InvoicePayment'
      ORDER BY ordinal_position;
    `;

    const expectedPaymentColumns = [
      'id', 'invoiceId', 'amount', 'paymentDate', 'paymentMethod',
      'notes', 'expenseId', 'createdAt', 'updatedAt'
    ];

    console.log(`Total columnas encontradas: ${paymentColumns.length}`);
    console.log(`Columnas esperadas: ${expectedPaymentColumns.length}\n`);

    const foundPaymentColumns = paymentColumns.map(c => c.column_name);
    const missingPayment = expectedPaymentColumns.filter(c => !foundPaymentColumns.includes(c));

    if (missingPayment.length > 0) {
      console.log('❌ COLUMNAS FALTANTES EN InvoicePayment:');
      missingPayment.forEach(col => console.log(`  - ${col}`));
    } else {
      console.log('✅ InvoicePayment tiene todas las columnas necesarias');
    }
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 RESUMEN:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Invoice: ${missingInvoice.length === 0 ? '✅' : '❌'} ${missingInvoice.length} columnas faltantes`);
    console.log(`InvoicePayment: ${missingPayment.length === 0 ? '✅' : '❌'} ${missingPayment.length} columnas faltantes`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkInvoiceTables();

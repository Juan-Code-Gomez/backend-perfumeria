const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnoseAllInvoiceTables() {
  try {
    console.log('🔍 DIAGNÓSTICO COMPLETO DE TABLAS DE FACTURAS\n');
    console.log('='.repeat(60));

    // 1. Invoice
    console.log('\n📋 Tabla: Invoice');
    const invoiceColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'Invoice'
      ORDER BY ordinal_position;
    `;
    console.log(`   Columnas actuales: ${invoiceColumns.length}`);
    console.log('   Columnas:', invoiceColumns.map(c => c.column_name).join(', '));

    // 2. InvoiceItem
    console.log('\n📦 Tabla: InvoiceItem');
    const invoiceItemColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'InvoiceItem'
      ORDER BY ordinal_position;
    `;
    console.log(`   Columnas actuales: ${invoiceItemColumns.length}`);
    console.log('   Columnas:', invoiceItemColumns.map(c => c.column_name).join(', '));

    // 3. InvoicePayment
    console.log('\n💳 Tabla: InvoicePayment');
    const invoicePaymentColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'InvoicePayment'
      ORDER BY ordinal_position;
    `;
    console.log(`   Columnas actuales: ${invoicePaymentColumns.length}`);
    console.log('   Columnas:', invoicePaymentColumns.map(c => c.column_name).join(', '));

    // 4. Supplier (porque las facturas se relacionan con proveedores)
    console.log('\n🏢 Tabla: Supplier');
    const supplierColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'Supplier'
      ORDER BY ordinal_position;
    `;
    console.log(`   Columnas actuales: ${supplierColumns.length}`);
    console.log('   Columnas:', supplierColumns.map(c => c.column_name).join(', '));

    // 5. Product (porque InvoiceItem se relaciona con productos)
    console.log('\n📦 Tabla: Product');
    const productColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'Product'
      ORDER BY ordinal_position;
    `;
    console.log(`   Columnas actuales: ${productColumns.length}`);
    console.log('   Columnas:', productColumns.map(c => c.column_name).join(', '));

    // 6. Leer schema.prisma para comparar
    console.log('\n\n📖 COMPARANDO CON SCHEMA.PRISMA...\n');
    console.log('='.repeat(60));

    const fs = require('fs');
    const schemaPath = require('path').join(__dirname, '..', 'perfumeria-sistema', 'prisma', 'schema.prisma');
    
    let schemaContent = '';
    try {
      schemaContent = fs.readFileSync(schemaPath, 'utf8');
    } catch (e) {
      console.log('⚠️  No se pudo leer schema.prisma del frontend, intentando local...');
      const localSchemaPath = require('path').join(__dirname, 'prisma', 'schema.prisma');
      try {
        schemaContent = fs.readFileSync(localSchemaPath, 'utf8');
      } catch (e2) {
        console.log('❌ No se encontró schema.prisma');
      }
    }

    // Extraer modelo Invoice del schema
    const invoiceMatch = schemaContent.match(/model Invoice \{([^}]+)\}/s);
    if (invoiceMatch) {
      const invoiceFields = invoiceMatch[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('//') && !line.startsWith('@@'))
        .map(line => line.split(/\s+/)[0])
        .filter(field => field && !field.startsWith('@'));
      
      console.log('\n📋 Invoice - Campos en schema.prisma:', invoiceFields.length);
      const missingInvoice = invoiceFields.filter(f => 
        !invoiceColumns.some(c => c.column_name === f)
      );
      if (missingInvoice.length > 0) {
        console.log('   ❌ FALTAN:', missingInvoice.join(', '));
      } else {
        console.log('   ✅ Todos los campos presentes');
      }
    }

    // Extraer modelo InvoiceItem del schema
    const invoiceItemMatch = schemaContent.match(/model InvoiceItem \{([^}]+)\}/s);
    if (invoiceItemMatch) {
      const invoiceItemFields = invoiceItemMatch[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('//') && !line.startsWith('@@'))
        .map(line => line.split(/\s+/)[0])
        .filter(field => field && !field.startsWith('@'));
      
      console.log('\n📦 InvoiceItem - Campos en schema.prisma:', invoiceItemFields.length);
      const missingInvoiceItem = invoiceItemFields.filter(f => 
        !invoiceItemColumns.some(c => c.column_name === f)
      );
      if (missingInvoiceItem.length > 0) {
        console.log('   ❌ FALTAN:', missingInvoiceItem.join(', '));
      } else {
        console.log('   ✅ Todos los campos presentes');
      }
    }

    // Extraer modelo InvoicePayment del schema
    const invoicePaymentMatch = schemaContent.match(/model InvoicePayment \{([^}]+)\}/s);
    if (invoicePaymentMatch) {
      const invoicePaymentFields = invoicePaymentMatch[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('//') && !line.startsWith('@@'))
        .map(line => line.split(/\s+/)[0])
        .filter(field => field && !field.startsWith('@'));
      
      console.log('\n💳 InvoicePayment - Campos en schema.prisma:', invoicePaymentFields.length);
      const missingInvoicePayment = invoicePaymentFields.filter(f => 
        !invoicePaymentColumns.some(c => c.column_name === f)
      );
      if (missingInvoicePayment.length > 0) {
        console.log('   ❌ FALTAN:', missingInvoicePayment.join(', '));
      } else {
        console.log('   ✅ Todos los campos presentes');
      }
    }

    // Intentar crear una factura de prueba para ver el error exacto
    console.log('\n\n🧪 PROBANDO CREAR FACTURA DE PRUEBA...\n');
    console.log('='.repeat(60));

    try {
      const testInvoice = await prisma.invoice.create({
        data: {
          invoiceNumber: 'TEST-' + Date.now(),
          supplierName: 'Test Supplier',
          amount: 100,
          paidAmount: 0,
          status: 'PENDING',
          invoiceDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
      });
      console.log('✅ Factura de prueba creada exitosamente!');
      console.log('   ID:', testInvoice.id);
      
      // Eliminar la factura de prueba
      await prisma.invoice.delete({ where: { id: testInvoice.id } });
      console.log('✅ Factura de prueba eliminada');
    } catch (createError) {
      console.error('❌ ERROR AL CREAR FACTURA:');
      console.error('   Mensaje:', createError.message);
      if (createError.meta) {
        console.error('   Meta:', JSON.stringify(createError.meta, null, 2));
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Diagnóstico completo\n');

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseAllInvoiceTables();

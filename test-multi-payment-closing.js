// test-multi-payment-closing.js
// Script para probar el cierre de caja con pagos múltiples

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMultiPaymentClosing() {
  try {
    console.log('🧪 Testing cash closing with multiple payments...\n');

    // 1. Buscar una venta con pagos múltiples
    const salesWithMultiplePayments = await prisma.sale.findMany({
      where: {
        isPaid: true,
      },
      include: {
        payments: true,
      },
      take: 10,
      orderBy: {
        date: 'desc',
      },
    });

    console.log(`📊 Found ${salesWithMultiplePayments.length} paid sales\n`);

    // Identificar ventas con pagos múltiples
    const multiPaymentSales = salesWithMultiplePayments.filter(
      sale => sale.payments && sale.payments.length > 1
    );

    console.log(`💰 Sales with multiple payments: ${multiPaymentSales.length}\n`);

    if (multiPaymentSales.length > 0) {
      multiPaymentSales.forEach(sale => {
        console.log(`\n📝 Sale #${sale.id}:`);
        console.log(`   Date: ${sale.date.toISOString().split('T')[0]}`);
        console.log(`   Total: $${sale.totalAmount.toLocaleString()}`);
        console.log(`   Payment Method field: ${sale.paymentMethod || 'NULL'}`);
        console.log(`   Payments breakdown:`);
        
        sale.payments.forEach(payment => {
          console.log(`     - ${payment.method}: $${payment.amount.toLocaleString()}`);
        });

        const totalPayments = sale.payments.reduce((sum, p) => sum + p.amount, 0);
        console.log(`   Total from payments: $${totalPayments.toLocaleString()}`);
        
        const difference = sale.totalAmount - totalPayments;
        if (Math.abs(difference) > 0.01) {
          console.log(`   ⚠️ WARNING: Difference of $${difference.toFixed(2)}`);
        } else {
          console.log(`   ✅ Payments match sale total`);
        }
      });
    } else {
      console.log('ℹ️ No sales with multiple payments found in recent records.');
      console.log('   This is normal if you haven\'t made any multi-payment sales yet.');
    }

    // 2. Mostrar cómo se calcularían los totales por método
    console.log('\n\n📊 CASH CLOSING CALCULATION SIMULATION');
    console.log('==========================================\n');

    let cashTotal = 0;
    let cardTotal = 0;
    let transferTotal = 0;
    let creditTotal = 0;

    salesWithMultiplePayments.forEach(sale => {
      if (sale.payments && sale.payments.length > 0) {
        // Usar tabla de pagos
        sale.payments.forEach(payment => {
          const amount = payment.amount || 0;
          const method = payment.method?.toLowerCase() || '';
          
          if (method.includes('efectivo') || method.includes('cash')) {
            cashTotal += amount;
          } else if (method.includes('tarjeta') || method.includes('card')) {
            cardTotal += amount;
          } else if (method.includes('transferencia') || method.includes('transfer')) {
            transferTotal += amount;
          } else if (method.includes('crédito') || method.includes('credit')) {
            creditTotal += amount;
          }
        });
      } else {
        // Compatibilidad con método único
        const amount = sale.totalAmount || 0;
        const method = sale.paymentMethod?.toLowerCase() || 'efectivo';
        
        if (method.includes('efectivo')) {
          cashTotal += amount;
        } else if (method.includes('tarjeta')) {
          cardTotal += amount;
        } else if (method.includes('transferencia')) {
          transferTotal += amount;
        } else if (method.includes('crédito') || !sale.isPaid) {
          creditTotal += amount;
        }
      }
    });

    console.log(`Total en Efectivo: $${cashTotal.toLocaleString()}`);
    console.log(`Total en Tarjeta: $${cardTotal.toLocaleString()}`);
    console.log(`Total en Transferencia: $${transferTotal.toLocaleString()}`);
    console.log(`Total en Crédito: $${creditTotal.toLocaleString()}`);
    console.log(`\nGrand Total: $${(cashTotal + cardTotal + transferTotal + creditTotal).toLocaleString()}`);

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar test
testMultiPaymentClosing()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

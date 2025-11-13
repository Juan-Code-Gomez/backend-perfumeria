// verify-discount-sales.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyDiscountSales() {
  console.log('🔍 Verificando ventas con descuentos en la base de datos...\n');
  
  try {
    // Obtener todas las ventas con descuentos
    const salesWithDiscounts = await prisma.sale.findMany({
      where: {
        discountAmount: {
          gt: 0
        }
      },
      select: {
        id: true,
        date: true,
        customerName: true,
        subtotalAmount: true,
        discountType: true,
        discountValue: true,
        discountAmount: true,
        totalAmount: true,
      },
      orderBy: {
        id: 'desc'
      }
    });

    console.log(`📊 Encontradas ${salesWithDiscounts.length} ventas con descuentos:\n`);

    salesWithDiscounts.forEach((sale, index) => {
      console.log(`${index + 1}. Venta #${sale.id}:`);
      console.log(`   📅 Fecha: ${sale.date.toISOString().split('T')[0]}`);
      console.log(`   👤 Cliente: ${sale.customerName || 'Sin nombre'}`);
      console.log(`   💰 Subtotal: $${sale.subtotalAmount?.toLocaleString() || 'N/A'}`);
      console.log(`   🏷️  Tipo descuento: ${sale.discountType || 'N/A'}`);
      console.log(`   📉 Valor descuento: ${sale.discountType === 'percentage' ? sale.discountValue + '%' : '$' + sale.discountValue?.toLocaleString()}`);
      console.log(`   💸 Monto descuento: $${sale.discountAmount?.toLocaleString() || 'N/A'}`);
      console.log(`   ✅ Total final: $${sale.totalAmount.toLocaleString()}`);
      console.log('   ' + '─'.repeat(50));
    });

    // Verificar también las ventas sin descuento recientes
    console.log('\n📋 Últimas ventas sin descuento (para comparar):');
    
    const salesWithoutDiscounts = await prisma.sale.findMany({
      where: {
        OR: [
          { discountAmount: 0 },
          { discountAmount: null }
        ]
      },
      select: {
        id: true,
        date: true,
        customerName: true,
        totalAmount: true,
      },
      orderBy: {
        id: 'desc'
      },
      take: 3
    });

    salesWithoutDiscounts.forEach((sale, index) => {
      console.log(`${index + 1}. Venta #${sale.id} - ${sale.customerName || 'Sin nombre'} - $${sale.totalAmount.toLocaleString()} (sin descuento)`);
    });

  } catch (error) {
    console.error('❌ Error verificando ventas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDiscountSales();
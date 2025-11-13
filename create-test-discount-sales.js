// create-test-discount-sales.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestSalesWithDiscounts() {
  console.log('🔄 Creando ventas de prueba con descuentos...');
  
  try {
    // Obtener algunos productos para las ventas
    const products = await prisma.product.findMany({
      take: 3,
      select: { id: true, name: true, salePrice: true, stock: true }
    });

    if (products.length === 0) {
      console.log('❌ No hay productos disponibles. Crea algunos productos primero.');
      return;
    }

    console.log(`📦 Usando productos:`, products.map(p => `${p.name} ($${p.salePrice})`));

    const testSales = [
      // Venta 1: Descuento porcentual 10%
      {
        customerName: 'Juan Pérez',
        details: [
          { productId: products[0].id, quantity: 2, unitPrice: products[0].salePrice },
          { productId: products[1]?.id || products[0].id, quantity: 1, unitPrice: products[1]?.salePrice || products[0].salePrice }
        ],
        discountType: 'percentage',
        discountValue: 10
      },
      // Venta 2: Descuento fijo $5000
      {
        customerName: 'María García',
        details: [
          { productId: products[0].id, quantity: 3, unitPrice: products[0].salePrice }
        ],
        discountType: 'fixed',
        discountValue: 5000
      },
      // Venta 3: Descuento porcentual 15%
      {
        customerName: 'Carlos López',
        details: [
          { productId: products[1]?.id || products[0].id, quantity: 2, unitPrice: products[1]?.salePrice || products[0].salePrice },
          { productId: products[2]?.id || products[0].id, quantity: 1, unitPrice: products[2]?.salePrice || products[0].salePrice }
        ],
        discountType: 'percentage',
        discountValue: 15
      }
    ];

    for (let i = 0; i < testSales.length; i++) {
      const saleData = testSales[i];
      
      // Calcular subtotal
      const subtotal = saleData.details.reduce((sum, detail) => 
        sum + (detail.quantity * detail.unitPrice), 0
      );
      
      // Calcular descuento
      const discountAmount = saleData.discountType === 'percentage'
        ? (subtotal * saleData.discountValue / 100)
        : saleData.discountValue;
      
      const totalAmount = subtotal - discountAmount;
      
      console.log(`\n📝 Creando venta ${i + 1}:`);
      console.log(`   Cliente: ${saleData.customerName}`);
      console.log(`   Subtotal: $${subtotal.toLocaleString()}`);
      console.log(`   Descuento: ${saleData.discountType === 'percentage' ? saleData.discountValue + '%' : '$' + saleData.discountValue.toLocaleString()}`);
      console.log(`   Monto descuento: $${discountAmount.toLocaleString()}`);
      console.log(`   Total: $${totalAmount.toLocaleString()}`);

      const sale = await prisma.sale.create({
        data: {
          customerName: saleData.customerName,
          subtotalAmount: subtotal,
          discountType: saleData.discountType,
          discountValue: saleData.discountValue,
          discountAmount: discountAmount,
          totalAmount: totalAmount,
          paidAmount: totalAmount,
          isPaid: true,
          paymentMethod: 'EFECTIVO',
          details: {
            create: saleData.details.map(detail => ({
              productId: detail.productId,
              quantity: detail.quantity,
              unitPrice: detail.unitPrice,
              totalPrice: detail.quantity * detail.unitPrice,
              purchasePrice: detail.unitPrice * 0.6, // Costo simulado (60% del precio de venta)
              profitAmount: detail.unitPrice * detail.quantity * 0.4, // Ganancia simulada
              profitMargin: 40, // 40% margen
              suggestedPrice: detail.unitPrice
            }))
          }
        },
        include: {
          details: true
        }
      });

      console.log(`   ✅ Venta #${sale.id} creada exitosamente`);
    }
    
    console.log('\n🎉 Todas las ventas de prueba han sido creadas exitosamente!');
    console.log('📊 Ahora puedes probar el reporte de descuentos');
    
  } catch (error) {
    console.error('❌ Error creando ventas de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestSalesWithDiscounts();
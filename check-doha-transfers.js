// Script mejorado para analizar transferencias en DOHA
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:rOrTEiOgEyAuZDvAxtTBrdfCyaWGCVIq@ballast.proxy.rlwy.net:14597/railway'
    }
  }
});

async function analyzeTransfers() {
  try {
    console.log('💸 Analizando ventas de TRANSFERENCIA en DOHA...\n');

    // Buscar ventas con método de pago Transferencia de últimos 15 días
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const transferSales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: fifteenDaysAgo
        },
        paymentMethod: 'Transferencia'
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        date: true,
        createdAt: true,
        paymentMethod: true,
        totalAmount: true,
        customerName: true,
      }
    });

    // También buscar pagos de tipo transferencia
    const transferPayments = await prisma.salePayment.findMany({
      where: {
        date: {
          gte: fifteenDaysAgo
        },
        method: 'Transferencia'
      },
      include: {
        sale: {
          select: {
            id: true,
            date: true,
            createdAt: true,
            totalAmount: true,
            customerName: true,
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    console.log(`📊 Ventas directas con transferencia: ${transferSales.length}`);
    console.log(`📊 Pagos registrados como transferencia: ${transferPayments.length}\n`);

    // Analizar ventas de transferencia
    if (transferSales.length > 0) {
      console.log('🔍 ANÁLISIS DE VENTAS DE TRANSFERENCIA:\n');

      const problematic = transferSales.filter(sale => {
        const saleDate = new Date(sale.date);
        const createdDate = new Date(sale.createdAt);
        
        const saleDateOnly = saleDate.toISOString().split('T')[0];
        const createdDateOnly = createdDate.toISOString().split('T')[0];
        
        return saleDateOnly !== createdDateOnly;
      });

      if (problematic.length > 0) {
        console.log(`🚨 ${problematic.length} TRANSFERENCIAS CON DESCUADRE DE FECHA:\n`);
        
        problematic.forEach(sale => {
          const saleDate = new Date(sale.date);
          const createdDate = new Date(sale.createdAt);
          
          console.log(`Venta #${sale.id}:`);
          console.log(`  Monto: $${sale.totalAmount.toLocaleString()}`);
          console.log(`  Cliente: ${sale.customerName || 'N/A'}`);
          console.log(`  Fecha registrada (date): ${saleDate.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
          console.log(`  Fecha creación (createdAt): ${createdDate.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
          console.log(`  ⚠️ Venta creada el ${createdDate.toLocaleDateString('es-CO')} pero registrada como del ${saleDate.toLocaleDateString('es-CO')}`);
          console.log('');
        });

        console.log(`\n📈 Resumen:`);
        console.log(`  - Total transferencias analizadas: ${transferSales.length}`);
        console.log(`  - Con descuadre de fecha: ${problematic.length} (${(problematic.length/transferSales.length*100).toFixed(1)}%)`);
        console.log(`  - Sin problemas: ${transferSales.length - problematic.length}`);
      } else {
        console.log('✅ Todas las transferencias tienen fechas consistentes\n');
      }

      // Análisis de horarios
      console.log('\n⏰ HORARIOS DE REGISTRO (hora de Colombia):\n');
      
      const byHour = {};
      transferSales.forEach(sale => {
        const createdDate = new Date(sale.createdAt);
        // Convertir a hora de Colombia
        const colombiaTime = new Date(createdDate.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
        const hour = colombiaTime.getHours();
        
        byHour[hour] = (byHour[hour] || []);
        byHour[hour].push(sale);
      });

      Object.entries(byHour)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .forEach(([hour, sales]) => {
          const bar = '█'.repeat(Math.ceil(sales.length / 2));
          console.log(`  ${hour.padStart(2, '0')}:00 - ${bar} (${sales.length} ventas, $${sales.reduce((sum, s) => sum + s.totalAmount, 0).toLocaleString()})`);
        });

      // Ventas registradas tarde en la noche (después de las 10 PM)
      const lateNight = transferSales.filter(sale => {
        const createdDate = new Date(sale.createdAt);
        const colombiaTime = new Date(createdDate.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
        const hour = colombiaTime.getHours();
        return hour >= 22 || hour <= 5; // 10 PM a 5 AM
      });

      if (lateNight.length > 0) {
        console.log(`\n\n🌙 ${lateNight.length} transferencias registradas en horario nocturno (10 PM - 5 AM):`);
        lateNight.forEach(sale => {
          const createdDate = new Date(sale.createdAt);
          const saleDate = new Date(sale.date);
          console.log(`  Venta #${sale.id}: $${sale.totalAmount.toLocaleString()} - Registrada ${createdDate.toLocaleString('es-CO', { timeZone: 'America/Bogota' })} como del día ${saleDate.toLocaleDateString('es-CO')}`);
        });
      }
    }

    // Análisis de pagos de transferencia
    if (transferPayments.length > 0) {
      console.log('\n\n💳 ANÁLISIS DE PAGOS DE TRANSFERENCIA:\n');

      transferPayments.slice(0, 10).forEach(payment => {
        const paymentDate = new Date(payment.date);
        const saleDate = new Date(payment.sale.date);
        const saleCreatedDate = new Date(payment.sale.createdAt);

        console.log(`Pago #${payment.id} (Venta #${payment.sale.id}):`);
        console.log(`  Monto pago: $${payment.amount.toLocaleString()}`);
        console.log(`  Fecha pago: ${paymentDate.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
        console.log(`  Fecha venta: ${saleDate.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
        console.log(`  Venta creada: ${saleCreatedDate.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
        if (payment.note) {
          console.log(`  Nota: ${payment.note}`);
        }
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeTransfers();

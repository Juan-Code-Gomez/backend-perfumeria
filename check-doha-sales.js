// Script para analizar ventas de DOHA y detectar problema de fechas
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:rOrTEiOgEyAuZDvAxtTBrdfCyaWGCVIq@ballast.proxy.rlwy.net:14597/railway'
    }
  }
});

async function analyzeSales() {
  try {
    console.log('🔍 Analizando ventas de DOHA...\n');

    // Obtener las últimas 50 ventas
    const sales = await prisma.sale.findMany({
      take: 50,
      orderBy: { id: 'desc' },
      select: {
        id: true,
        date: true,
        createdAt: true,
        paymentMethod: true,
        totalAmount: true,
        customerName: true,
      }
    });

    console.log(`📊 Total ventas analizadas: ${sales.length}\n`);

    // Detectar ventas con fecha diferente a createdAt
    const problematicSales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      const createdDate = new Date(sale.createdAt);
      
      // Comparar solo las fechas (sin hora)
      const saleDateOnly = saleDate.toISOString().split('T')[0];
      const createdDateOnly = createdDate.toISOString().split('T')[0];
      
      return saleDateOnly !== createdDateOnly;
    });

    if (problematicSales.length > 0) {
      console.log(`🚨 ENCONTRADAS ${problematicSales.length} VENTAS CON DESCUADRE DE FECHA:\n`);
      
      problematicSales.forEach(sale => {
        const saleDate = new Date(sale.date);
        const createdDate = new Date(sale.createdAt);
        
        console.log(`Venta #${sale.id}:`);
        console.log(`  Método de pago: ${sale.paymentMethod || 'N/A'}`);
        console.log(`  Monto: $${sale.totalAmount}`);
        console.log(`  Fecha registrada (date): ${saleDate.toISOString()}`);
        console.log(`  Fecha de creación (createdAt): ${createdDate.toISOString()}`);
        console.log(`  Diferencia: date=${saleDate.toLocaleDateString('es-CO')} vs createdAt=${createdDate.toLocaleDateString('es-CO')}`);
        console.log(`  Cliente: ${sale.customerName || 'N/A'}`);
        console.log('');
      });

      // Contar por método de pago
      const byPaymentMethod = problematicSales.reduce((acc, sale) => {
        const method = sale.paymentMethod || 'N/A';
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {});

      console.log('\n📈 Descuadres por método de pago:');
      Object.entries(byPaymentMethod).forEach(([method, count]) => {
        console.log(`  ${method}: ${count} ventas`);
      });
    } else {
      console.log('✅ No se encontraron ventas con descuadre de fecha en las últimas 50 ventas');
    }

    // Analizar ventas de últimos 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        date: true,
        createdAt: true,
        paymentMethod: true,
        totalAmount: true,
      }
    });

    console.log(`\n\n📅 Análisis de últimos 7 días (${recentSales.length} ventas):\n`);

    const lateNightSales = recentSales.filter(sale => {
      const createdDate = new Date(sale.createdAt);
      const hour = createdDate.getUTCHours(); // Hora en UTC
      
      // Ventas creadas entre 4:00 AM y 6:00 AM UTC (11 PM - 1 AM Colombia)
      return hour >= 4 && hour <= 6;
    });

    if (lateNightSales.length > 0) {
      console.log(`🌙 Encontradas ${lateNightSales.length} ventas registradas en horario nocturno (problema de timezone):\n`);
      
      lateNightSales.forEach(sale => {
        const createdDate = new Date(sale.createdAt);
        const saleDate = new Date(sale.date);
        
        console.log(`Venta #${sale.id}:`);
        console.log(`  Método: ${sale.paymentMethod || 'N/A'}`);
        console.log(`  Hora UTC: ${createdDate.toISOString()}`);
        console.log(`  Hora Colombia: ${createdDate.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
        console.log(`  Fecha registrada: ${saleDate.toISOString().split('T')[0]}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeSales();

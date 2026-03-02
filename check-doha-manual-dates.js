// Script para verificar uso de fecha manual en ventas de DOHA
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:rOrTEiOgEyAuZDvAxtTBrdfCyaWGCVIq@ballast.proxy.rlwy.net:14597/railway'
    }
  }
});

async function analyzeManualDates() {
  try {
    console.log('📅 Analizando uso de FECHA MANUAL en DOHA...\n');

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    // Buscar ventas recientes
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: tenDaysAgo
        }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        date: true,
        createdAt: true,
        paymentMethod: true,
        totalAmount: true,
        customerName: true,
      },
      take: 100
    });

    console.log(`📊 Total ventas analizadas: ${sales.length}\n`);

    // Detectar ventas donde date !== createdAt (fecha manual)
    const manualDateSales = [];
    const sameDateSales = [];

    sales.forEach(sale => {
      const saleDate = new Date(sale.date);
      const createdDate = new Date(sale.createdAt);
      
      // Comparar fechas (sin hora) para detectar si se usó fecha manual
      const saleDateOnly = saleDate.toISOString().split('T')[0];
      const createdDateOnly = createdDate.toISOString().split('T')[0];
      
      if (saleDateOnly !== createdDateOnly) {
        manualDateSales.push(sale);
      } else {
        sameDateSales.push(sale);
      }
    });

    console.log(`\n📈 RESUMEN:`);
    console.log(`  - Ventas con fecha manual (date ≠ createdAt): ${manualDateSales.length}`);
    console.log(`  - Ventas con fecha automática (date = createdAt): ${sameDateSales.length}`);
    console.log(`  - % de ventas con fecha manual: ${(manualDateSales.length / sales.length * 100).toFixed(1)}%\n`);

    if (manualDateSales.length > 0) {
      console.log(`\n🚨 VENTAS CON FECHA MANUAL (${manualDateSales.length}):\n`);

      // Agrupar por método de pago
      const byPaymentMethod = manualDateSales.reduce((acc, sale) => {
        const method = sale.paymentMethod || 'N/A';
        acc[method] = (acc[method] || []);
        acc[method].push(sale);
        return acc;
      }, {});

      console.log('Por método de pago:');
      Object.entries(byPaymentMethod).forEach(([method, sales]) => {
        const totalAmount = sales.reduce((sum, s) => sum + s.totalAmount, 0);
        console.log(`  ${method}: ${sales.length} ventas ($${totalAmount.toLocaleString()})`);
      });

      console.log('\n\nDetalle de ventas con fecha manual:');
      manualDateSales.slice(0, 20).forEach(sale => {
        const saleDate = new Date(sale.date);
        const createdDate = new Date(sale.createdAt);
        
        // Calcular diferencia en días
        const diffMs = createdDate - saleDate;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        console.log(`\nVenta #${sale.id}:`);
        console.log(`  Método: ${sale.paymentMethod || 'N/A'}`);
        console.log(`  Monto: $${sale.totalAmount.toLocaleString()}`);
        console.log(`  Cliente: ${sale.customerName || 'N/A'}`);
        console.log(`  Fecha venta (manual): ${saleDate.toLocaleDateString('es-CO')} ${saleDate.toLocaleTimeString('es-CO')}`);
        console.log(`  Fecha creación (real): ${createdDate.toLocaleDateString('es-CO')} ${createdDate.toLocaleTimeString('es-CO')}`);
        console.log(`  ⚠️ Registrada ${diffDays} día(s) después`);
      });

      // Análisis de patrones
      console.log('\n\n📊 ANÁLISIS DE PATRONES:\n');
      
      // Agruparhora de creación
      const byCreationHour = {};
      manualDateSales.forEach(sale => {
        const createdDate = new Date(sale.createdAt);
        const colombiaTime = new Date(createdDate.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
        const hour = colombiaTime.getHours();
        
        byCreationHour[hour] = (byCreationHour[hour] || 0) + 1;
      });

      console.log('Hora de registro (Colombia) de ventas con fecha manual:');
      Object.entries(byCreationHour)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .forEach(([hour, count]) => {
          const bar = '█'.repeat(count);
          console.log(`  ${hour.padStart(2, '0')}:00 - ${bar} (${count})`);
        });

      // Días de retraso
      const delayDays = manualDateSales.map(sale => {
        const saleDate = new Date(sale.date);
        const createdDate = new Date(sale.createdAt);
        const diffMs = createdDate - saleDate;
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
      });

      console.log('\n\nDías de retraso en registro:');
      const delayCount = delayDays.reduce((acc, days) => {
        acc[days] = (acc[days] || 0) + 1;
        return acc;
      }, {});

      Object.entries(delayCount)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .forEach(([days, count]) => {
          const bar = '█'.repeat(count);
          console.log(`  ${days} día(s): ${bar} (${count} ventas)`);
        });
    } else {
      console.log('\n✅ No se encontraron ventas con fecha manual en los últimos 10 días');
    }

    // Verificar parámetro de sistema
    console.log('\n\n⚙️ CONFIGURACIÓN DEL SISTEMA:\n');
    
    const manualDateParam = await prisma.systemParameter.findFirst({
      where: {
        paramKey: 'ALLOW_MANUAL_SALE_DATE'
      }
    });

    if (manualDateParam) {
      console.log(`Parámetro ALLOW_MANUAL_SALE_DATE:`);
      console.log(`  Valor: ${manualDateParam.paramValue}`);
      console.log(`  Estado: ${manualDateParam.paramValue === 'true' ? '✅ HABILITADO' : '❌ DESHABILITADO'}`);
    } else {
      console.log('⚠️ Parámetro ALLOW_MANUAL_SALE_DATE no configurado (deshabilitado por defecto)');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeManualDates();

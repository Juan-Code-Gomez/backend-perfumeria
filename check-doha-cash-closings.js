// Script para analizar cierres de caja con descuadres en DOHA
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:rOrTEiOgEyAuZDvAxtTBrdfCyaWGCVIq@ballast.proxy.rlwy.net:14597/railway'
    }
  }
});

async function analyzeCashClosings() {
  try {
    console.log('🔍 Analizando cierres de caja de DOHA...\n');

    // Obtener cierres de caja con diferencias significativas
    const closings = await prisma.cashClosing.findMany({
      take: 20,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        date: true,
        createdAt: true,
        difference: true,
        systemCash: true,
        closingCash: true,
        totalSales: true,
        cashSales: true,
        cardSales: true,
        transferSales: true,
        creditSales: true,
        notes: true,
      }
    });

    console.log(`📊 Total cierres analizados: ${closings.length}\n`);

    // Identificar cierres con diferencias
    const withDifferences = closings.filter(c => Math.abs(c.difference) > 1000);

    if (withDifferences.length > 0) {
      console.log(`⚠️ Cierres con diferencias > $1,000:\n`);
      
      withDifferences.forEach(closing => {
        console.log(`Cierre #${closing.id}:`);
        console.log(`  Fecha del cierre: ${new Date(closing.date).toLocaleDateString('es-CO')}`);
        console.log(`  Creado el: ${new Date(closing.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
        console.log(`  Diferencia: $${closing.difference.toLocaleString()}`);
        console.log(`  Sistema: $${closing.systemCash} | Real: $${closing.closingCash}`);
        console.log(`  Ventas totales: $${closing.totalSales}`);
        console.log(`    - Efectivo: $${closing.cashSales}`);
        console.log(`    - Tarjeta: $${closing.cardSales}`);
        console.log(`    - Transferencia: $${closing.transferSales}`);
        console.log(`    - Crédito: $${closing.creditSales}`);
        if (closing.notes) {
          console.log(`  Notas: ${closing.notes}`);
        }
        console.log('');
      });
    }

    // Analizar ventas de transferencia de los últimos 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    console.log('\n\n💸 Analizando ventas de TRANSFERENCIA (últimos 30 días):\n');

    const transferSales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        },
        OR: [
          { paymentMethod: 'Transferencia' },
          {
            details: {
              some: {
                salePayments: {
                  some: {
                    method: 'Transferencia'
                  }
                }
              }
            }
          }
        ]
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

    // Buscar ventas con salePayments
    const transferSalesWithPayments = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      include: {
        salePayments: {
          where: {
            method: 'Transferencia'
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const allTransferSales = transferSalesWithPayments.filter(
      s => s.paymentMethod === 'Transferencia' || s.salePayments.length > 0
    );

    console.log(`📈 Total ventas de transferencia: ${allTransferSales.length}\n`);

    if (allTransferSales.length > 0) {
      // Verificar si alguna tiene date diferente a su fecha de creación
      const problemTransfers = allTransferSales.filter(sale => {
        const saleDate = new Date(sale.date);
        const createdDate = new Date(sale.createdAt);
        
        // Comparar fechas (sin hora)
        const saleDateOnly = saleDate.toISOString().split('T')[0];
        const createdDateOnly = createdDate.toISOString().split('T')[0];
        
        return saleDateOnly !== createdDateOnly;
      });

      if (problemTransfers.length > 0) {
        console.log(`🚨 TRANSFERENCIAS CON DESCUADRE DE FECHA: ${problemTransfers.length}\n`);
        
        problemTransfers.forEach(sale => {
          const saleDate = new Date(sale.date);
          const createdDate = new Date(sale.createdAt);
          
          console.log(`Venta #${sale.id}:`);
          console.log(`  Monto: $${sale.totalAmount}`);
          console.log(`  Método: ${sale.paymentMethod || 'Multiple'}`);
          console.log(`  Fecha venta (date): ${saleDate.toISOString()}`);
          console.log(`  Fecha creación (createdAt): ${createdDate.toISOString()}`);
          console.log(`  Diferencia: ${saleDateOnly} vs ${createdDateOnly}`);
          if (sale.salePayments && sale.salePayments.length > 0) {
            console.log(`  Pagos registrados:`);
            sale.salePayments.forEach(p => {
              console.log(`    - ${p.method}: $${p.amount} (${new Date(p.date).toISOString()})`);
            });
          }
          console.log('');
        });
      } else {
        console.log('✅ No se encontraron transferencias con descuadre de fecha');
      }

      // Análisis de horarios de registro
      console.log('\n\n⏰ Análisis de horarios de registro de transferencias:\n');
      
      const byHour = allTransferSales.reduce((acc, sale) => {
        const createdDate = new Date(sale.createdAt);
        const hourColombia = new Date(createdDate.toLocaleString('en-US', { timeZone: 'America/Bogota' })).getHours();
        
        acc[hourColombia] = (acc[hourColombia] || 0) + 1;
        return acc;
      }, {});

      console.log('Registros por hora (Colombia):');
      Object.entries(byHour)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .forEach(([hour, count]) => {
          const bar = '█'.repeat(Math.ceil(count / 2));
          console.log(`  ${hour.padStart(2, '0')}:00 - ${bar} (${count})`);
        });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeCashClosings();

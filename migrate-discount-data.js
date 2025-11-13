// migrate-discount-data.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateDiscountData() {
  console.log('🔄 Iniciando migración de datos de descuentos...');
  
  try {
    // Obtener todas las ventas sin subtotalAmount
    const sales = await prisma.sale.findMany({
      where: {
        subtotalAmount: null
      }
    });
    
    console.log(`📊 Encontradas ${sales.length} ventas para migrar`);
    
    // Actualizar cada venta
    for (const sale of sales) {
      await prisma.sale.update({
        where: { id: sale.id },
        data: {
          subtotalAmount: sale.totalAmount, // Asumir que no había descuentos
          discountAmount: 0
        }
      });
    }
    
    console.log('✅ Migración completada exitosamente');
    console.log(`📈 ${sales.length} ventas actualizadas`);
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateDiscountData();
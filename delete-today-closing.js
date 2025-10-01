// Script para eliminar el cierre de caja de prueba
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteTodayClosing() {
  try {
    console.log('🗑️ Eliminando cierre de caja de hoy...');
    
    const today = new Date().toISOString().split('T')[0];
    
    const deleted = await prisma.cashClosing.deleteMany({
      where: {
        date: {
          gte: new Date(today + 'T00:00:00.000Z'),
          lt: new Date(today + 'T23:59:59.999Z')
        }
      }
    });
    
    console.log(`✅ Eliminados ${deleted.count} cierres para hoy`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteTodayClosing();
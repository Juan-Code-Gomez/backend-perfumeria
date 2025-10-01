// Script para verificar cierres de caja existentes
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCashClosings() {
  try {
    console.log('🔍 Verificando cierres de caja existentes...');
    
    // Obtener fecha de hoy
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    console.log('📅 Fecha de hoy:', todayString);
    console.log('🌍 Zona horaria local:', today.toLocaleString());
    
    // Buscar todos los cierres de caja
    const allClosings = await prisma.cashClosing.findMany({
      orderBy: { date: 'desc' },
      take: 10
    });
    
    console.log('📊 Últimos 10 cierres de caja:');
    allClosings.forEach((closing, index) => {
      const dateStr = closing.date.toISOString().split('T')[0];
      console.log(`${index + 1}. ID: ${closing.id}, Fecha: ${dateStr}, Dinero: $${closing.closingCash}`);
    });
    
    // Buscar cierre específico para hoy
    const todayClosing = await prisma.cashClosing.findFirst({
      where: {
        date: {
          gte: new Date(todayString + 'T00:00:00.000Z'),
          lt: new Date(todayString + 'T23:59:59.999Z')
        }
      }
    });
    
    if (todayClosing) {
      console.log('⚠️  ENCONTRADO: Ya existe un cierre para hoy:');
      console.log('   ID:', todayClosing.id);
      console.log('   Fecha:', todayClosing.date.toISOString());
      console.log('   Dinero en caja:', todayClosing.closingCash);
      console.log('   Creado:', todayClosing.createdAt?.toISOString());
    } else {
      console.log('✅ No hay cierres para hoy');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCashClosings();
// Script para eliminar constraints únicos
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeUniqueConstraints() {
  try {
    console.log('🔧 Eliminando constraints únicos...');
    
    // Remover constraint único de date en CashClosing
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "CashClosing" DROP CONSTRAINT IF EXISTS "CashClosing_date_key";
    `);
    console.log('✅ Constraint de CashClosing eliminado');
    
    // Remover constraint único de (date, isActive) en CashSession
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "CashSession" DROP CONSTRAINT IF EXISTS "unique_active_session_per_date";
    `);
    console.log('✅ Constraint de CashSession eliminado');
    
    // Verificar
    const remaining = await prisma.$queryRawUnsafe(`
      SELECT conname, contype 
      FROM pg_constraint 
      WHERE conrelid IN ('CashClosing'::regclass, 'CashSession'::regclass)
      AND contype = 'u';
    `);
    
    console.log('📋 Constraints únicos restantes:', remaining);
    console.log('✅ ¡Proceso completado!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeUniqueConstraints();

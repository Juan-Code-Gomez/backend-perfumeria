// Script definitivo para verificar y eliminar constraints
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixConstraints() {
  try {
    console.log('🔍 PASO 1: Verificando constraints en la base de datos...\n');
    
    // Consulta directa para ver TODOS los constraints de las tablas Cash
    const allConstraints = await prisma.$queryRaw`
      SELECT 
        conname AS constraint_name,
        conrelid::regclass::text AS table_name,
        contype AS constraint_type,
        pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE conrelid::regclass::text IN ('CashClosing', 'CashSession')
      ORDER BY conrelid, conname;
    `;
    
    console.log('📋 Constraints encontrados:');
    console.table(allConstraints);
    console.log('\n');
    
    // Encontrar y eliminar el constraint de date en CashClosing
    const dateConstraint = allConstraints.find(c => 
      String(c.table_name).toLowerCase().includes('cashclosing') && 
      String(c.definition).toLowerCase().includes('date')
    );
    
    if (dateConstraint) {
      console.log(`🗑️  ELIMINANDO: ${dateConstraint.constraint_name} en ${dateConstraint.table_name}`);
      console.log(`   Definición: ${dateConstraint.definition}\n`);
      
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "${String(dateConstraint.table_name).replace('public.', '')}" 
        DROP CONSTRAINT "${dateConstraint.constraint_name}";
      `);
      
      console.log('   ✅ Constraint eliminado exitosamente!\n');
    } else {
      console.log('ℹ️  No se encontró constraint de date en CashClosing\n');
    }
    
    // Verificar constraint de CashSession
    const sessionConstraint = allConstraints.find(c => 
      String(c.table_name).toLowerCase().includes('cashsession') && 
      (String(c.definition).toLowerCase().includes('isactive') || 
       String(c.constraint_name).toLowerCase().includes('unique_active'))
    );
    
    if (sessionConstraint) {
      console.log(`🗑️  ELIMINANDO: ${sessionConstraint.constraint_name} en ${sessionConstraint.table_name}`);
      console.log(`   Definición: ${sessionConstraint.definition}\n`);
      
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "${String(sessionConstraint.table_name).replace('public.', '')}" 
        DROP CONSTRAINT "${sessionConstraint.constraint_name}";
      `);
      
      console.log('   ✅ Constraint eliminado exitosamente!\n');
    } else {
      console.log('ℹ️  No se encontró constraint de sesión única en CashSession\n');
    }
    
    console.log('🔍 PASO 2: Verificación final...\n');
    
    const remainingConstraints = await prisma.$queryRaw`
      SELECT 
        conname AS constraint_name,
        conrelid::regclass::text AS table_name,
        pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE conrelid::regclass::text IN ('CashClosing', 'CashSession')
      AND contype = 'u'
      ORDER BY conrelid, conname;
    `;
    
    console.log('🔒 Constraints únicos restantes:');
    if (remainingConstraints.length === 0) {
      console.log('   ✅ ¡Ninguno! Todos los constraints problemáticos fueron eliminados.\n');
    } else {
      console.table(remainingConstraints);
    }
    
    console.log('\n✅ ¡Proceso completado exitosamente!');
    console.log('💡 Ahora reinicia el backend y prueba crear un cierre de caja.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

fixConstraints();

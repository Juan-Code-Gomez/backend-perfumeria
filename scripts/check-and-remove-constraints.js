// Script para verificar y eliminar constraints únicos
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndRemoveConstraints() {
  try {
    console.log('🔍 Verificando constraints existentes...\n');
    
    // Obtener el nombre real de la tabla
    const tables = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename ILIKE '%cash%';
    `;
    
    console.log('📋 Tablas encontradas:', tables);
    console.log('\n');
    
    // Verificar constraints en todas las tablas relacionadas con cash
    const constraints = await prisma.$queryRaw`
      SELECT 
        tc.table_name, 
        tc.constraint_name, 
        tc.constraint_type,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name ILIKE '%cash%'
        AND tc.constraint_type = 'UNIQUE'
      ORDER BY tc.table_name, tc.constraint_name;
    `;
    
    console.log('🔒 Constraints únicos encontrados:');
    console.table(constraints);
    console.log('\n');
    
    // Eliminar cada constraint encontrado
    for (const constraint of constraints) {
      if (constraint.column_name === 'date' || constraint.constraint_name.includes('date')) {
        console.log(`🗑️  Eliminando: ${constraint.table_name}.${constraint.constraint_name}`);
        
        try {
          await prisma.$executeRawUnsafe(`
            ALTER TABLE "${constraint.table_name}" 
            DROP CONSTRAINT IF EXISTS "${constraint.constraint_name}";
          `);
          console.log(`   ✅ Eliminado exitosamente\n`);
        } catch (err) {
          console.log(`   ⚠️  Error: ${err.message}\n`);
        }
      }
    }
    
    // Verificar que se eliminaron
    console.log('🔍 Verificación final...\n');
    const remaining = await prisma.$queryRaw`
      SELECT 
        tc.table_name, 
        tc.constraint_name, 
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name ILIKE '%cash%'
        AND tc.constraint_type = 'UNIQUE'
        AND kcu.column_name = 'date';
    `;
    
    if (remaining.length === 0) {
      console.log('✅ ¡Todos los constraints de date fueron eliminados exitosamente!');
    } else {
      console.log('⚠️  Aún quedan constraints:');
      console.table(remaining);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndRemoveConstraints();

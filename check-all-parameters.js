// Verificar todos los parámetros en la base de datos
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkParameters() {
  try {
    console.log('📋 Parámetros del sistema:\n');

    const parameters = await prisma.systemParameter.findMany({
      orderBy: { category: 'asc' }
    });

    parameters.forEach(param => {
      console.log(`🔹 ${param.parameterKey}`);
      console.log(`   Valor: ${param.parameterValue}`);
      console.log(`   Categoría: ${param.category}`);
      console.log(`   Activo: ${param.isActive}`);
      console.log(`   Descripción: ${param.description}`);
      console.log('');
    });

    console.log(`✅ Total: ${parameters.length} parámetros encontrados`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkParameters();

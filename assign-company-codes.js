const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function assignCompanyCodes() {
  try {
    console.log('🏢 Asignando códigos de empresa a usuarios existentes...');

    // Obtener todos los usuarios
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        companyCode: true,
      },
    });

    console.log(`📊 Encontrados ${users.length} usuarios`);

    // Asignar código de empresa basado en el email o username
    for (const user of users) {
      if (user.companyCode) {
        console.log(`✅ Usuario ${user.username} ya tiene código: ${user.companyCode}`);
        continue;
      }

      let companyCode = 'MILAN'; // Código por defecto

      // Lógica para asignar código basado en el email/username
      const email = user.username.toLowerCase();
      
      if (email.includes('parfum') || email.includes('perfum')) {
        companyCode = 'PARFUM';
      } else if (email.includes('milan') || email.includes('fragancia')) {
        companyCode = 'MILAN';
      }

      // Actualizar usuario
      await prisma.user.update({
        where: { id: user.id },
        data: { companyCode },
      });

      console.log(`🔄 Usuario ${user.username} (${user.name}) → ${companyCode}`);
    }

    console.log('✅ Códigos de empresa asignados correctamente');

    // Mostrar resumen
    const summary = await prisma.user.groupBy({
      by: ['companyCode'],
      _count: true,
    });

    console.log('\n📈 Resumen por empresa:');
    summary.forEach(item => {
      console.log(`  ${item.companyCode || 'Sin código'}: ${item._count} usuarios`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignCompanyCodes();
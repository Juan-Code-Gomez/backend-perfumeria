const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateAdminUser() {
  try {
    const updatedUser = await prisma.user.update({
      where: { username: 'admin' },
      data: { companyCode: 'DEV' }
    });
    
    console.log('✅ Usuario admin actualizado con companyCode: DEV');
    console.log('Usuario:', updatedUser.username, '- Código:', updatedUser.companyCode);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminUser();
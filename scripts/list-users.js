const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('\n👥 Consultando usuarios existentes...\n');
  
  const users = await prisma.user.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true,
      name: true,
      username: true,
      companyCode: true,
      tenantId: true,
      isActive: true,
    }
  });

  if (users.length === 0) {
    console.log('⚠️  No hay usuarios en la base de datos');
    return;
  }

  console.log('📋 Usuarios encontrados:\n');
  console.table(users);
  
  console.log('\n💡 Tenants disponibles:');
  const tenants = await prisma.companyConfig.findMany({
    select: {
      id: true,
      companyName: true,
      tenantCode: true,
    }
  });
  console.table(tenants);
  
  console.log('\n💡 Para asignar usuarios al tenant de Joyeria Mai (ID: 2):');
  console.log('   node scripts/assign-users-to-tenant.js <tenantId> <userId1> <userId2> ...');
  console.log('   Ejemplo: node scripts/assign-users-to-tenant.js 2 1 2');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

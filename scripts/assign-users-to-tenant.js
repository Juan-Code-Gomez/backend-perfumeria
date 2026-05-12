const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const tenantId = parseInt(process.argv[2]);
  const userIds = process.argv.slice(3).map(id => parseInt(id));

  if (!tenantId || userIds.length === 0) {
    console.log('\n❌ Uso: node assign-users-to-tenant.js <tenantId> <userId1> <userId2> ...');
    console.log('   Ejemplo: node assign-users-to-tenant.js 2 1 2\n');
    process.exit(1);
  }

  console.log(`\n👥 Asignando usuarios al tenant ID: ${tenantId}...\n`);

  // Verificar que el tenant existe
  const tenant = await prisma.companyConfig.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    console.log(`❌ Error: No se encontró tenant con ID ${tenantId}`);
    process.exit(1);
  }

  console.log(`✅ Tenant encontrado: ${tenant.companyName} (${tenant.tenantCode})\n`);

  // Asignar cada usuario
  let assigned = 0;
  for (const userId of userIds) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { tenantId },
        select: {
          id: true,
          name: true,
          username: true,
        }
      });
      console.log(`✅ Usuario asignado: ${user.name} (@${user.username})`);
      assigned++;
    } catch (error) {
      console.log(`❌ Error al asignar usuario ${userId}: ${error.message}`);
    }
  }

  console.log(`\n✨ Se asignaron ${assigned} de ${userIds.length} usuarios al tenant "${tenant.companyName}"\n`);

  // Mostrar resumen
  const users = await prisma.user.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      username: true,
      isActive: true,
    }
  });

  console.log('📋 Usuarios del tenant:\n');
  console.table(users);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

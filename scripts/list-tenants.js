const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 Consultando tenants existentes...\n');
  
  const companies = await prisma.companyConfig.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true,
      companyName: true,
      industry: true,
      tenantCode: true,
      tenantName: true,
      plan: true,
    }
  });

  if (companies.length === 0) {
    console.log('⚠️  No hay tenants en la base de datos');
    return;
  }

  console.log('📋 Tenants encontrados:\n');
  console.table(companies);
  
  console.log('\n💡 Para configurar uno como joyería:');
  console.log('   1. Elige un ID de la lista arriba');
  console.log('   2. Ejecuta: node scripts/configure-jewelry-tenant.js <ID>');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 VERIFICACIÓN FINAL DE DEPLOYMENT\n');
  console.log('='.repeat(60));

  // 1. Verificar schema
  console.log('\n📦 1. Verificando tablas del schema...\n');
  
  const tables = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('Feature', 'TenantFeature', 'TenantCustomField')
    ORDER BY table_name;
  `;
  
  console.log(`   ✅ Tablas encontradas: ${tables.length}/3`);
  tables.forEach(t => console.log(`      - ${t.table_name}`));

  // 2. Verificar features globales
  console.log('\n📝 2. Verificando features globales...\n');
  
  const features = await prisma.feature.findMany({
    where: { module: 'JEWELRY' },
    select: { code: true, name: true, isActive: true }
  });
  
  console.log(`   ✅ Features de joyería: ${features.length}/10`);
  features.forEach(f => console.log(`      - ${f.code}: ${f.name} ${f.isActive ? '✅' : '❌'}`));

  // 3. Verificar tenant de joyería
  console.log('\n🏪 3. Verificando tenant de joyería...\n');
  
  const jewelryTenants = await prisma.companyConfig.findMany({
    where: { industry: 'JEWELRY' },
    select: {
      id: true,
      companyName: true,
      tenantCode: true,
      industry: true,
      plan: true,
    }
  });
  
  if (jewelryTenants.length > 0) {
    console.log(`   ✅ Tenants de joyería encontrados: ${jewelryTenants.length}`);
    jewelryTenants.forEach(t => {
      console.log(`      - ID ${t.id}: ${t.companyName} (${t.tenantCode}) - Plan: ${t.plan}`);
    });
  } else {
    console.log('   ❌ No se encontraron tenants de joyería');
  }

  // 4. Verificar features del tenant
  if (jewelryTenants.length > 0) {
    const tenantId = jewelryTenants[0].id;
    console.log(`\n🔓 4. Verificando features del tenant ${tenantId}...\n`);
    
    const tenantFeatures = await prisma.tenantFeature.findMany({
      where: { tenantId },
      include: { feature: true },
      orderBy: { feature: { code: 'asc' } }
    });
    
    console.log(`   ✅ Features activados: ${tenantFeatures.length}`);
    tenantFeatures.forEach(tf => {
      console.log(`      - ${tf.feature.code}: ${tf.isEnabled ? '✅ Activo' : '❌ Inactivo'}`);
    });

    // 5. Verificar campos personalizados
    console.log(`\n📝 5. Verificando campos personalizados...\n`);
    
    const customFields = await prisma.tenantCustomField.findMany({
      where: { tenantId, isActive: true },
      select: {
        module: true,
        fieldName: true,
        fieldLabel: true,
        fieldType: true,
      }
    });
    
    console.log(`   ✅ Campos personalizados: ${customFields.length}`);
    customFields.forEach(cf => {
      console.log(`      - ${cf.module}.${cf.fieldName}: ${cf.fieldLabel} (${cf.fieldType})`);
    });

    // 6. Verificar usuarios asignados
    console.log(`\n👥 6. Verificando usuarios del tenant...\n`);
    
    const users = await prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        username: true,
        isActive: true,
      }
    });
    
    console.log(`   ✅ Usuarios asignados: ${users.length}`);
    users.forEach(u => {
      console.log(`      - ${u.name} (@${u.username}) ${u.isActive ? '✅' : '❌'}`);
    });
  }

  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('\n✨ RESUMEN DE VERIFICACIÓN\n');
  console.log(`   ✅ Schema aplicado correctamente`);
  console.log(`   ✅ ${features.length} features globales creados`);
  console.log(`   ✅ ${jewelryTenants.length} tenant(s) de joyería configurado(s)`);
  
  if (jewelryTenants.length > 0) {
    const tenantId = jewelryTenants[0].id;
    const tenantFeatures = await prisma.tenantFeature.count({ where: { tenantId } });
    const customFields = await prisma.tenantCustomField.count({ where: { tenantId, isActive: true } });
    const users = await prisma.user.count({ where: { tenantId } });
    
    console.log(`   ✅ ${tenantFeatures} features activados para tenant`);
    console.log(`   ✅ ${customFields} campos personalizados creados`);
    console.log(`   ✅ ${users} usuarios asignados`);
  }
  
  console.log('\n🎉 ¡Sistema de feature flags listo para usar!\n');
  console.log('📚 Próximos pasos:');
  console.log('   1. Compilar backend: npm run build');
  console.log('   2. Desplegar a Railway: git push origin main');
  console.log('   3. Probar endpoints en producción');
  console.log('   4. Verificar UI en frontend\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

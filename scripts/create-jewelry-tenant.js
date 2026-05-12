const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const jewelryName = process.argv[2] || 'Joyeria Mai';
  
  console.log(`\n🏪 Creando nuevo tenant para: ${jewelryName}\n`);

  // Crear nuevo CompanyConfig para la joyería
  const newTenant = await prisma.companyConfig.create({
    data: {
      companyName: jewelryName,
      industry: 'JEWELRY',
      tenantCode: 'JEWELRY_MAI_001',
      tenantName: jewelryName,
      plan: 'PREMIUM',
      nit: '', // Puedes actualizar después
      address: '',
      phone: '',
      email: '',
      currency: 'COP',
      invoicePrefix: 'JOY',
      taxRate: 19.0,
      timezone: 'America/Bogota',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: 'es-CO',
      useFifoInventory: true,
    }
  });

  console.log('✅ Tenant creado:');
  console.log(`   ID: ${newTenant.id}`);
  console.log(`   Nombre: ${newTenant.companyName}`);
  console.log(`   Código: ${newTenant.tenantCode}`);
  console.log(`   Industria: ${newTenant.industry}`);
  console.log(`   Plan: ${newTenant.plan}\n`);

  console.log('🔓 Activando features de joyería para este tenant...\n');

  // Obtener todos los features de joyería
  const jewelryFeatures = await prisma.feature.findMany({
    where: {
      module: 'JEWELRY',
      isActive: true,
    }
  });

  console.log(`📦 Se encontraron ${jewelryFeatures.length} features de joyería`);

  // Activar cada feature para el tenant
  for (const feature of jewelryFeatures) {
    await prisma.tenantFeature.create({
      data: {
        tenantId: newTenant.id,
        featureCode: feature.code,
        isEnabled: true,
        configuration: {},
      }
    });
    console.log(`  ✅ ${feature.name} (${feature.code})`);
  }

  console.log('\n📝 Creando campos personalizados...\n');

  // Crear campos personalizados para productos
  const customFields = [
    {
      module: 'PRODUCTS',
      fieldName: 'goldKarat',
      fieldLabel: 'Quilates de Oro',
      fieldType: 'select',
      fieldOptions: JSON.stringify(['10K', '14K', '18K', '22K', '24K']),
      isRequired: false,
      displayOrder: 1,
    },
    {
      module: 'PRODUCTS',
      fieldName: 'weightGrams',
      fieldLabel: 'Peso (gramos)',
      fieldType: 'number',
      isRequired: false,
      displayOrder: 2,
    },
    {
      module: 'PRODUCTS',
      fieldName: 'diamondCarats',
      fieldLabel: 'Quilates de Diamante',
      fieldType: 'number',
      isRequired: false,
      displayOrder: 3,
    },
    {
      module: 'PRODUCTS',
      fieldName: 'diamondClarity',
      fieldLabel: 'Claridad del Diamante',
      fieldType: 'select',
      fieldOptions: JSON.stringify(['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2']),
      isRequired: false,
      displayOrder: 4,
    },
    {
      module: 'PRODUCTS',
      fieldName: 'diamondColor',
      fieldLabel: 'Color del Diamante',
      fieldType: 'select',
      fieldOptions: JSON.stringify(['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M']),
      isRequired: false,
      displayOrder: 5,
    },
    {
      module: 'PRODUCTS',
      fieldName: 'certificateNumber',
      fieldLabel: 'Número de Certificado',
      fieldType: 'text',
      isRequired: false,
      displayOrder: 6,
    },
    {
      module: 'PRODUCTS',
      fieldName: 'certificateUrl',
      fieldLabel: 'URL del Certificado',
      fieldType: 'text',
      isRequired: false,
      displayOrder: 7,
    },
  ];

  for (const field of customFields) {
    await prisma.tenantCustomField.create({
      data: {
        tenantId: newTenant.id,
        ...field,
      }
    });
    console.log(`  ✅ ${field.fieldLabel} (${field.fieldName})`);
  }

  console.log('\n✨ ¡Tenant de joyería configurado exitosamente!\n');
  console.log('📋 Resumen:');
  console.log(`   - Tenant ID: ${newTenant.id}`);
  console.log(`   - Features activados: ${jewelryFeatures.length}`);
  console.log(`   - Campos personalizados: ${customFields.length}`);
  console.log('\n💡 Próximo paso: Asignar usuarios al tenant');
  console.log(`   UPDATE "User" SET tenant_id = ${newTenant.id} WHERE company_id = ${newTenant.id};`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

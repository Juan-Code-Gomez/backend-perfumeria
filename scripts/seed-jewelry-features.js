// scripts/seed-jewelry-features.js
/**
 * Script para crear los features iniciales del sistema de joyería
 * Ejecutar: node scripts/seed-jewelry-features.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando seed de features de joyería...\n');

  // ============================================
  // 1. CREAR FEATURES GLOBALES
  // ============================================
  
  const features = [
    {
      code: 'JEWELRY_MODULE',
      name: 'Módulo de Joyería',
      description: 'Funcionalidades específicas para tiendas de joyería',
      module: 'JEWELRY',
      featureType: 'MODULE',
      isActive: true,
    },
    {
      code: 'JEWELRY_REPAIRS',
      name: 'Reparaciones de Joyería',
      description: 'Sistema de órdenes de reparación y mantenimiento',
      module: 'JEWELRY',
      featureType: 'MODULE',
      isActive: true,
    },
    {
      code: 'GOLD_WEIGHT_TRACKING',
      name: 'Control de Peso en Oro',
      description: 'Seguimiento de peso en gramos/quilates para productos de oro',
      module: 'JEWELRY',
      featureType: 'FIELD',
      isActive: true,
    },
    {
      code: 'DIAMOND_SPECS',
      name: 'Especificaciones de Diamantes',
      description: 'Campos para quilates, claridad, color y corte de diamantes',
      module: 'JEWELRY',
      featureType: 'FIELD',
      isActive: true,
    },
    {
      code: 'JEWELRY_CUSTOM_ORDERS',
      name: 'Pedidos Personalizados',
      description: 'Sistema de diseños y pedidos a medida',
      module: 'JEWELRY',
      featureType: 'MODULE',
      isActive: true,
    },
    {
      code: 'CONSIGNMENT_SALES',
      name: 'Ventas por Consignación',
      description: 'Gestión de productos en consignación',
      module: 'SALES',
      featureType: 'MODULE',
      isActive: true,
    },
    {
      code: 'METAL_PRICE_TRACKING',
      name: 'Seguimiento de Precio de Metales',
      description: 'Actualización automática de precios según cotización de metales',
      module: 'PRICING',
      featureType: 'INTEGRATION',
      isActive: true,
    },
    {
      code: 'CERTIFICATE_MANAGEMENT',
      name: 'Gestión de Certificados',
      description: 'Adjuntar y gestionar certificados de autenticidad',
      module: 'JEWELRY',
      featureType: 'FIELD',
      isActive: true,
    },
    {
      code: 'JEWELRY_APPRAISAL',
      name: 'Valuación de Joyas',
      description: 'Sistema de avalúos y valuaciones',
      module: 'JEWELRY',
      featureType: 'MODULE',
      isActive: true,
    },
    {
      code: 'WHATSAPP_INTEGRATION',
      name: 'Integración con WhatsApp',
      description: 'Sistema de mensajería automática y seguimiento',
      module: 'INTEGRATION',
      featureType: 'INTEGRATION',
      isActive: true,
    },
    {
      code: 'STRICT_STOCK_VALIDATION',
      name: 'Validación Estricta de Stock',
      description: 'Bloquea ventas cuando no hay stock disponible',
      module: 'SALES',
      featureType: 'VALIDATION',
      isActive: true,
    },
  ];

  console.log('📦 Creando features globales...');
  
  for (const feature of features) {
    try {
      const created = await prisma.feature.upsert({
        where: { code: feature.code },
        update: feature,
        create: feature,
      });
      console.log(`  ✅ ${created.name} (${created.code})`);
    } catch (error) {
      console.log(`  ❌ Error creando ${feature.code}:`, error.message);
    }
  }

  console.log(`\n✨ Se crearon ${features.length} features globales\n`);

  // ============================================
  // 2. BUSCAR TENANT DE JOYERÍA
  // ============================================
  
  console.log('🔍 Buscando tenant de joyería...');
  
  let jewelryTenant = await prisma.companyConfig.findFirst({
    where: {
      industry: 'JEWELRY',
    },
  });

  if (!jewelryTenant) {
    console.log('⚠️  No se encontró tenant de joyería.');
    console.log('💡 Puedes crear uno manualmente o actualizar un tenant existente con:');
    console.log('   UPDATE "CompanyConfig" SET industry = \'JEWELRY\', tenant_code = \'JEWELRY_001\' WHERE id = 1;');
    console.log('\n✅ Seed completado (solo features globales)');
    return;
  }

  console.log(`  ✅ Encontrado: ${jewelryTenant.tenantName || jewelryTenant.companyName} (ID: ${jewelryTenant.id})\n`);

  // ============================================
  // 3. ACTIVAR FEATURES PARA JOYERÍA
  // ============================================
  
  const jewelryFeaturesToEnable = [
    'JEWELRY_MODULE',
    'JEWELRY_REPAIRS',
    'GOLD_WEIGHT_TRACKING',
    'DIAMOND_SPECS',
    'JEWELRY_CUSTOM_ORDERS',
    'CERTIFICATE_MANAGEMENT',
    'JEWELRY_APPRAISAL',
    'STRICT_STOCK_VALIDATION',
  ];

  console.log('🔓 Activando features para joyería...');

  for (const featureCode of jewelryFeaturesToEnable) {
    try {
      await prisma.tenantFeature.upsert({
        where: {
          tenantId_featureCode: {
            tenantId: jewelryTenant.id,
            featureCode,
          },
        },
        update: { isEnabled: true },
        create: {
          tenantId: jewelryTenant.id,
          featureCode,
          isEnabled: true,
        },
      });
      console.log(`  ✅ ${featureCode}`);
    } catch (error) {
      console.log(`  ❌ Error activando ${featureCode}:`, error.message);
    }
  }

  // ============================================
  // 4. CREAR CAMPOS PERSONALIZADOS
  // ============================================
  
  console.log('\n📝 Creando campos personalizados para productos de joyería...');

  const customFields = [
    {
      tenantId: jewelryTenant.id,
      module: 'PRODUCTS',
      fieldName: 'goldKarat',
      fieldLabel: 'Quilates de Oro',
      fieldType: 'select',
      fieldOptions: {
        options: [
          { value: '10k', label: '10K' },
          { value: '14k', label: '14K' },
          { value: '18k', label: '18K' },
          { value: '22k', label: '22K' },
          { value: '24k', label: '24K' },
        ],
      },
      isRequired: false,
      order: 1,
    },
    {
      tenantId: jewelryTenant.id,
      module: 'PRODUCTS',
      fieldName: 'weightGrams',
      fieldLabel: 'Peso (gramos)',
      fieldType: 'number',
      fieldOptions: {
        min: 0,
        step: 0.01,
        precision: 2,
      },
      isRequired: false,
      order: 2,
    },
    {
      tenantId: jewelryTenant.id,
      module: 'PRODUCTS',
      fieldName: 'diamondCarats',
      fieldLabel: 'Quilates de Diamante',
      fieldType: 'number',
      fieldOptions: {
        min: 0,
        step: 0.01,
        precision: 2,
      },
      isRequired: false,
      order: 3,
    },
    {
      tenantId: jewelryTenant.id,
      module: 'PRODUCTS',
      fieldName: 'diamondClarity',
      fieldLabel: 'Claridad del Diamante',
      fieldType: 'select',
      fieldOptions: {
        options: [
          { value: 'FL', label: 'FL - Flawless' },
          { value: 'IF', label: 'IF - Internally Flawless' },
          { value: 'VVS1', label: 'VVS1' },
          { value: 'VVS2', label: 'VVS2' },
          { value: 'VS1', label: 'VS1' },
          { value: 'VS2', label: 'VS2' },
          { value: 'SI1', label: 'SI1' },
          { value: 'SI2', label: 'SI2' },
        ],
      },
      isRequired: false,
      order: 4,
    },
    {
      tenantId: jewelryTenant.id,
      module: 'PRODUCTS',
      fieldName: 'diamondColor',
      fieldLabel: 'Color del Diamante',
      fieldType: 'select',
      fieldOptions: {
        options: [
          { value: 'D', label: 'D - Incoloro' },
          { value: 'E', label: 'E - Incoloro' },
          { value: 'F', label: 'F - Incoloro' },
          { value: 'G', label: 'G - Casi Incoloro' },
          { value: 'H', label: 'H - Casi Incoloro' },
          { value: 'I', label: 'I - Casi Incoloro' },
          { value: 'J', label: 'J - Casi Incoloro' },
        ],
      },
      isRequired: false,
      order: 5,
    },
    {
      tenantId: jewelryTenant.id,
      module: 'PRODUCTS',
      fieldName: 'certificateNumber',
      fieldLabel: 'Número de Certificado',
      fieldType: 'text',
      isRequired: false,
      order: 6,
    },
    {
      tenantId: jewelryTenant.id,
      module: 'PRODUCTS',
      fieldName: 'certificateUrl',
      fieldLabel: 'URL del Certificado',
      fieldType: 'text',
      validation: {
        pattern: 'url',
      },
      isRequired: false,
      order: 7,
    },
  ];

  for (const field of customFields) {
    try {
      const created = await prisma.tenantCustomField.create({
        data: field,
      });
      console.log(`  ✅ ${created.fieldLabel} (${created.fieldName})`);
    } catch (error) {
      console.log(`  ❌ Error creando ${field.fieldName}:`, error.message);
    }
  }

  console.log('\n✅ ¡Seed completado exitosamente!\n');
  
  // ============================================
  // 5. RESUMEN
  // ============================================
  
  console.log('📊 RESUMEN:');
  console.log(`  - Features globales: ${features.length}`);
  console.log(`  - Features activados para joyería: ${jewelryFeaturesToEnable.length}`);
  console.log(`  - Campos personalizados: ${customFields.length}`);
  console.log(`  - Tenant ID: ${jewelryTenant.id}`);
  console.log('\n🎉 El sistema está listo para usar features de joyería!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

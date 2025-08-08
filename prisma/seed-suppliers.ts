import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSuppliers() {
  console.log('🏢 Creando proveedores...');

  const suppliers = [
    // ESPECIALISTAS EN ESENCIAS
    {
      name: 'Fragancias Milano SAS',
      nit: '900123456-7',
      phone: '+57 1 234-5678',
      email: 'ventas@fraganciamilano.com',
      address: 'Carrera 15 #93-47, Bogotá',
      contactPerson: 'María González',
      website: 'www.fraganciamilano.com',
      paymentTerms: '30_DIAS',
      creditLimit: 5000000,
      supplierType: 'ESENCIAS',
      specializedCategories: ['Esencias', 'Fijador', 'Alcohol'],
      isActive: true,
      isPreferred: true,
      minOrderAmount: 500000,
      leadTimeDays: 7,
      rating: 4.8,
      notes: 'Proveedor principal de esencias. Excelente calidad y variedad.',
    },
    {
      name: 'Aromas del Mundo Ltda',
      nit: '800234567-8',
      phone: '+57 1 345-6789',
      email: 'pedidos@aromasdelmundo.co',
      address: 'Calle 72 #12-34, Bogotá',
      contactPerson: 'Carlos Rodríguez',
      paymentTerms: '45_DIAS',
      creditLimit: 3000000,
      supplierType: 'ESENCIAS',
      specializedCategories: ['Esencias', 'Perfumes Orientales', 'Perfumes Amaderados'],
      isActive: true,
      isPreferred: false,
      minOrderAmount: 300000,
      leadTimeDays: 10,
      rating: 4.2,
      notes: 'Especialistas en esencias orientales y amaderadas.',
    },

    // ESPECIALISTAS EN FRASCOS Y ENVASES
    {
      name: 'Envases Premium Colombia',
      nit: '900345678-9',
      phone: '+57 1 456-7890',
      email: 'comercial@envasespremium.com',
      address: 'Zona Industrial Puente Aranda, Bogotá',
      contactPerson: 'Ana Martínez',
      website: 'www.envasespremium.com',
      paymentTerms: 'CONTADO',
      creditLimit: 2000000,
      supplierType: 'FRASCOS',
      specializedCategories: ['Frascos', 'Estuches', 'Combos'],
      isActive: true,
      isPreferred: true,
      minOrderAmount: 200000,
      leadTimeDays: 5,
      rating: 4.6,
      notes: 'Mejor proveedor de frascos. Entregas rápidas y calidad garantizada.',
    },
    {
      name: 'Cristales y Diseños SA',
      nit: '800456789-0',
      phone: '+57 1 567-8901',
      email: 'ventas@cristalesydisenos.com',
      address: 'Carrera 30 #45-67, Bogotá',
      contactPerson: 'Jorge Silva',
      paymentTerms: '15_DIAS',
      creditLimit: 1500000,
      supplierType: 'FRASCOS',
      specializedCategories: ['Frascos', 'Duos', 'Estuches'],
      isActive: true,
      isPreferred: false,
      minOrderAmount: 150000,
      leadTimeDays: 8,
      rating: 4.0,
      notes: 'Frascos de cristal de alta calidad. Diseños exclusivos.',
    },

    // ESPECIALISTAS EN PERFUMES ORIGINALES
    {
      name: 'Importadora Global Fragancias',
      nit: '900567890-1',
      phone: '+57 1 678-9012',
      email: 'importaciones@globalfragancias.com',
      address: 'Zona Franca Bogotá, Edificio A-12',
      contactPerson: 'Patricia Vargas',
      website: 'www.globalfragancias.com',
      paymentTerms: '60_DIAS',
      creditLimit: 10000000,
      supplierType: 'ORIGINALES',
      specializedCategories: ['Perfumes Originales', 'Perfumes 1.1', 'Perfumes Masculinos', 'Perfumes Femeninos'],
      isActive: true,
      isPreferred: true,
      minOrderAmount: 1000000,
      leadTimeDays: 15,
      rating: 4.9,
      notes: 'Importador oficial de marcas reconocidas. Garantía de autenticidad.',
    },
    {
      name: 'Fragancias Internacionales SAS',
      nit: '800678901-2',
      phone: '+57 1 789-0123',
      email: 'ventas@fraganciasint.co',
      address: 'Carrera 11 #85-32, Bogotá',
      contactPerson: 'Ricardo Torres',
      paymentTerms: '30_DIAS',
      creditLimit: 6000000,
      supplierType: 'ORIGINALES',
      specializedCategories: ['Perfumes Originales', 'Perfumes Unisex', 'Perfumes de Noche'],
      isActive: true,
      isPreferred: false,
      minOrderAmount: 800000,
      leadTimeDays: 12,
      rating: 4.3,
      notes: 'Amplio catálogo de perfumes importados. Buenos precios.',
    },

    // ESPECIALISTAS EN LOCIONES Y CREMAS
    {
      name: 'Cosméticos Naturales Ltda',
      nit: '900789012-3',
      phone: '+57 1 890-1234',
      email: 'pedidos@cosmeticosnaturales.com',
      address: 'Calle 26 #68-45, Bogotá',
      contactPerson: 'Isabella Ramírez',
      paymentTerms: '30_DIAS',
      creditLimit: 2500000,
      supplierType: 'LOCIONES',
      specializedCategories: ['Cremas', 'Splahs', 'Aerosoles'],
      isActive: true,
      isPreferred: false,
      minOrderAmount: 250000,
      leadTimeDays: 6,
      rating: 4.1,
      notes: 'Especialistas en productos cosméticos y lociones corporales.',
    },

    // PROVEEDOR MIXTO
    {
      name: 'Distribuidora Perfumería Total',
      nit: '800890123-4',
      phone: '+57 1 901-2345',
      email: 'comercial@perfumeriatotal.com',
      address: 'Autopista Norte #123-45, Bogotá',
      contactPerson: 'Fernando López',
      website: 'www.perfumeriatotal.com',
      paymentTerms: '45_DIAS',
      creditLimit: 8000000,
      supplierType: 'MIXTO',
      specializedCategories: ['Perfumes 1.1', 'Esencias', 'Frascos', 'Cremas', 'Feromonas'],
      isActive: true,
      isPreferred: true,
      minOrderAmount: 600000,
      leadTimeDays: 10,
      rating: 4.5,
      notes: 'Proveedor integral. Maneja todas las líneas de productos. Muy confiable.',
    },

    // PROVEEDOR LOCAL PEQUEÑO
    {
      name: 'Esencias La Sabana',
      nit: '12345678-9',
      phone: '+57 1 234-5678',
      email: 'info@esenciasasabana.com',
      address: 'Calle 80 #15-23, Bogotá',
      contactPerson: 'Luis Herrera',
      paymentTerms: 'CONTADO',
      creditLimit: 500000,
      supplierType: 'ESENCIAS',
      specializedCategories: ['Esencias', 'Alcohol', 'Fijador'],
      isActive: true,
      isPreferred: false,
      minOrderAmount: 100000,
      leadTimeDays: 3,
      rating: 3.8,
      notes: 'Proveedor local pequeño. Buenos precios pero stock limitado.',
    },
  ];

  let createdCount = 0;
  let existingCount = 0;

  for (const supplierData of suppliers) {
    try {
      const existingSupplier = await prisma.supplier.findUnique({
        where: { nit: supplierData.nit },
      });

      if (existingSupplier) {
        console.log(`⚠️ Proveedor "${supplierData.name}" ya existe, omitiendo...`);
        existingCount++;
        continue;
      }

      await prisma.supplier.create({
        data: supplierData,
      });

      console.log(`✅ Creado proveedor: ${supplierData.name} (${supplierData.supplierType}) - ${supplierData.paymentTerms}`);
      createdCount++;
    } catch (error) {
      console.error(`❌ Error creando proveedor ${supplierData.name}:`, error.message);
    }
  }

  console.log(`\n📊 Resumen de proveedores:`);
  console.log(`✅ Creados: ${createdCount}`);
  console.log(`⚠️ Ya existían: ${existingCount}`);
  console.log(`📦 Total procesados: ${suppliers.length}`);

  const totalSuppliers = await prisma.supplier.count();
  console.log(`🎯 Total de proveedores en base de datos: ${totalSuppliers}`);

  console.log(`\n📈 Tipos de proveedores creados:`);
  console.log(`  🏷️ ESENCIAS: Fragancias Milano, Aromas del Mundo, Esencias La Sabana`);
  console.log(`  🏷️ FRASCOS: Envases Premium, Cristales y Diseños`);
  console.log(`  🏷️ ORIGINALES: Importadora Global, Fragancias Internacionales`);
  console.log(`  🏷️ LOCIONES: Cosméticos Naturales`);
  console.log(`  🏷️ MIXTO: Distribuidora Perfumería Total`);
}

export default seedSuppliers;

// Si el archivo se ejecuta directamente
if (require.main === module) {
  seedSuppliers()
    .catch((e) => {
      console.error('❌ Error en seed de proveedores:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

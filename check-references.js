const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkReferences() {
  console.log('\n🔍 Verificando referencias del payload...\n');
  
  // Verificar supplier ID 1
  const supplier = await prisma.supplier.findUnique({
    where: { id: 1 }
  });
  
  if (supplier) {
    console.log('✅ Supplier ID 1 existe:');
    console.log(`   Nombre: ${supplier.name}`);
    console.log(`   NIT: ${supplier.nit || 'N/A'}`);
    console.log(`   Activo: ${supplier.isActive ? 'Sí' : 'No'}`);
  } else {
    console.log('❌ Supplier ID 1 NO existe en la base de datos');
    console.log('   → Este es probablemente el error!');
  }
  
  console.log('');
  
  // Verificar product ID 31
  const product = await prisma.product.findUnique({
    where: { id: 31 }
  });
  
  if (product) {
    console.log('✅ Product ID 31 existe:');
    console.log(`   Nombre: ${product.name}`);
    console.log(`   SKU: ${product.sku || 'N/A'}`);
    console.log(`   Activo: ${product.isActive ? 'Sí' : 'No'}`);
  } else {
    console.log('❌ Product ID 31 NO existe en la base de datos');
    console.log('   → Este es probablemente el error!');
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Listar suppliers disponibles
  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    take: 10
  });
  
  console.log('\n📋 Primeros 10 Suppliers disponibles:\n');
  if (suppliers.length > 0) {
    suppliers.forEach(s => {
      console.log(`   ID: ${s.id} → ${s.name}`);
    });
  } else {
    console.log('   ⚠️  No hay suppliers en la base de datos');
  }
  
  // Listar products disponibles
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    take: 10
  });
  
  console.log('\n📦 Primeros 10 Products disponibles:\n');
  if (products.length > 0) {
    products.forEach(p => {
      console.log(`   ID: ${p.id} → ${p.name}`);
    });
  } else {
    console.log('   ⚠️  No hay productos en la base de datos');
  }
  
  console.log('\n');
  
  await prisma.$disconnect();
}

checkReferences().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});

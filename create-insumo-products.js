// Script para crear los productos insumo: Alcohol y Fijador
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createInsumoProducts() {
  try {
    console.log('🚀 Creando productos insumo: Alcohol y Fijador...');

    // Buscar categoría de insumos o crearla
    let insumoCategory = await prisma.category.findFirst({
      where: { name: 'Insumos' }
    });

    if (!insumoCategory) {
      insumoCategory = await prisma.category.create({
        data: {
          name: 'Insumos',
          description: 'Materias primas para preparación de productos'
        }
      });
      console.log('✅ Categoría "Insumos" creada');
    }

    // Buscar unidades de medida o crearlas
    let unitMl = await prisma.unit.findFirst({
      where: { name: 'Mililitro' }
    });

    if (!unitMl) {
      unitMl = await prisma.unit.create({
        data: {
          name: 'Mililitro',
          symbol: 'ml',
          description: 'Unidad de volumen'
        }
      });
      console.log('✅ Unidad "Mililitro" creada');
    }

    let unitGramo = await prisma.unit.findFirst({
      where: { name: 'Gramo' }
    });

    if (!unitGramo) {
      unitGramo = await prisma.unit.create({
        data: {
          name: 'Gramo',
          symbol: 'g',
          description: 'Unidad de peso'
        }
      });
      console.log('✅ Unidad "Gramo" creada');
    }

    // Definir los insumos
    const insumos = [
      {
        name: 'Alcohol',
        sku: 'INSUMO-ALCOHOL',
        description: 'Alcohol para preparación de perfumes - $7 por ml',
        salePrice: 7, // $7 por mililitro
        purchasePrice: 5, // Costo estimado
        salesType: 'INSUMO',
        categoryId: insumoCategory.id,
        unitId: unitMl.id,
        stock: 10000, // 10 litros iniciales
        minStock: 1000, // Mínimo 1 litro
      },
      {
        name: 'Fijador',
        sku: 'INSUMO-FIJADOR',
        description: 'Fijador para preparación de perfumes - $80 por gramo',
        salePrice: 80, // $80 por gramo
        purchasePrice: 60, // Costo estimado
        salesType: 'INSUMO',
        categoryId: insumoCategory.id,
        unitId: unitGramo.id,
        stock: 5000, // 5 kg iniciales
        minStock: 500, // Mínimo 500g
      }
    ];

    // Crear los productos insumo
    for (const insumo of insumos) {
      const existingProduct = await prisma.product.findFirst({
        where: { sku: insumo.sku }
      });

      if (existingProduct) {
        console.log(`⚠️  Producto ${insumo.sku} ya existe, saltando...`);
        continue;
      }

      const product = await prisma.product.create({
        data: insumo
      });

      console.log(`✅ Creado: ${product.name} - $${product.salePrice}/${insumo.unitId === unitMl.id ? 'ml' : 'g'}`);
    }

    console.log('\n🎉 ¡Productos insumo creados exitosamente!');
    console.log('\n📋 Resumen de insumos:');
    console.log('• Alcohol: $7/ml - Stock inicial: 10,000ml');
    console.log('• Fijador: $80/g - Stock inicial: 5,000g');
    console.log('\n💡 Estos productos se descontarán automáticamente cuando se vendan los combos');

  } catch (error) {
    console.error('❌ Error creando productos insumo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createInsumoProducts();

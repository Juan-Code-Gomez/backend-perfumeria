// Script para crear los productos combo Alcohol + Fijador
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createComboProducts() {
  try {
    console.log('🚀 Creando productos combo Alcohol + Fijador...');

    // Buscar categoría de combos o crearla
    let comboCategory = await prisma.category.findFirst({
      where: { name: 'Combos' }
    });

    if (!comboCategory) {
      comboCategory = await prisma.category.create({
        data: {
          name: 'Combos',
          description: 'Productos combinados para preparación de perfumes'
        }
      });
      console.log('✅ Categoría "Combos" creada');
    }

    // Buscar unidad de medida o crearla
    let unitKit = await prisma.unit.findFirst({
      where: { name: 'Kit' }
    });

    if (!unitKit) {
      unitKit = await prisma.unit.create({
        data: {
          name: 'Kit',
          symbol: 'kit',
          description: 'Kit de productos combo'
        }
      });
      console.log('✅ Unidad "Kit" creada');
    }

    // Definir los combos
    const combos = [
      {
        name: 'Combo Alcohol + Fijador 1oz',
        sku: 'COMBO-AF-1OZ',
        description: 'Kit para perfume de 1 onza: 15ml alcohol + 2g fijador',
        salePrice: 265, // 15ml * $7 + 2g * $80 = $105 + $160 = $265
        purchasePrice: 200, // Costo estimado
        salesType: 'COMBO',
        categoryId: comboCategory.id,
        unitId: unitKit.id,
        stock: 100,
        minStock: 10,
        // Metadatos de la receta
        alcoholMl: 15,
        fijadorGramos: 2
      },
      {
        name: 'Combo Alcohol + Fijador 2oz',
        sku: 'COMBO-AF-2OZ', 
        description: 'Kit para perfume de 2 onzas: 25ml alcohol + 3g fijador',
        salePrice: 415, // 25ml * $7 + 3g * $80 = $175 + $240 = $415
        purchasePrice: 320, // Costo estimado
        salesType: 'COMBO',
        categoryId: comboCategory.id,
        unitId: unitKit.id,
        stock: 100,
        minStock: 10,
        alcoholMl: 25,
        fijadorGramos: 3
      },
      {
        name: 'Combo Alcohol + Fijador 3oz',
        sku: 'COMBO-AF-3OZ',
        description: 'Kit para perfume de 3 onzas: 50ml alcohol + 5g fijador', 
        salePrice: 750, // 50ml * $7 + 5g * $80 = $350 + $400 = $750
        purchasePrice: 600, // Costo estimado
        salesType: 'COMBO',
        categoryId: comboCategory.id,
        unitId: unitKit.id,
        stock: 100,
        minStock: 10,
        alcoholMl: 50,
        fijadorGramos: 5
      }
    ];

    // Crear los productos combo
    for (const combo of combos) {
      const existingProduct = await prisma.product.findFirst({
        where: { sku: combo.sku }
      });

      if (existingProduct) {
        console.log(`⚠️  Producto ${combo.sku} ya existe, saltando...`);
        continue;
      }

      const { alcoholMl, fijadorGramos, ...productData } = combo;
      
      const product = await prisma.product.create({
        data: {
          ...productData,
          // Guardamos la receta en el campo notes como JSON
          notes: JSON.stringify({
            receta: {
              alcohol: { cantidad: alcoholMl, unidad: 'ml' },
              fijador: { cantidad: fijadorGramos, unidad: 'g' }
            }
          })
        }
      });

      console.log(`✅ Creado: ${product.name} - $${product.salePrice}`);
    }

    console.log('\n🎉 ¡Productos combo creados exitosamente!');
    console.log('\n📋 Resumen de combos:');
    console.log('• 1oz: 15ml alcohol + 2g fijador = $265');
    console.log('• 2oz: 25ml alcohol + 3g fijador = $415'); 
    console.log('• 3oz: 50ml alcohol + 5g fijador = $750');

  } catch (error) {
    console.error('❌ Error creando productos combo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createComboProducts();

// Script para demostrar la carga masiva de productos
// Simula la carga desde una factura de proveedor

const baseUrl = 'http://localhost:3000/api';

// Datos de ejemplo que podrían venir de una factura de proveedor
const productosFacturaProveedor = [
  // ESENCIAS
  {
    name: 'Esencia Black XS',
    description: 'Esencia concentrada inspirada en Black XS',
    sku: 'ESN-BXS-30',
    fragranceName: 'Black XS',
    categoryId: 1, // Esencias
    unitId: 1,     // Mililitros o gramos
    productType: 'SIMPLE',
    variantType: 'ESENCIA',
    size: '30ml',
    sizeValue: 30,
    brand: 'Paco Rabanne Inspired',
    gender: 'MASCULINO',
    stock: 100,
    minStock: 20,
    purchasePrice: 7500,
    salePrice: 14000,
    suggestedPrice: 16000,
    supplierId: 1,
    requiresPreparation: true,
    tags: ['esencia', 'masculino', 'black xs', 'intenso'],
    notes: 'Esencia para preparar con alcohol 70% y fijador'
  },
  {
    name: 'Esencia La Vie Est Belle',
    description: 'Esencia femenina dulce y floral',
    sku: 'ESN-LVEB-30',
    fragranceName: 'La Vie Est Belle',
    categoryId: 1,
    unitId: 1,
    productType: 'SIMPLE',
    variantType: 'ESENCIA',
    size: '30ml',
    sizeValue: 30,
    brand: 'Lancôme Inspired',
    gender: 'FEMENINO',
    stock: 80,
    minStock: 15,
    purchasePrice: 8000,
    salePrice: 15000,
    suggestedPrice: 18000,
    supplierId: 1,
    requiresPreparation: true,
    tags: ['esencia', 'femenino', 'floral', 'dulce'],
    notes: 'Esencia floral para preparación'
  },
  {
    name: 'Esencia Sauvage',
    description: 'Esencia fresca y especiada',
    sku: 'ESN-SAU-30',
    fragranceName: 'Sauvage',
    categoryId: 1,
    unitId: 1,
    productType: 'SIMPLE',
    variantType: 'ESENCIA',
    size: '30ml',
    sizeValue: 30,
    brand: 'Dior Inspired',
    gender: 'MASCULINO',
    stock: 120,
    minStock: 25,
    purchasePrice: 9000,
    salePrice: 16000,
    suggestedPrice: 19000,
    supplierId: 1,
    requiresPreparation: true,
    tags: ['esencia', 'masculino', 'fresco', 'especiado'],
    notes: 'Una de las esencias más vendidas'
  },

  // FRASCOS
  {
    name: 'Frasco Atomizador 30ml Dorado',
    description: 'Frasco con atomizador para perfumes de 30ml',
    sku: 'FRS-30-DOR',
    categoryId: 2, // Frascos
    unitId: 2,     // Unidades
    productType: 'SIMPLE',
    variantType: 'FRASCO',
    size: '30ml',
    sizeValue: 30,
    stock: 200,
    minStock: 50,
    purchasePrice: 2500,
    salePrice: 4500,
    suggestedPrice: 5000,
    supplierId: 2, // Proveedor de envases
    tags: ['frasco', 'atomizador', '30ml', 'dorado'],
    notes: 'Frasco premium con acabado dorado'
  },
  {
    name: 'Frasco Atomizador 50ml Plateado',
    description: 'Frasco con atomizador para perfumes de 50ml',
    sku: 'FRS-50-PLA',
    categoryId: 2,
    unitId: 2,
    productType: 'SIMPLE',
    variantType: 'FRASCO',
    size: '50ml',
    sizeValue: 50,
    stock: 150,
    minStock: 30,
    purchasePrice: 3000,
    salePrice: 5500,
    suggestedPrice: 6000,
    supplierId: 2,
    tags: ['frasco', 'atomizador', '50ml', 'plateado'],
    notes: 'Frasco elegante plateado'
  },

  // SPLASH
  {
    name: 'Splash Carolina Herrera Good Girl',
    description: 'Splash corporal inspirado en Good Girl',
    sku: 'SPL-GG-250',
    fragranceName: 'Good Girl',
    categoryId: 3, // Splashs
    unitId: 1,     // Mililitros
    productType: 'SIMPLE',
    variantType: 'SPLASH',
    size: '250ml',
    sizeValue: 250,
    brand: 'Carolina Herrera Inspired',
    gender: 'FEMENINO',
    stock: 60,
    minStock: 12,
    purchasePrice: 12000,
    salePrice: 22000,
    suggestedPrice: 25000,
    supplierId: 3,
    tags: ['splash', 'femenino', 'good girl', 'corporal'],
    notes: 'Splash corporal de larga duración'
  },
  {
    name: 'Splash Escarchado Polo Blue',
    description: 'Splash escarchado inspirado en Polo Blue',
    sku: 'SPL-PB-ESC-250',
    fragranceName: 'Polo Blue',
    categoryId: 3,
    unitId: 1,
    productType: 'SIMPLE',
    variantType: 'SPLASH_ESCARCHADO',
    size: '250ml',
    sizeValue: 250,
    brand: 'Ralph Lauren Inspired',
    gender: 'MASCULINO',
    stock: 45,
    minStock: 10,
    purchasePrice: 14000,
    salePrice: 26000,
    suggestedPrice: 30000,
    supplierId: 3,
    tags: ['splash', 'escarchado', 'masculino', 'polo blue'],
    notes: 'Splash con partículas escarchadas brillantes'
  },

  // CREMAS
  {
    name: 'Crema Hidratante Coco Chanel',
    description: 'Crema corporal hidratante inspirada en Coco Chanel',
    sku: 'CRM-CCH-200',
    fragranceName: 'Coco Chanel',
    categoryId: 4, // Cremas
    unitId: 3,     // Gramos
    productType: 'SIMPLE',
    variantType: 'CREMA',
    size: '200g',
    sizeValue: 200,
    brand: 'Chanel Inspired',
    gender: 'FEMENINO',
    stock: 30,
    minStock: 8,
    purchasePrice: 18000,
    salePrice: 32000,
    suggestedPrice: 35000,
    supplierId: 4,
    tags: ['crema', 'hidratante', 'femenino', 'coco chanel'],
    notes: 'Crema nutritiva de absorción rápida'
  },

  // PERFUMES 1.1 (productos armados)
  {
    name: 'Perfume 1.1 Invictus 100ml',
    description: 'Perfume armado similar a Invictus original',
    sku: 'PRF-INV-100',
    fragranceName: 'Invictus',
    categoryId: 5, // Perfumes 1.1
    unitId: 1,
    productType: 'COMPOSITE', // Es compuesto porque se arma
    variantType: 'PERFUME_11',
    size: '100ml',
    sizeValue: 100,
    brand: 'Paco Rabanne Inspired',
    gender: 'MASCULINO',
    stock: 25,
    minStock: 5,
    purchasePrice: 28000,
    salePrice: 55000,
    suggestedPrice: 65000,
    isComposite: true,
    requiresPreparation: true,
    supplierId: 1,
    tags: ['perfume', '1.1', 'masculino', 'invictus', 'armado'],
    notes: 'Perfume armado con esencia + alcohol + fijador en frasco de 100ml'
  }
];

// Función helper para hacer requests
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer YOUR_JWT_TOKEN', // Comentado para prueba
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ Error en ${url}:`, error.message);
    return null;
  }
}

async function testBulkProductCreation() {
  console.log('📦 PRUEBA DE CARGA MASIVA DE PRODUCTOS - FACTURA PROVEEDOR');
  console.log('=' .repeat(70));
  console.log('🏪 Simulando carga desde factura de proveedor de perfumería');
  console.log(`📋 Total de productos a cargar: ${productosFacturaProveedor.length}`);
  console.log('');

  // Carga masiva usando el endpoint bulk
  console.log('⬆️ Iniciando carga masiva...');
  const bulkResult = await makeRequest(`${baseUrl}/products/bulk`, {
    method: 'POST',
    body: JSON.stringify({
      products: productosFacturaProveedor
    })
  });

  if (bulkResult && bulkResult.data) {
    console.log('✅ RESULTADO DE CARGA MASIVA:');
    console.log(`   ✅ Productos creados: ${bulkResult.data.created}`);
    console.log(`   ⚠️ Productos omitidos: ${bulkResult.data.skipped}`);
    console.log(`   ❌ Errores: ${bulkResult.data.errors.length}`);
    
    if (bulkResult.data.errors.length > 0) {
      console.log('\n❌ ERRORES ENCONTRADOS:');
      bulkResult.data.errors.forEach(error => {
        console.log(`   - Producto ${error.index + 1} (${error.product}): ${error.error}`);
      });
    }
  }

  // Verificar algunos productos creados
  console.log('\n🔍 Verificando productos creados...');
  
  // Buscar esencias
  const esencias = await makeRequest(`${baseUrl}/products?variantType=ESENCIA&limit=10`);
  if (esencias) {
    console.log(`\n🌸 ESENCIAS CREADAS: ${esencias.data.length} encontradas`);
    esencias.data.forEach(product => {
      console.log(`   - ${product.name} (${product.fragranceName})`);
      console.log(`     Stock: ${product.stock}, Precio: $${product.salePrice}`);
    });
  }

  // Buscar frascos
  const frascos = await makeRequest(`${baseUrl}/products?variantType=FRASCO&limit=10`);
  if (frascos) {
    console.log(`\n🍯 FRASCOS CREADOS: ${frascos.data.length} encontrados`);
    frascos.data.forEach(product => {
      console.log(`   - ${product.name} (${product.size})`);
      console.log(`     Stock: ${product.stock}, Precio: $${product.salePrice}`);
    });
  }

  // Buscar splashs
  const splashs = await makeRequest(`${baseUrl}/products?variantType=SPLASH&limit=10`);
  if (splashs) {
    console.log(`\n💦 SPLASHS CREADOS: ${splashs.data.length} encontrados`);
    splashs.data.forEach(product => {
      console.log(`   - ${product.name} (${product.fragranceName})`);
      console.log(`     Tipo: ${product.variantType}, Stock: ${product.stock}`);
    });
  }

  // Probar búsqueda por fragancia
  console.log('\n🔍 Probando búsqueda por fragancia "Black XS"...');
  const blackXSProducts = await makeRequest(`${baseUrl}/products/fragrance/Black XS`);
  if (blackXSProducts) {
    console.log(`✅ Productos de Black XS: ${blackXSProducts.data.length}`);
    blackXSProducts.data.forEach(product => {
      console.log(`   - ${product.name} (${product.variantType})`);
    });
  }

  // Estadísticas finales
  console.log('\n📊 ESTADÍSTICAS FINALES...');
  const finalStats = await makeRequest(`${baseUrl}/products/statistics`);
  if (finalStats) {
    console.log('✅ Estadísticas actualizadas:');
    console.log(`   📦 Total productos: ${finalStats.data.totalProducts}`);
    console.log(`   ⚠️ Stock bajo: ${finalStats.data.lowStockProducts}`);
    console.log(`   ❌ Sin stock: ${finalStats.data.outOfStockProducts}`);
    console.log(`   📈 Total unidades: ${finalStats.data.totalStockUnits}`);
  }

  console.log('\n🎉 CARGA MASIVA COMPLETADA');
  console.log('=' .repeat(70));
  console.log('✅ Sistema listo para operación de perfumería');
  console.log('📝 Productos cargados desde factura de proveedor');
  console.log('🔄 Se pueden crear variantes y productos compuestos');
  console.log('📊 Estadísticas y reportes disponibles');
}

// Ejecutar la prueba
testBulkProductCreation().catch(console.error);

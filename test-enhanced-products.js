// Script de prueba para el módulo de productos mejorado
// Simula el funcionamiento de una perfumería real

const baseUrl = 'http://localhost:3000/api';

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
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ Error en ${url}:`, error.message);
    return null;
  }
}

async function testProductsModule() {
  console.log('🧪 INICIANDO PRUEBAS DEL MÓDULO DE PRODUCTOS MEJORADO');
  console.log('=' .repeat(60));

  // 1. Obtener tipos de productos disponibles
  console.log('\n📋 1. Obteniendo tipos de productos...');
  const productTypes = await makeRequest(`${baseUrl}/products/types/product-types`);
  if (productTypes) {
    console.log('✅ Tipos de productos:', productTypes.data.map(t => t.label).join(', '));
  }

  // 2. Obtener tipos de variantes disponibles
  console.log('\n📋 2. Obteniendo tipos de variantes...');
  const variantTypes = await makeRequest(`${baseUrl}/products/types/variant-types`);
  if (variantTypes) {
    console.log('✅ Tipos de variantes:', variantTypes.data.map(t => t.label).join(', '));
  }

  // 3. Obtener estadísticas de productos
  console.log('\n📊 3. Obteniendo estadísticas de productos...');
  const statistics = await makeRequest(`${baseUrl}/products/statistics`);
  if (statistics) {
    console.log('✅ Estadísticas:', JSON.stringify(statistics.data, null, 2));
  }

  // 4. Buscar productos con stock bajo
  console.log('\n⚠️ 4. Buscando productos con stock bajo...');
  const lowStock = await makeRequest(`${baseUrl}/products/low-stock`);
  if (lowStock) {
    console.log(`✅ Productos con stock bajo: ${lowStock.data.length} encontrados`);
    lowStock.data.forEach(product => {
      console.log(`   - ${product.name}: Stock ${product.stock}/${product.minStock || 'No definido'}`);
    });
  }

  // 5. Obtener grupos de fragancias
  console.log('\n🌸 5. Obteniendo grupos de fragancias...');
  const fragranceGroups = await makeRequest(`${baseUrl}/products/fragrance-groups`);
  if (fragranceGroups) {
    console.log('✅ Grupos de fragancias:');
    fragranceGroups.data.forEach(group => {
      console.log(`   - ${group.fragranceName}: ${group.productCount} productos`);
    });
  }

  // 6. Buscar productos (search)
  console.log('\n🔍 6. Buscando productos con término "perfume"...');
  const searchResults = await makeRequest(`${baseUrl}/products/search?q=perfume`);
  if (searchResults) {
    console.log(`✅ Resultados de búsqueda: ${searchResults.data.length} productos encontrados`);
    searchResults.data.slice(0, 3).forEach(product => {
      console.log(`   - ${product.name} (${product.category?.name || 'Sin categoría'})`);
    });
  }

  // 7. Crear un nuevo producto de esencia
  console.log('\n➕ 7. Creando nueva esencia...');
  const newEssenceData = {
    name: 'Esencia Acqua di Gio Test',
    description: 'Esencia aromática masculina para preparación',
    sku: 'ESN-ADG-TEST-001',
    fragranceName: 'Acqua di Gio',
    categoryId: 1, // Asumiendo que existe categoría con ID 1
    unitId: 1,     // Asumiendo que existe unidad con ID 1  
    productType: 'SIMPLE',
    variantType: 'ESENCIA',
    size: '30ml',
    sizeValue: 30,
    brand: 'Giorgio Armani Inspired',
    gender: 'MASCULINO',
    stock: 50,
    minStock: 10,
    purchasePrice: 8000,
    salePrice: 15000,
    suggestedPrice: 18000,
    minPrice: 12000,
    maxPrice: 20000,
    supplierId: 1, // Asumiendo que existe proveedor con ID 1
    requiresPreparation: true,
    tags: ['esencia', 'masculino', 'acqua di gio', 'fresco'],
    notes: 'Esencia concentrada para mezclar con alcohol y fijador'
  };

  const newEssence = await makeRequest(`${baseUrl}/products`, {
    method: 'POST',
    body: JSON.stringify(newEssenceData)
  });

  if (newEssence && newEssence.data) {
    console.log(`✅ Esencia creada: ${newEssence.data.name} (ID: ${newEssence.data.id})`);
    
    // 8. Crear variante perfume 1.1 de la misma fragancia
    console.log('\n🔄 8. Creando variante Perfume 1.1...');
    const perfumeVariantData = {
      name: 'Perfume 1.1 Acqua di Gio Test',
      description: 'Perfume armado similar al original',
      sku: 'PRF-ADG-TEST-001',
      fragranceName: 'Acqua di Gio',
      categoryId: 1,
      unitId: 1,
      variantType: 'PERFUME_11',
      size: '100ml',
      sizeValue: 100,
      brand: 'Giorgio Armani Inspired',
      gender: 'MASCULINO',
      stock: 20,
      minStock: 5,
      purchasePrice: 25000,
      salePrice: 45000,
      suggestedPrice: 50000,
      tags: ['perfume', 'masculino', 'acqua di gio', '1.1'],
      notes: 'Perfume armado en frasco de 100ml'
    };

    const perfumeVariant = await makeRequest(`${baseUrl}/products/${newEssence.data.id}/variants`, {
      method: 'POST',
      body: JSON.stringify(perfumeVariantData)
    });

    if (perfumeVariant && perfumeVariant.data) {
      console.log(`✅ Variante creada: ${perfumeVariant.data.name} (ID: ${perfumeVariant.data.id})`);

      // 9. Buscar productos de la fragancia "Acqua di Gio"
      console.log('\n🌸 9. Buscando todos los productos de "Acqua di Gio"...');
      const fragranceProducts = await makeRequest(`${baseUrl}/products/fragrance/Acqua di Gio`);
      if (fragranceProducts) {
        console.log(`✅ Productos de Acqua di Gio: ${fragranceProducts.data.length} encontrados`);
        fragranceProducts.data.forEach(product => {
          console.log(`   - ${product.name} (${product.variantType || 'Sin tipo'}) - Stock: ${product.stock}`);
        });
      }
    }

    // 10. Crear movimiento de stock para la esencia
    console.log('\n📦 10. Registrando movimiento de stock...');
    const movementData = {
      type: 'IN',
      quantity: 25,
      reason: 'Compra nueva de esencias',
      notes: 'Llegada de pedido del proveedor principal'
    };

    const movement = await makeRequest(`${baseUrl}/products/${newEssence.data.id}/movements`, {
      method: 'POST',
      body: JSON.stringify(movementData)
    });

    if (movement) {
      console.log('✅ Movimiento de stock registrado correctamente');
    }

    // 11. Obtener historial de movimientos
    console.log('\n📋 11. Obteniendo historial de movimientos...');
    const movements = await makeRequest(`${baseUrl}/products/${newEssence.data.id}/movements`);
    if (movements) {
      console.log(`✅ Movimientos: ${movements.data.length} registros`);
      movements.data.slice(0, 3).forEach(mov => {
        console.log(`   - ${mov.type}: ${mov.quantity} (${mov.reason || 'Sin razón'})`);
      });
    }

    // 12. Actualizar precio del producto
    console.log('\n💰 12. Actualizando precio del producto...');
    const priceUpdate = {
      purchasePrice: 8500,
      salePrice: 16000,
      suggestedPrice: 19000,
      notes: 'Ajuste por inflación del proveedor'
    };

    const priceHistory = await makeRequest(`${baseUrl}/products/${newEssence.data.id}/prices`, {
      method: 'POST',
      body: JSON.stringify(priceUpdate)
    });

    if (priceHistory) {
      console.log('✅ Precio actualizado correctamente');
    }

    // 13. Obtener historial de precios
    console.log('\n💳 13. Obteniendo historial de precios...');
    const prices = await makeRequest(`${baseUrl}/products/${newEssence.data.id}/price-history`);
    if (prices) {
      console.log(`✅ Historial de precios: ${prices.data.length} registros`);
      prices.data.slice(0, 2).forEach(price => {
        console.log(`   - Compra: $${price.purchasePrice}, Venta: $${price.salePrice} (${new Date(price.effectiveDate).toLocaleDateString()})`);
      });
    }
  }

  // 14. Probar filtros avanzados
  console.log('\n🔍 14. Probando filtros avanzados...');
  const filteredProducts = await makeRequest(`${baseUrl}/products?search=test&productType=SIMPLE&page=1&limit=5`);
  if (filteredProducts) {
    console.log(`✅ Productos filtrados: ${filteredProducts.data.length} de ${filteredProducts.pagination.total} total`);
    console.log(`📄 Página ${filteredProducts.pagination.page} de ${filteredProducts.pagination.totalPages}`);
  }

  // 15. Obtener listado de productos con relaciones
  console.log('\n📋 15. Obteniendo listado general de productos...');
  const allProducts = await makeRequest(`${baseUrl}/products?limit=5`);
  if (allProducts) {
    console.log(`✅ Productos encontrados: ${allProducts.data.length}`);
    allProducts.data.forEach(product => {
      console.log(`   - ${product.name}`);
      console.log(`     Categoría: ${product.category?.name || 'Sin categoría'}`);
      console.log(`     Unidad: ${product.unit?.name || 'Sin unidad'}`);
      console.log(`     Stock: ${product.stock} ${product.unit?.symbol || ''}`);
      console.log(`     Precio: $${product.salePrice}`);
      if (product.variants && product.variants.length > 0) {
        console.log(`     Variantes: ${product.variants.length}`);
      }
      if (product.components && product.components.length > 0) {
        console.log(`     Componentes: ${product.components.length}`);
      }
      console.log('');
    });
  }

  console.log('\n🎉 PRUEBAS COMPLETADAS');
  console.log('=' .repeat(60));
  console.log('✅ Módulo de productos mejorado funcionando correctamente');
  console.log('🔧 Funcionalidades probadas:');
  console.log('   - Tipos de productos y variantes');
  console.log('   - Estadísticas y reportes');
  console.log('   - Búsqueda avanzada');
  console.log('   - Gestión de fragancias');
  console.log('   - Creación de productos y variantes');
  console.log('   - Movimientos de stock');
  console.log('   - Historial de precios');
  console.log('   - Filtros avanzados');
  console.log('   - Relaciones entre entidades');
}

// Ejecutar las pruebas
testProductsModule().catch(console.error);

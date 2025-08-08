// Script para cargar productos manualmente y probar estadísticas
// Usaremos el endpoint básico que ya funciona

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Datos realistas de inventario de perfumería
const inventoryProducts = [
  // ESENCIAS MÁS VENDIDAS
  {
    name: 'Esencia Chanel No 5',
    description: 'Esencia concentrada femenina clásica',
    categoryId: 1,
    unitId: 1,
    stock: 12,        // 12 unidades
    minStock: 5,
    purchasePrice: 8500,     // $8,500 precio compra
    salePrice: 18000,        // $18,000 precio venta
    supplierId: 1,
    imageUrl: null
  },
  {
    name: 'Esencia Acqua di Gio',
    description: 'Esencia masculina fresca acuática',
    categoryId: 1,
    unitId: 1,
    stock: 8,
    minStock: 5,
    purchasePrice: 9000,
    salePrice: 19000,
    supplierId: 1,
    imageUrl: null
  },
  {
    name: 'Esencia Black XS',
    description: 'Esencia masculina intensa y seductora',
    categoryId: 1,
    unitId: 1,
    stock: 15,
    minStock: 5,
    purchasePrice: 7800,
    salePrice: 17000,
    supplierId: 1,
    imageUrl: null
  },
  {
    name: 'Esencia Sauvage',
    description: 'Esencia masculina fresca y especiada',
    categoryId: 1,
    unitId: 1,
    stock: 6,        // Stock justo
    minStock: 5,
    purchasePrice: 9500,
    salePrice: 20000,
    supplierId: 1,
    imageUrl: null
  },
  {
    name: 'Esencia La Vie Est Belle',
    description: 'Esencia femenina dulce y floral',
    categoryId: 1,
    unitId: 1,
    stock: 3,        // STOCK BAJO
    minStock: 5,
    purchasePrice: 8800,
    salePrice: 19500,
    supplierId: 1,
    imageUrl: null
  },

  // PERFUMES 1.1 (usando categoría 2 si existe)
  {
    name: 'Perfume 1.1 Chanel No 5 100ml',
    description: 'Perfume armado similar al original',
    categoryId: 2,
    unitId: 2,
    stock: 4,
    minStock: 2,
    purchasePrice: 15000,    // Costo de preparación
    salePrice: 35000,        // Precio venta final
    supplierId: 1,
    imageUrl: null
  },
  {
    name: 'Perfume 1.1 Acqua di Gio 100ml',
    description: 'Perfume armado masculino',
    categoryId: 2,
    unitId: 2,
    stock: 2,
    minStock: 2,
    purchasePrice: 16000,
    salePrice: 38000,
    supplierId: 1,
    imageUrl: null
  },

  // FRASCOS (usando categoría 3 si existe)
  {
    name: 'Frasco Atomizador 30ml Dorado',
    description: 'Frasco con atomizador premium',
    categoryId: 3,
    unitId: 2,
    stock: 25,       // Buen stock
    minStock: 10,
    purchasePrice: 2500,
    salePrice: 6000,
    supplierId: 2,
    imageUrl: null
  },
  {
    name: 'Frasco Atomizador 100ml Plateado',
    description: 'Frasco elegante para perfumes',
    categoryId: 3,
    unitId: 2,
    stock: 18,
    minStock: 10,
    purchasePrice: 3500,
    salePrice: 8000,
    supplierId: 2,
    imageUrl: null
  },

  // SPLASHS (si no existe categoría 4, usar categoría 1)
  {
    name: 'Splash Good Girl 250ml',
    description: 'Splash corporal femenino',
    categoryId: 1,   // Fallback a esencias
    unitId: 2,
    stock: 7,
    minStock: 3,
    purchasePrice: 12000,
    salePrice: 25000,
    supplierId: 3,
    imageUrl: null
  },

  // INSUMOS
  {
    name: 'Alcohol Etílico 70% - 1L',
    description: 'Alcohol para diluir esencias',
    categoryId: 1,
    unitId: 1,
    stock: 3,        // Pocos litros
    minStock: 2,
    purchasePrice: 5000,
    salePrice: 12000,
    supplierId: 1,
    imageUrl: null
  }
];

async function getAuthToken() {
  try {
    console.log('🔐 Intentando autenticación...');
    
    // Intentar login con credenciales por defecto
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('✅ Login exitoso');
    return loginResponse.data.access_token;
  } catch (error) {
    console.log('⚠️ No se pudo autenticar con credenciales por defecto');
    console.log('💡 Necesitarás crear un usuario primero o ajustar las credenciales');
    throw error;
  }
}

async function createProduct(product, token) {
  try {
    const response = await axios.post(`${BASE_URL}/products`, product, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`❌ Error creando producto ${product.name}:`, 
      error.response?.data?.message || error.message);
    return null;
  }
}

async function getProductStatistics(token) {
  try {
    console.log('📊 Obteniendo estadísticas básicas...');
    
    const response = await axios.get(`${BASE_URL}/products/statistics`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', 
      error.response?.data?.message || error.message);
    return null;
  }
}

async function getProducts(token) {
  try {
    const response = await axios.get(`${BASE_URL}/products`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Error obteniendo productos:', 
      error.response?.data?.message || error.message);
    return null;
  }
}

async function calculateInventoryValue(products) {
  let totalInvestment = 0;
  let totalSaleValue = 0;
  let totalUnits = 0;
  let lowStockProducts = [];

  console.log('');
  console.log('💰 CALCULANDO VALOR DEL INVENTARIO...');
  console.log('');

  products.forEach(product => {
    const investment = product.stock * product.purchasePrice;
    const saleValue = product.stock * product.salePrice;
    
    totalInvestment += investment;
    totalSaleValue += saleValue;
    totalUnits += product.stock;

    // Detectar stock bajo
    if (product.minStock && product.stock <= product.minStock) {
      lowStockProducts.push({
        name: product.name,
        stock: product.stock,
        minStock: product.minStock
      });
    }

    console.log(`📦 ${product.name}:`);
    console.log(`   Stock: ${product.stock} unidades`);
    console.log(`   Inversión: $${investment.toLocaleString()}`);
    console.log(`   Valor venta: $${saleValue.toLocaleString()}`);
    console.log(`   Ganancia: $${(saleValue - investment).toLocaleString()}`);
    console.log('');
  });

  const potentialProfit = totalSaleValue - totalInvestment;
  const profitMargin = totalInvestment > 0 ? (potentialProfit / totalInvestment * 100) : 0;

  console.log('📊 RESUMEN FINANCIERO:');
  console.log('');
  console.log(`💰 INVERSIÓN TOTAL: $${totalInvestment.toLocaleString()}`);
  console.log(`💵 VALOR DE VENTA: $${totalSaleValue.toLocaleString()}`);
  console.log(`📈 GANANCIA ESTIMADA: $${potentialProfit.toLocaleString()}`);
  console.log(`📊 MARGEN DE GANANCIA: ${profitMargin.toFixed(1)}%`);
  console.log(`📦 TOTAL UNIDADES: ${totalUnits}`);
  console.log(`🏷️ PRODUCTOS DIFERENTES: ${products.length}`);

  if (lowStockProducts.length > 0) {
    console.log('');
    console.log('🚨 PRODUCTOS CON STOCK BAJO:');
    lowStockProducts.forEach(p => {
      console.log(`   ⚠️ ${p.name}: ${p.stock} unidades (mín: ${p.minStock})`);
    });
  }

  return {
    totalInvestment,
    totalSaleValue,
    potentialProfit,
    profitMargin,
    totalUnits,
    totalProducts: products.length,
    lowStockProducts
  };
}

async function main() {
  try {
    console.log('🚀 INICIANDO PRUEBA DE INVENTARIO DE PERFUMERÍA');
    console.log('');

    // Autenticación
    let token;
    try {
      token = await getAuthToken();
      console.log('✅ Autenticación exitosa');
    } catch (error) {
      console.log('⚠️ Saltando autenticación - probando sin token');
      token = null;
    }

    console.log('');
    console.log('📝 CARGANDO PRODUCTOS DE INVENTARIO...');
    console.log('');

    let createdCount = 0;
    let errorCount = 0;

    // Crear productos uno por uno
    for (let i = 0; i < inventoryProducts.length; i++) {
      const product = inventoryProducts[i];
      console.log(`Creando ${i + 1}/${inventoryProducts.length}: ${product.name}...`);
      
      const result = await createProduct(product, token);
      if (result) {
        console.log(`✅ Producto creado: ${product.name}`);
        createdCount++;
      } else {
        errorCount++;
      }
      
      // Pequeña pausa entre requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('');
    console.log(`📊 RESULTADOS DE CARGA:`);
    console.log(`✅ Productos creados: ${createdCount}`);
    console.log(`❌ Errores: ${errorCount}`);

    // Obtener productos para calcular estadísticas
    console.log('');
    console.log('📋 OBTENIENDO PRODUCTOS CARGADOS...');
    
    const productsResponse = await getProducts(token);
    if (productsResponse && productsResponse.data) {
      const products = productsResponse.data;
      console.log(`✅ Se obtuvieron ${products.length} productos`);
      
      // Calcular estadísticas financieras manualmente
      await calculateInventoryValue(products);
      
      // Intentar obtener estadísticas del sistema
      const stats = await getProductStatistics(token);
      if (stats) {
        console.log('');
        console.log('📊 ESTADÍSTICAS DEL SISTEMA:');
        console.log(JSON.stringify(stats.data, null, 2));
      }
    }

    console.log('');
    console.log('🎯 PRÓXIMOS PASOS:');
    console.log('   1. Los productos han sido cargados en la base de datos');
    console.log('   2. Puedes usar el Excel creado para cargas masivas futuras');
    console.log('   3. Las estadísticas financieras te ayudan a controlar tu inversión');
    console.log('   4. Revisa productos con stock bajo para reabastecimiento');
    console.log('');
    console.log('💡 ENDPOINTS ÚTILES:');
    console.log('   GET /api/products - Ver todos los productos');
    console.log('   GET /api/products/statistics - Estadísticas básicas');
    console.log('   POST /api/products/upload-excel - Carga masiva desde Excel');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Asegúrate de que el servidor esté corriendo: npm run start:dev');
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, inventoryProducts, calculateInventoryValue };

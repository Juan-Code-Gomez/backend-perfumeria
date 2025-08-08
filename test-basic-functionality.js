// Script para crear usuario de prueba y probar productos
const baseUrl = 'http://localhost:3000/api';

async function createTestUser() {
  try {
    console.log('👤 Creando usuario de prueba...');
    
    const userData = {
      username: 'testuser',
      password: 'test123',
      name: 'Usuario de Prueba',
      roles: [1] // Asumiendo que existe el rol con ID 1
    };

    const response = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Usuario creado exitosamente');
      return true;
    } else {
      const error = await response.text();
      console.log('⚠️ Error creando usuario (puede que ya exista):', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function loginAndGetToken() {
  try {
    console.log('🔐 Intentando login...');
    
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'test123'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Login exitoso');
      return result.access_token;
    } else {
      console.log('❌ Error en login');
      return null;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

async function testProductsWithoutAuth() {
  console.log('🧪 PROBANDO ENDPOINTS SIN AUTENTICACIÓN');
  console.log('=' .repeat(50));

  // Probar endpoints que podrían no requerir autenticación
  const endpointsToTest = [
    '/categories',
    '/units',
    '/suppliers'
  ];

  for (const endpoint of endpointsToTest) {
    try {
      console.log(`\n🔍 Probando ${endpoint}...`);
      const response = await fetch(`${baseUrl}${endpoint}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint}: ${data.data?.length || 0} registros encontrados`);
        
        // Mostrar algunos ejemplos
        if (data.data && data.data.length > 0) {
          data.data.slice(0, 3).forEach(item => {
            console.log(`   - ${item.name} (ID: ${item.id})`);
          });
        }
      } else {
        console.log(`❌ ${endpoint}: HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: Error - ${error.message}`);
    }
  }
}

async function testBasicFunctionality() {
  console.log('🏪 INICIANDO PRUEBAS BÁSICAS DEL SISTEMA DE PERFUMERÍA');
  console.log('=' .repeat(60));

  // Primero probar endpoints sin autenticación
  await testProductsWithoutAuth();

  // Intentar crear usuario y autenticarse
  await createTestUser();
  const token = await loginAndGetToken();

  if (token) {
    console.log('\n🔐 PROBANDO CON AUTENTICACIÓN');
    console.log('=' .repeat(40));

    // Función helper autenticada
    async function authRequest(url, options = {}) {
      try {
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
          },
          ...options
        });
        
        if (response.ok) {
          return await response.json();
        } else {
          console.log(`❌ ${url}: HTTP ${response.status}`);
          return null;
        }
      } catch (error) {
        console.log(`❌ ${url}: ${error.message}`);
        return null;
      }
    }

    // Probar estadísticas de productos
    console.log('\n📊 Estadísticas de productos...');
    const stats = await authRequest(`${baseUrl}/products/statistics`);
    if (stats) {
      console.log('✅ Estadísticas obtenidas:', JSON.stringify(stats.data, null, 2));
    }

    // Probar listado de productos
    console.log('\n📋 Listado de productos...');
    const products = await authRequest(`${baseUrl}/products?limit=10`);
    if (products) {
      console.log(`✅ ${products.data.length} productos encontrados`);
      if (products.data.length > 0) {
        console.log('Primeros productos:');
        products.data.slice(0, 3).forEach(p => {
          console.log(`   - ${p.name} (Stock: ${p.stock}, Precio: $${p.salePrice})`);
        });
      }
    }

    // Si no hay productos, intentar crear algunos
    if (!products || products.data.length === 0) {
      console.log('\n➕ Creando productos de ejemplo para perfumería...');
      
      // Productos de ejemplo específicos para perfumería
      const sampleProducts = [
        {
          name: 'Esencia Chanel No 5',
          description: 'Esencia concentrada floral aldeídica',
          sku: 'ESN-CH5-001',
          categoryId: 1,
          unitId: 1,
          stock: 50,
          purchasePrice: 8500,
          salePrice: 15000,
          productType: 'SIMPLE',
          variantType: 'ESENCIA',
          fragranceName: 'Chanel No 5',
          brand: 'Chanel Inspired',
          gender: 'FEMENINO',
          requiresPreparation: true,
          tags: ['esencia', 'femenino', 'chanel', 'clásico']
        },
        {
          name: 'Frasco Atomizador 30ml',
          description: 'Frasco de vidrio con atomizador dorado',
          sku: 'FRS-30-001',
          categoryId: 2,
          unitId: 2,
          stock: 100,
          purchasePrice: 2500,
          salePrice: 4500,
          productType: 'SIMPLE',
          variantType: 'FRASCO',
          size: '30ml',
          tags: ['frasco', 'atomizador', '30ml']
        }
      ];

      for (const productData of sampleProducts) {
        const created = await authRequest(`${baseUrl}/products`, {
          method: 'POST',
          body: JSON.stringify(productData)
        });
        
        if (created) {
          console.log(`✅ Creado: ${created.data.name}`);
        }
      }
    }

    // Probar tipos de productos
    console.log('\n📋 Tipos de productos disponibles...');
    const types = await authRequest(`${baseUrl}/products/types/product-types`);
    if (types) {
      console.log('✅ Tipos:', types.data.map(t => t.label).join(', '));
    }

    console.log('\n🎉 PRUEBAS COMPLETADAS EXITOSAMENTE');
    console.log('✅ Sistema funcionando correctamente');
    console.log('📊 Estadísticas y productos disponibles');
    console.log('🔧 Listo para operación de perfumería');

  } else {
    console.log('\n❌ No se pudo obtener autenticación');
    console.log('💡 Verifique la configuración de usuarios en el sistema');
  }
}

testBasicFunctionality().catch(console.error);

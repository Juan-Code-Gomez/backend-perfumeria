// Script para obtener token JWT y probar productos
const baseUrl = 'http://localhost:3000/api';

async function getAuthToken() {
  try {
    // Intentar login con credenciales de prueba
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin', // Usuario por defecto del sistema
        password: 'admin123' // Contraseña por defecto
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      return loginData.access_token;
    } else {
      console.log('❌ No se pudo obtener token con credenciales por defecto');
      return null;
    }
  } catch (error) {
    console.error('❌ Error obteniendo token:', error.message);
    return null;
  }
}

async function testWithAuth() {
  console.log('🔐 Obteniendo token de autenticación...');
  const token = await getAuthToken();
  
  if (!token) {
    console.log('❌ No se pudo obtener token. Probando endpoints sin autenticación...');
    return;
  }
  
  console.log('✅ Token obtenido correctamente');
  console.log('🧪 Probando endpoints con autenticación...');

  // Función helper con token
  async function makeAuthRequest(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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

  // Probar endpoint básico
  console.log('\n📊 Obteniendo estadísticas...');
  const stats = await makeAuthRequest(`${baseUrl}/products/statistics`);
  if (stats) {
    console.log('✅ Estadísticas:', JSON.stringify(stats.data, null, 2));
  }

  // Probar obtener tipos de productos
  console.log('\n📋 Obteniendo tipos de productos...');
  const productTypes = await makeAuthRequest(`${baseUrl}/products/types/product-types`);
  if (productTypes) {
    console.log('✅ Tipos disponibles:', productTypes.data.map(t => t.label).join(', '));
  }

  // Listar productos existentes
  console.log('\n📋 Listando productos existentes...');
  const products = await makeAuthRequest(`${baseUrl}/products?limit=5`);
  if (products) {
    console.log(`✅ Productos encontrados: ${products.data.length}`);
    products.data.forEach(product => {
      console.log(`   - ${product.name} (Stock: ${product.stock})`);
    });
  }

  // Si no hay productos, crear uno de prueba
  if (!products || products.data.length === 0) {
    console.log('\n➕ No hay productos. Creando producto de prueba...');
    
    const newProduct = {
      name: 'Producto de Prueba',
      description: 'Producto creado para pruebas del sistema',
      sku: 'TEST-001',
      categoryId: 1,
      unitId: 1,
      stock: 10,
      purchasePrice: 5000,
      salePrice: 10000,
      isActive: true
    };

    const created = await makeAuthRequest(`${baseUrl}/products`, {
      method: 'POST',
      body: JSON.stringify(newProduct)
    });

    if (created) {
      console.log(`✅ Producto creado: ${created.data.name} (ID: ${created.data.id})`);
    }
  }

  console.log('\n🎉 Pruebas con autenticación completadas');
}

testWithAuth().catch(console.error);

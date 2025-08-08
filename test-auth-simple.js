// Script simplificado para probar solo la autenticación JWT
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testAuthentication() {
  console.log('🔍 PROBANDO AUTENTICACIÓN JWT...');
  console.log('');

  try {
    // 1. LOGIN
    console.log('1️⃣ Haciendo login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });

    console.log('✅ Login exitoso!');
    console.log('📝 Respuesta completa:', JSON.stringify(loginResponse.data, null, 2));
    
    const token = loginResponse.data.data.token; // El token está en data.data.token
    if (!token) {
      console.log('❌ No se recibió token en la respuesta');
      return;
    }
    
    console.log('📝 Token recibido:', token.substring(0, 50) + '...');
    
    // 2. PROBAR TOKEN CON UNA RUTA SIMPLE
    console.log('');
    console.log('2️⃣ Probando token con ruta protegida simple...');
    
    const protectedResponse = await axios.get(`${BASE_URL}/protected`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Token válido! Respuesta:', protectedResponse.data);
    
    // 3. PROBAR TOKEN CON PRODUCTOS
    console.log('');
    console.log('3️⃣ Probando token con endpoints de productos...');
    
    const productsResponse = await axios.get(`${BASE_URL}/products`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Productos endpoint funciona! Total productos:', productsResponse.data.length || 0);
    
    // 4. PROBAR ESTADÍSTICAS FINANCIERAS
    console.log('');
    console.log('4️⃣ Probando estadísticas financieras...');
    
    const statsUrl = `${BASE_URL}/products/financial-statistics`;
    console.log('📍 URL:', statsUrl);
    
    const statsResponse = await axios.get(statsUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Estadísticas funcionan!');
    console.log('📊 Estadísticas:', statsResponse.data);
    
  } catch (error) {
    console.log('');
    console.log('❌ ERROR:', error.response?.status, error.response?.statusText);
    console.log('📝 Mensaje:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 401) {
      console.log('');
      console.log('🔧 PROBLEMA DE AUTENTICACIÓN:');
      console.log('   - El token JWT no se está validando correctamente');
      console.log('   - Revisar secreto JWT');
      console.log('   - Revisar configuración de passport');
    }
  }
}

// Ejecutar prueba
testAuthentication();

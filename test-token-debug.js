// Test para debuggear el problema del token JWT
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testTokenFlow() {
  try {
    console.log('🔍 Iniciando test de flujo de token...\n');
    
    // 1. Login
    console.log('📋 Paso 1: Haciendo login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'superadmin',
      password: 'super123'
    });
    
    console.log('✅ Login exitoso');
    console.log('📦 Datos recibidos:', loginResponse.data);
    
    const token = loginResponse.data.access_token || loginResponse.data.token;
    console.log('🔑 Token extraído:', token ? 'Sí existe' : 'NO EXISTE');
    console.log('🔑 Token (primeros 50 chars):', token ? token.substring(0, 50) + '...' : 'N/A');
    
    if (!token) {
      console.error('❌ No se recibió token en la respuesta de login');
      return;
    }
    
    // 2. Test endpoint con token
    console.log('\n📋 Paso 2: Probando endpoint con token...');
    const modulesResponse = await axios.get(`${API_BASE}/permissions/my-modules`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Endpoint my-modules exitoso');
    console.log('📦 Módulos recibidos:', modulesResponse.data);
    
  } catch (error) {
    console.error('❌ Error en el test:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Headers enviados:', error.config?.headers);
  }
}

// Ejecutar test
testTokenFlow();

// test-client-service.js
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function login() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@perfumeria.com',
      password: 'admin123'
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error logging in:', error.response?.data || error.message);
    return null;
  }
}

async function testClientService(token) {
  try {
    console.log('🔍 Obteniendo lista de clientes...');
    
    const response = await axios.get(`${API_BASE_URL}/clients`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('\n📊 Respuesta completa del servicio:');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('\n🔍 Analizando estructura:');
    console.log('- Tipo de response.data:', typeof response.data);
    console.log('- ¿Tiene success?:', 'success' in response.data);
    console.log('- ¿Tiene data?:', 'data' in response.data);
    
    if (response.data.data) {
      console.log('- Tipo de response.data.data:', typeof response.data.data);
      console.log('- ¿data.data tiene success?:', 'success' in response.data.data);
      console.log('- ¿data.data tiene data?:', 'data' in response.data.data);
      
      if (response.data.data.data) {
        console.log('- Tipo de response.data.data.data:', typeof response.data.data.data);
        console.log('- ¿Es array response.data.data.data?:', Array.isArray(response.data.data.data));
        if (Array.isArray(response.data.data.data)) {
          console.log('- Número de clientes en data.data.data:', response.data.data.data.length);
        }
      }
    }
    
    // Simular la lógica del frontend
    let extractedData = response.data;
    
    if (extractedData?.data?.data) {
      extractedData = extractedData.data.data;
      console.log('\n✅ Usando lógica: response.data.data.data');
    } else if (extractedData?.data) {
      extractedData = extractedData.data;
      console.log('\n✅ Usando lógica: response.data.data');
    }
    
    console.log('\n👥 Datos extraídos:');
    console.log('- ¿Es array?:', Array.isArray(extractedData));
    console.log('- Número de elementos:', Array.isArray(extractedData) ? extractedData.length : 'N/A');
    
    if (Array.isArray(extractedData) && extractedData.length > 0) {
      console.log('\n👤 Primer cliente:');
      console.log(JSON.stringify(extractedData[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error obteniendo clientes:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

async function main() {
  console.log('🚀 Iniciando debug del servicio de clientes...\n');
  
  const token = await login();
  if (!token) {
    console.log('❌ No se pudo obtener el token de autenticación');
    return;
  }
  
  console.log('✅ Autenticación exitosa');
  await testClientService(token);
  
  console.log('\n🎉 Debug completado');
}

main().catch(console.error);

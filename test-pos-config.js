// test-pos-config.js
const axios = require('axios');

async function testPosConfig() {
  try {
    console.log('🔍 Probando configuración del POS...\n');

    // Primero login
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'superadmin',
      password: 'admin123'
    });

    const token = loginResponse.data.access_token;
    console.log('✅ Login exitoso');

    // Probar endpoint de configuración del POS
    const posConfigResponse = await axios.get('http://localhost:3000/api/system-parameters/pos/configuration', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('\n📋 Respuesta del endpoint /pos/configuration:');
    console.log(JSON.stringify(posConfigResponse.data, null, 2));

    // Verificar específicamente el parámetro pos_edit_cost_enabled
    const editCostResponse = await axios.get('http://localhost:3000/api/system-parameters/pos/edit-cost-enabled', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('\n🎯 Respuesta del endpoint /pos/edit-cost-enabled:');
    console.log(JSON.stringify(editCostResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testPosConfig();
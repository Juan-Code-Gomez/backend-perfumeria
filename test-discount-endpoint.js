// test-discount-endpoint.js
const axios = require('axios');

async function testDiscountEndpoint() {
  try {
    console.log('🔧 Probando endpoint de descuentos...\n');
    
    const response = await axios.get('http://localhost:3000/api/sales/analytics/discounts', {
      params: {
        dateFrom: '2025-11-01',
        dateTo: '2025-11-30'
      }
    });
    
    console.log('✅ Respuesta del servidor:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testDiscountEndpoint();
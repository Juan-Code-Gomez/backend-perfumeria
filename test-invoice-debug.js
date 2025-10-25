const axios = require('axios');

async function testInvoiceDebug() {
  try {
    console.log('🧪 Probando endpoint /api/invoices/debug...\n');

    const response = await axios.get('http://localhost:3000/api/invoices/debug');

    console.log(`Status Code: ${response.status}\n`);
    console.log('✅ SUCCESS!\n');
    console.log(JSON.stringify(response.data, null, 2));

    console.log('\n📊 ANÁLISIS:');
    console.log(`   Total facturas: ${response.data.data?.invoicesCount || 0}`);
    console.log(`   Total items: ${response.data.data?.itemsCount || 0}`);
    console.log(`   Monto total: ${response.data.data?.totalAmount || 0}`);

  } catch (error) {
    console.error('\n❌ ERROR:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

testInvoiceDebug();

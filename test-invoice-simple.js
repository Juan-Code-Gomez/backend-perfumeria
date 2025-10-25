// Test simple del endpoint de Invoice sin dependencias
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/invoices/debug',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('🧪 Probando endpoint /api/invoices/debug...\n');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}\n`);
    
    if (res.statusCode === 200) {
      console.log('✅ SUCCESS!\n');
      try {
        const jsonData = JSON.parse(data);
        console.log(JSON.stringify(jsonData, null, 2));
        
        if (jsonData.data) {
          console.log('\n📊 ANÁLISIS:');
          console.log(`   Total facturas: ${jsonData.data.invoicesCount || 0}`);
          console.log(`   Total items: ${jsonData.data.itemsCount || 0}`);
          console.log(`   Monto total: ${jsonData.data.totalAmount || 0}`);
        }
      } catch (e) {
        console.log(data);
      }
    } else {
      console.error('❌ ERROR:');
      console.error(data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ ERROR:');
  console.error(error.message);
});

req.end();

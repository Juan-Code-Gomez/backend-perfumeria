// 🧪 TEST RÁPIDO DEL ENDPOINT DE DASHBOARD

const http = require('http');

console.log('\n🧪 Probando endpoint de dashboard...\n');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/dashboard/executive-summary',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}\n`);
    
    if (res.statusCode === 200) {
      console.log('✅ SUCCESS!\n');
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } else {
      console.log('❌ ERROR!\n');
      try {
        const error = JSON.parse(data);
        console.log(JSON.stringify(error, null, 2));
      } catch {
        console.log(data);
      }
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.log('\n⚠️  Asegúrate de que el servidor esté corriendo:');
  console.log('   npm run start\n');
});

req.end();

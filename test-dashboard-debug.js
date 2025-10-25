// 🧪 TEST ENDPOINT DEBUG (Sin autenticación)

const http = require('http');

console.log('\n🧪 Probando endpoint /api/dashboard/debug...\n');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/dashboard/debug',
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
      const result = JSON.parse(data);
      console.log(JSON.stringify(result, null, 2));
      
      // Analizar resultados
      console.log('\n📊 ANÁLISIS:');
      Object.entries(result.tests || {}).forEach(([test, result]) => {
        if (result.startsWith('✗')) {
          console.log(`❌ ${test}: ${result}`);
        } else {
          console.log(`✓  ${test}: OK`);
        }
      });
      
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
  console.log('\n⚠️  El servidor no está corriendo o no se puede conectar.');
  console.log('   1. Asegúrate de que el servidor esté corriendo');
  console.log('   2. Recompila: npm run build');
  console.log('   3. Reinicia: npm run start:dev\n');
});

req.end();

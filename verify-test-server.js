#!/usr/bin/env node

/**
 * Verificar que el servidor de prueba responde correctamente
 */

const https = require('https');

const BASE_URL = 'https://backend-perfumeria-production-3815.up.railway.app';

function testEndpoint(path, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔍 Probando: ${description}`);
    console.log(`   URL: ${BASE_URL}${path}`);
    
    https.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          console.log(`   ✅ OK`);
          try {
            const json = JSON.parse(data);
            console.log(`   Respuesta:`, JSON.stringify(json, null, 2).substring(0, 200));
          } catch (e) {
            console.log(`   Respuesta:`, data.substring(0, 200));
          }
          resolve(true);
        } else {
          console.log(`   ❌ Error: ${res.statusCode}`);
          console.log(`   Respuesta:`, data.substring(0, 300));
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.log(`   ❌ Error de conexión:`, err.message);
      resolve(false);
    });
  });
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  🧪 VERIFICACIÓN SERVIDOR DE PRUEBA');
  console.log('═══════════════════════════════════════════════════');
  console.log(`\nServidor: ${BASE_URL}`);
  
  const tests = [
    { path: '/api/health', description: 'Health check' },
    { path: '/api/company-config/public', description: 'Configuración de compañía (público)' },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await testEndpoint(test.path, test.description);
    if (result) passed++;
    else failed++;
    
    // Esperar un poco entre requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log(`\n📊 Resultados:`);
  console.log(`   ✅ Pasados: ${passed}`);
  console.log(`   ❌ Fallados: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 ¡Servidor funcionando correctamente!');
  } else {
    console.log('\n⚠️  Algunos endpoints tienen problemas');
  }
  
  console.log('\n═══════════════════════════════════════════════════');
}

main();

// Script para probar la carga masiva de inventario
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000/api';

async function testInventoryUpload() {
  console.log('📦 PROBANDO CARGA MASIVA DE INVENTARIO...');
  console.log('');

  try {
    // 1. LOGIN
    console.log('1️⃣ Haciendo login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Login exitoso!');
    
    // 2. VERIFICAR QUE EL ARCHIVO EXCEL EXISTE
    const excelFile = 'inventario-con-datos-reales.xlsx';
    
    if (!fs.existsSync(excelFile)) {
      console.log('❌ Archivo Excel no encontrado. Creándolo...');
      const { createFilledExcel } = require('./create-real-inventory.js');
      createFilledExcel();
    }
    
    console.log('');
    console.log('2️⃣ Preparando archivo Excel para carga...');
    
    // 3. CREAR FORM DATA PARA SUBIR EL ARCHIVO
    const form = new FormData();
    form.append('file', fs.createReadStream(excelFile), {
      filename: excelFile,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    console.log('3️⃣ Cargando archivo Excel...');
    
    // 4. SUBIR EL ARCHIVO
    const uploadResponse = await axios.post(
      `${BASE_URL}/products/upload-excel`,
      form,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...form.getHeaders()
        }
      }
    );
    
    console.log('✅ ¡Archivo Excel cargado exitosamente!');
    console.log('📊 Resultado:', uploadResponse.data);
    
    // 5. VERIFICAR PRODUCTOS CARGADOS
    console.log('');
    console.log('4️⃣ Verificando productos cargados...');
    
    const productsResponse = await axios.get(`${BASE_URL}/products`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`✅ Total productos en sistema: ${productsResponse.data.length}`);
    
    // 6. VER ESTADÍSTICAS FINANCIERAS
    console.log('');
    console.log('5️⃣ Calculando estadísticas financieras...');
    
    const inventoryValueResponse = await axios.get(`${BASE_URL}/products/inventory-value`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('💰 VALOR DEL INVENTARIO:');
    console.log(JSON.stringify(inventoryValueResponse.data, null, 2));
    
    // 7. VERIFICAR PRODUCTOS CON STOCK BAJO
    console.log('');
    console.log('6️⃣ Verificando productos con stock bajo...');
    
    const lowStockResponse = await axios.get(`${BASE_URL}/products/low-stock`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`🚨 Productos con stock bajo: ${lowStockResponse.data.length}`);
    if (lowStockResponse.data.length > 0) {
      lowStockResponse.data.forEach(product => {
        console.log(`   ⚠️ ${product.name}: ${product.stockQuantity} unidades`);
      });
    }
    
  } catch (error) {
    console.log('');
    console.log('❌ ERROR:', error.response?.status, error.response?.statusText);
    console.log('📝 Mensaje:', error.response?.data?.message || error.message);
    
    if (error.response?.data) {
      console.log('📝 Detalle:', error.response.data);
    }
  }
}

// Ejecutar prueba
testInventoryUpload();

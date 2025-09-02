// test-multiple-payments.js
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function login() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error logging in:', error.response?.data || error.message);
    return null;
  }
}

async function getProducts(token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/products?search=&page=1&pageSize=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error obteniendo productos:', error.response?.data || error.message);
    return [];
  }
}

async function testMultiplePaymentSale(token) {
  try {
    console.log('🧪 Probando venta con múltiples métodos de pago...');
    
    // Obtener algunos productos para la venta
    const products = await getProducts(token);
    if (products.length === 0) {
      console.log('❌ No se encontraron productos para la prueba');
      return;
    }

    console.log(`✅ Productos disponibles: ${products.length}`);
    
    // Usar los primeros 2 productos para la venta
    const product1 = products[0];
    const product2 = products[1] || products[0];
    
    const saleData = {
      date: new Date().toISOString(),
      customerName: 'Cliente Prueba Pagos Múltiples',
      totalAmount: 200000, // $200,000
      paidAmount: 200000,  // Pagado completo
      isPaid: true,
      paymentMethod: 'Efectivo, Transferencia', // Para compatibilidad
      // Múltiples métodos de pago
      payments: [
        {
          amount: 120000,
          method: 'Efectivo',
          note: 'Pago en efectivo'
        },
        {
          amount: 80000,
          method: 'Transferencia',
          note: 'Transferencia bancaria - Ref: 123456'
        }
      ],
      details: [
        {
          productId: product1.id,
          quantity: 1,
          unitPrice: 150000,
          totalPrice: 150000,
          purchasePrice: product1.purchasePrice || 50000,
          suggestedPrice: product1.salePrice || 150000,
        },
        {
          productId: product2.id,
          quantity: 1,
          unitPrice: 50000,
          totalPrice: 50000,
          purchasePrice: product2.purchasePrice || 20000,
          suggestedPrice: product2.salePrice || 50000,
        }
      ]
    };

    console.log('\n📊 Datos de la venta:');
    console.log(`   Total: $${saleData.totalAmount.toLocaleString()}`);
    console.log(`   Métodos de pago:`);
    saleData.payments.forEach((payment, index) => {
      console.log(`     ${index + 1}. ${payment.method}: $${payment.amount.toLocaleString()} - ${payment.note}`);
    });

    console.log('\n🚀 Enviando venta al backend...');
    
    const response = await axios.post(`${API_BASE_URL}/sales`, saleData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Venta creada exitosamente:');
    console.log(`   ID de venta: ${response.data.id}`);
    console.log(`   Cliente: ${response.data.customerName}`);
    console.log(`   Total: $${response.data.totalAmount.toLocaleString()}`);
    console.log(`   Método de pago: ${response.data.paymentMethod}`);
    console.log(`   Estado: ${response.data.isPaid ? 'PAGADA' : 'PENDIENTE'}`);

    // Verificar que los pagos se guardaron correctamente
    console.log('\n🔍 Verificando pagos registrados...');
    
    const saleDetailsResponse = await axios.get(`${API_BASE_URL}/sales/${response.data.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (saleDetailsResponse.data.payments) {
      console.log('✅ Pagos múltiples registrados:');
      saleDetailsResponse.data.payments.forEach((payment, index) => {
        console.log(`   ${index + 1}. ${payment.method}: $${payment.amount.toLocaleString()}`);
        if (payment.note) console.log(`      Nota: ${payment.note}`);
      });
    } else {
      console.log('⚠️  Los pagos múltiples no se encontraron en la respuesta');
    }

  } catch (error) {
    console.log('❌ Error creando venta con múltiples pagos:');
    console.log('   Status:', error.response?.status);
    console.log('   Message:', error.response?.data?.message || error.message);
    if (error.response?.data?.details) {
      console.log('   Details:', JSON.stringify(error.response.data.details, null, 2));
    }
  }
}

async function testTraditionalPaymentSale(token) {
  try {
    console.log('\n🧪 Probando venta con método tradicional (compatibilidad)...');
    
    const products = await getProducts(token);
    if (products.length === 0) return;

    const product = products[0];
    
    const saleData = {
      date: new Date().toISOString(),
      customerName: 'Cliente Prueba Tradicional',
      totalAmount: 75000,
      paidAmount: 75000,
      isPaid: true,
      paymentMethod: 'Efectivo', // Método tradicional
      details: [
        {
          productId: product.id,
          quantity: 1,
          unitPrice: 75000,
          totalPrice: 75000,
          purchasePrice: product.purchasePrice || 30000,
          suggestedPrice: product.salePrice || 75000,
        }
      ]
    };

    console.log(`   Total: $${saleData.totalAmount.toLocaleString()}`);
    console.log(`   Método: ${saleData.paymentMethod}`);

    const response = await axios.post(`${API_BASE_URL}/sales`, saleData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Venta tradicional creada exitosamente:');
    console.log(`   ID: ${response.data.id}`);
    console.log(`   Método: ${response.data.paymentMethod}`);

  } catch (error) {
    console.log('❌ Error en venta tradicional:', error.response?.data?.message || error.message);
  }
}

async function main() {
  console.log('🚀 Iniciando pruebas de métodos de pago múltiples...\n');
  
  const token = await login();
  if (!token) {
    console.log('❌ No se pudo obtener el token de autenticación');
    return;
  }
  
  console.log('✅ Autenticación exitosa\n');
  
  await testMultiplePaymentSale(token);
  await testTraditionalPaymentSale(token);
  
  console.log('\n🎉 Pruebas completadas');
}

main().catch(console.error);

// test-supplier-creation.js
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

async function testSupplierCreation(token) {
  const testSuppliers = [
    {
      name: 'Esencias Premium S.A.S',
      nit: '900123456-1',
      email: 'ventas@esenciaspremium.com',
      phone: '+57 300 123 4567',
      address: 'Carrera 15 #85-32, Bogotá',
      contactPerson: 'María González',
      supplierType: 'ESENCIAS',
      specializedCategories: ['Esencias florales', 'Esencias frutales'],
      paymentTerms: '30 días',
      creditLimit: 5000000,
      isPreferred: true,
      minOrderAmount: 500000,
      leadTimeDays: 5,
      notes: 'Proveedor especializado en esencias de alta calidad'
    },
    {
      name: 'Distribuidora Nacional',
      nit: '800987654-2',
      email: 'compras@distrinacional.com',
      phone: '+57 300 987 6543',
      address: 'Zona Industrial, Medellín',
      contactPerson: 'Carlos Rodríguez',
      supplierType: 'DISTRIBUIDOR',
      specializedCategories: ['Distribución nacional', 'Logística'],
      paymentTerms: '45 días',
      creditLimit: 10000000,
      isPreferred: false,
      minOrderAmount: 1000000,
      leadTimeDays: 7,
      notes: 'Distribuidora con cobertura nacional'
    },
    {
      name: 'Frascos y Envases Colombia',
      nit: '700456789-3',
      email: 'ventas@frascoscolombia.com',
      phone: '+57 301 456 7890',
      address: 'Calle 26 #68-25, Bogotá',
      contactPerson: 'Ana Martínez',
      supplierType: 'FRASCOS',
      specializedCategories: ['Envases de vidrio', 'Tapas y accesorios'],
      paymentTerms: '60 días',
      creditLimit: 3000000,
      isPreferred: true,
      minOrderAmount: 200000,
      leadTimeDays: 10,
      notes: 'Especialistas en envases para perfumería'
    }
  ];

  for (const supplier of testSuppliers) {
    try {
      console.log(`\n🧪 Creando proveedor: ${supplier.name}`);
      console.log(`   Tipo: ${supplier.supplierType}`);
      
      const response = await axios.post(`${API_BASE_URL}/suppliers`, supplier, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ Proveedor creado exitosamente:`);
      console.log(`   ID: ${response.data.id}`);
      console.log(`   Nombre: ${response.data.name}`);
      console.log(`   Tipo: ${response.data.supplierType}`);
      console.log(`   Estado: ${response.data.isActive ? 'Activo' : 'Inactivo'}`);
      console.log(`   Preferido: ${response.data.isPreferred ? 'Sí' : 'No'}`);
    } catch (error) {
      console.log(`❌ Error creando proveedor ${supplier.name}:`);
      console.log('   Error:', error.response?.data?.message || error.message);
      
      if (error.response?.data?.details) {
        console.log('   Detalles:', JSON.stringify(error.response.data.details, null, 2));
      }
    }
  }
}

async function testAnalytics(token) {
  try {
    console.log('\n📊 Obteniendo análisis de proveedores...');
    
    const response = await axios.get(`${API_BASE_URL}/suppliers/analytics`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const analytics = response.data;
    console.log('✅ Análisis obtenido exitosamente:');
    console.log(`   Total de proveedores: ${analytics.totalSuppliers}`);
    console.log(`   Proveedores activos: ${analytics.activeSuppliers}`);
    console.log(`   Proveedores preferidos: ${analytics.preferredSuppliers}`);
    console.log(`   Proveedores con deuda: ${analytics.suppliersWithDebt}`);
    console.log(`   Deuda total: $${analytics.totalDebt.toLocaleString()}`);
    console.log(`   Límite de crédito total: $${analytics.totalCreditLimit.toLocaleString()}`);
    console.log('   Distribución por tipo:', analytics.typeDistribution);
    console.log(`   Nivel de riesgo: ${analytics.metrics.riskLevel}`);
  } catch (error) {
    console.log('❌ Error obteniendo análisis:');
    console.log('   Error:', error.response?.data?.message || error.message);
  }
}

async function main() {
  console.log('🚀 Iniciando pruebas de proveedores...\n');
  
  const token = await login();
  if (!token) {
    console.log('❌ No se pudo obtener el token de autenticación');
    return;
  }
  
  console.log('✅ Autenticación exitosa');
  
  await testSupplierCreation(token);
  await testAnalytics(token);
  
  console.log('\n🎉 Pruebas completadas');
}

main().catch(console.error);

// Test de la API desplegada en Railway
const API_URL = 'https://backend-perfumeria-production.up.railway.app/api';

// Test 1: Health Check
console.log('🧪 Testing API Health Check...');
fetch(`${API_URL}/health`)
  .then(response => response.json())
  .then(data => {
    console.log('✅ Health Check:', data);
  })
  .catch(error => {
    console.error('❌ Health Check Failed:', error);
  });

// Test 2: Login
console.log('🧪 Testing Login...');
fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
})
.then(response => response.json())
.then(data => {
  console.log('✅ Login Response:', data);
  
  if (data.success && data.data.token) {
    const token = data.data.token;
    console.log('🔑 Token obtained, testing protected endpoint...');
    
    // Test 3: Categories (protected endpoint)
    return fetch(`${API_URL}/categories`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
  } else {
    throw new Error('Login failed');
  }
})
.then(response => response.json())
.then(data => {
  console.log('✅ Categories:', data);
})
.catch(error => {
  console.error('❌ API Test Failed:', error);
});

console.log('🚀 API Base URL:', API_URL);
console.log('📋 Available endpoints to test:');
console.log('  - GET /api/health');
console.log('  - POST /api/auth/login (username: admin, password: admin123)');
console.log('  - GET /api/categories (requires auth)');
console.log('  - GET /api/products (requires auth)');
console.log('  - GET /api/suppliers (requires auth)');

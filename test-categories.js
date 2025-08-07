async function testCategories() {
  try {
    // Login
    console.log('🔐 Autenticando...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    const loginData = await loginResponse.json();
    const token = loginData.data.token;

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    console.log('✅ Autenticación exitosa');

    // Get all categories
    console.log('\n📋 Obteniendo todas las categorías...');
    const categoriesResponse = await fetch('http://localhost:3000/api/categories', { headers });
    const categoriesData = await categoriesResponse.json();
    
    if (!categoriesData.success) {
      throw new Error('Error al obtener categorías: ' + JSON.stringify(categoriesData));
    }
    
    const categories = categoriesData.data;
    
    if (!Array.isArray(categories)) {
      throw new Error('Las categorías no son un array: ' + typeof categories);
    }
    
    console.log(`📊 Total de categorías: ${categories.length}`);
    console.log('\n📝 Lista de categorías:');
    categories.forEach((cat) => {
      console.log(`  ${cat.icon || '📂'} ${cat.name}`);
      if (cat.description) console.log(`     📄 ${cat.description}`);
      if (cat.color) console.log(`     🎨 Color: ${cat.color}`);
      console.log(`     👥 Productos: ${cat._count?.products || 0}`);
      console.log('');
    });

    // Get statistics
    console.log('\n📊 Obteniendo estadísticas...');
    const statsResponse = await fetch('http://localhost:3000/api/categories/statistics', { headers });
    const statsData = await statsResponse.json();
    const stats = statsData.data;
    console.log('📈 Estadísticas de categorías:');
    console.log(`  📁 Total: ${stats.totalCategories}`);
    console.log(`  ✅ Activas: ${stats.activeCategories}`);
    console.log(`  ❌ Inactivas: ${stats.inactiveCategories}`);
    console.log(`  📦 Con productos: ${stats.categoriesWithProducts}`);
    console.log(`  🔍 Sin productos: ${stats.categoriesWithoutProducts}`);

    if (stats.topCategories?.length > 0) {
      console.log('\n🏆 Top categorías por cantidad de productos:');
      stats.topCategories.forEach((cat, index) => {
        console.log(`  ${index + 1}. ${cat.name}: ${cat.productCount} productos`);
      });
    }

    // Search test
    console.log('\n🔍 Probando búsqueda de "Perfumes"...');
    const searchResponse = await fetch('http://localhost:3000/api/categories?search=Perfumes', { headers });
    const searchData = await searchResponse.json();
    const searchResults = searchData.data;
    console.log(`🎯 Encontradas ${searchResults.length} categorías:`);
    searchResults.forEach((cat) => {
      console.log(`  • ${cat.name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCategories();

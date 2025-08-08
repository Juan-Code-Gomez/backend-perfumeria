async function testUnits() {
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

    // Get all units
    console.log('\n📋 Obteniendo todas las unidades...');
    const unitsResponse = await fetch('http://localhost:3000/api/units', { headers });
    const unitsData = await unitsResponse.json();
    
    if (!unitsData.success) {
      throw new Error('Error al obtener unidades: ' + JSON.stringify(unitsData));
    }
    
    const units = unitsData.data;
    
    if (!Array.isArray(units)) {
      throw new Error('Las unidades no son un array: ' + typeof units);
    }
    
    console.log(`📊 Total de unidades: ${units.length}`);
    console.log('\n📝 Lista de unidades por tipo:');
    
    // Group by type
    const unitsByType = units.reduce((acc, unit) => {
      const type = unit.unitType || 'Sin tipo';
      if (!acc[type]) acc[type] = [];
      acc[type].push(unit);
      return acc;
    }, {});

    Object.entries(unitsByType).forEach(([type, typeUnits]) => {
      console.log(`\n🏷️ ${type}:`);
      typeUnits.forEach((unit) => {
        console.log(`  ${unit.symbol || '📐'} ${unit.name}`);
        if (unit.description) console.log(`     📄 ${unit.description}`);
        console.log(`     👥 Productos: ${unit._count?.products || 0}`);
        console.log(`     🔢 Decimales: ${unit.isDecimal ? 'Sí' : 'No'}`);
        console.log('');
      });
    });

    // Get statistics
    console.log('\n📊 Obteniendo estadísticas...');
    const statsResponse = await fetch('http://localhost:3000/api/units/statistics', { headers });
    const statsData = await statsResponse.json();
    const stats = statsData.data;
    console.log('📈 Estadísticas de unidades:');
    console.log(`  📁 Total: ${stats.totalUnits}`);
    console.log(`  ✅ Activas: ${stats.activeUnits}`);
    console.log(`  ❌ Inactivas: ${stats.inactiveUnits}`);
    console.log(`  📦 Con productos: ${stats.unitsWithProducts}`);
    console.log(`  🔍 Sin productos: ${stats.unitsWithoutProducts}`);

    if (stats.unitsByType?.length > 0) {
      console.log('\n📊 Unidades por tipo:');
      stats.unitsByType.forEach((typeData) => {
        console.log(`  🏷️ ${typeData.type}: ${typeData.count} unidades`);
      });
    }

    if (stats.topUnits?.length > 0) {
      console.log('\n🏆 Top unidades por cantidad de productos:');
      stats.topUnits.forEach((unit, index) => {
        console.log(`  ${index + 1}. ${unit.name} (${unit.symbol}): ${unit.productCount} productos`);
      });
    }

    // Test search
    console.log('\n🔍 Probando búsqueda de "ml"...');
    const searchResponse = await fetch('http://localhost:3000/api/units?search=ml', { headers });
    const searchData = await searchResponse.json();
    const searchResults = searchData.data;
    console.log(`🎯 Encontradas ${searchResults.length} unidades:`);
    searchResults.forEach((unit) => {
      console.log(`  • ${unit.name} (${unit.symbol || 'Sin símbolo'})`);
    });

    // Test by type
    console.log('\n🏷️ Probando filtro por tipo "VOLUME"...');
    const volumeResponse = await fetch('http://localhost:3000/api/units/by-type/VOLUME', { headers });
    const volumeData = await volumeResponse.json();
    const volumeUnits = volumeData.data;
    console.log(`🎯 Encontradas ${volumeUnits.length} unidades de volumen:`);
    volumeUnits.forEach((unit) => {
      console.log(`  • ${unit.name} (${unit.symbol})`);
    });

    // Test creating a new unit
    console.log('\n➕ Probando creación de nueva unidad...');
    const newUnit = {
      name: 'Galones',
      symbol: 'gal',
      description: 'Unidad de volumen en sistema imperial para grandes cantidades',
      unitType: 'VOLUME',
      isActive: true,
      isDecimal: true,
    };

    const createResponse = await fetch('http://localhost:3000/api/units', {
      method: 'POST',
      headers,
      body: JSON.stringify(newUnit),
    });
    const createData = await createResponse.json();

    if (createData.success) {
      console.log(`✅ Unidad creada: ${createData.data.name}`);
      
      // Test updating the unit
      console.log('\n📝 Probando actualización de unidad...');
      const updateResponse = await fetch(`http://localhost:3000/api/units/${createData.data.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          description: 'Unidad de volumen para cantidades muy grandes (1 galón = 3.785 litros)',
        }),
      });
      const updateData = await updateResponse.json();
      
      if (updateData.success) {
        console.log(`✅ Unidad actualizada: ${updateData.data.name}`);
      }
    } else {
      console.log(`❌ Error creando unidad: ${createData.message || 'Error desconocido'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testUnits();

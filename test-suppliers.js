async function testSuppliers() {
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

    // Get all suppliers
    console.log('\n📋 Obteniendo todos los proveedores...');
    const suppliersResponse = await fetch('http://localhost:3000/api/suppliers', { headers });
    const suppliersData = await suppliersResponse.json();
    
    if (!suppliersData.success) {
      throw new Error('Error al obtener proveedores: ' + JSON.stringify(suppliersData));
    }
    
    const suppliers = suppliersData.data;
    
    if (!Array.isArray(suppliers)) {
      throw new Error('Los proveedores no son un array: ' + typeof suppliers);
    }
    
    console.log(`📊 Total de proveedores: ${suppliers.length}`);
    console.log('\n📝 Lista de proveedores por tipo:');
    
    // Group by type
    const suppliersByType = suppliers.reduce((acc, supplier) => {
      const type = supplier.supplierType || 'Sin tipo';
      if (!acc[type]) acc[type] = [];
      acc[type].push(supplier);
      return acc;
    }, {});

    Object.entries(suppliersByType).forEach(([type, typeSuppliers]) => {
      console.log(`\n🏷️ ${type}:`);
      typeSuppliers.forEach((supplier) => {
        const preferredIcon = supplier.isPreferred ? '⭐' : '📦';
        console.log(`  ${preferredIcon} ${supplier.name}`);
        console.log(`     📧 ${supplier.email || 'Sin email'}`);
        console.log(`     📞 ${supplier.phone || 'Sin teléfono'}`);
        console.log(`     💳 Pago: ${supplier.paymentTerms || 'No definido'}`);
        console.log(`     💰 Crédito: $${supplier.creditLimit?.toLocaleString() || 'Sin límite'}`);
        console.log(`     🚚 Entrega: ${supplier.leadTimeDays || '?'} días`);
        console.log(`     ⭐ Rating: ${supplier.rating || 'Sin rating'}/5`);
        console.log(`     👥 Compras: ${supplier._count?.purchases || 0}`);
        if (supplier.notes) {
          console.log(`     📝 ${supplier.notes}`);
        }
        console.log('');
      });
    });

    // Get statistics
    console.log('\n📊 Obteniendo estadísticas...');
    const statsResponse = await fetch('http://localhost:3000/api/suppliers/statistics', { headers });
    const statsData = await statsResponse.json();
    const stats = statsData.data;
    console.log('📈 Estadísticas de proveedores:');
    console.log(`  📁 Total: ${stats.totalSuppliers}`);
    console.log(`  ✅ Activos: ${stats.activeSuppliers}`);
    console.log(`  ❌ Inactivos: ${stats.inactiveSuppliers}`);
    console.log(`  ⭐ Preferidos: ${stats.preferredSuppliers}`);
    console.log(`  💳 Con deuda: ${stats.suppliersWithDebt}`);
    console.log(`  💰 Deuda total: $${stats.totalDebt?.toLocaleString() || '0'}`);

    if (stats.suppliersByType?.length > 0) {
      console.log('\n📊 Proveedores por tipo:');
      stats.suppliersByType.forEach((typeData) => {
        console.log(`  🏷️ ${typeData.type}: ${typeData.count} proveedores`);
      });
    }

    if (stats.topSuppliers?.length > 0) {
      console.log('\n🏆 Top proveedores por monto de compras:');
      stats.topSuppliers.forEach((supplier, index) => {
        console.log(`  ${index + 1}. ${supplier.name} (${supplier.supplierType}): $${supplier.totalPurchaseAmount?.toLocaleString() || '0'}`);
      });
    }

    // Test search
    console.log('\n🔍 Probando búsqueda de "Milano"...');
    const searchResponse = await fetch('http://localhost:3000/api/suppliers?search=Milano', { headers });
    const searchData = await searchResponse.json();
    const searchResults = searchData.data;
    console.log(`🎯 Encontrados ${searchResults.length} proveedores:`);
    searchResults.forEach((supplier) => {
      console.log(`  • ${supplier.name} (${supplier.supplierType})`);
    });

    // Test by type
    console.log('\n🏷️ Probando filtro por tipo "ESENCIAS"...');
    const essencesResponse = await fetch('http://localhost:3000/api/suppliers/by-type/ESENCIAS', { headers });
    const essencesData = await essencesResponse.json();
    const essencesSuppliers = essencesData.data;
    console.log(`🎯 Encontrados ${essencesSuppliers.length} proveedores de esencias:`);
    essencesSuppliers.forEach((supplier) => {
      console.log(`  • ${supplier.name} - ${supplier.paymentTerms} - Rating: ${supplier.rating}/5`);
    });

    // Test preferred suppliers
    console.log('\n⭐ Probando filtro de proveedores preferidos...');
    const preferredResponse = await fetch('http://localhost:3000/api/suppliers?isPreferred=true', { headers });
    const preferredData = await preferredResponse.json();
    const preferredSuppliers = preferredData.data;
    console.log(`🎯 Encontrados ${preferredSuppliers.length} proveedores preferidos:`);
    preferredSuppliers.forEach((supplier) => {
      console.log(`  ⭐ ${supplier.name} (${supplier.supplierType}) - Crédito: $${supplier.creditLimit?.toLocaleString()}`);
    });

    // Test creating a new supplier
    console.log('\n➕ Probando creación de nuevo proveedor...');
    const newSupplier = {
      name: 'Esencias Premium Test',
      nit: '999999999-9',
      phone: '+57 1 999-9999',
      email: 'test@esenciaspremium.com',
      address: 'Calle Test #123-45',
      contactPerson: 'Juan Pérez',
      paymentTerms: '30_DIAS',
      creditLimit: 1000000,
      supplierType: 'ESENCIAS',
      specializedCategories: ['Esencias', 'Fijador'],
      isActive: true,
      isPreferred: false,
      minOrderAmount: 200000,
      leadTimeDays: 7,
      rating: 4.0,
      notes: 'Proveedor de prueba para testing',
    };

    const createResponse = await fetch('http://localhost:3000/api/suppliers', {
      method: 'POST',
      headers,
      body: JSON.stringify(newSupplier),
    });
    const createData = await createResponse.json();

    if (createData.success) {
      console.log(`✅ Proveedor creado: ${createData.data.name}`);
      
      // Test updating the supplier
      console.log('\n📝 Probando actualización de proveedor...');
      const updateResponse = await fetch(`http://localhost:3000/api/suppliers/${createData.data.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          rating: 4.5,
          notes: 'Proveedor actualizado durante testing - Excelente servicio',
        }),
      });
      const updateData = await updateResponse.json();
      
      if (updateData.success) {
        console.log(`✅ Proveedor actualizado: ${updateData.data.name} - Rating: ${updateData.data.rating}`);
      }

      // Test toggle preferred
      console.log('\n⭐ Probando cambio a proveedor preferido...');
      const toggleResponse = await fetch(`http://localhost:3000/api/suppliers/${createData.data.id}/toggle-preferred`, {
        method: 'PUT',
        headers,
      });
      const toggleData = await toggleResponse.json();
      
      if (toggleData.success) {
        console.log(`✅ Estado preferido cambiado: ${toggleData.data.isPreferred ? 'Ahora es preferido' : 'Ya no es preferido'}`);
      }
    } else {
      console.log(`❌ Error creando proveedor: ${createData.message || 'Error desconocido'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSuppliers();

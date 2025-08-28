// Script para probar la nueva funcionalidad de precios inteligentes en carga masiva
const XLSX = require('xlsx');
const fs = require('fs');

// Crear un Excel de prueba que demuestre la nueva funcionalidad
function createPricingTestExcel() {
  const testData = [
    // CASO 1: Productos CON precio de venta específico (se debe usar exactamente este precio)
    {
      'Nombre producto': 'Perfume Black XS Especial 100ml',
      'Categoría': 'Perfumes 1.1',
      'Unidad': 'Mililitros',
      'Stock inicial': 10,
      'Precio compra': 15000,
      'Precio venta': 35000, // ← Precio específico, NO debe aplicar el 80% automático
      'Proveedor': 'Fragancias Milano'
    },
    // CASO 2: Producto SIN precio de venta (debe calcular automáticamente con 80% para Perfumes 1.1)
    {
      'Nombre producto': 'Perfume Invictus Automático 100ml',
      'Categoría': 'Perfumes 1.1',
      'Unidad': 'Mililitros',
      'Stock inicial': 8,
      'Precio compra': 16000,
      'Precio venta': '', // ← Vacío, debe calcular: 16000 × 1.80 = 28800
      'Proveedor': 'Fragancias Milano'
    },
    // CASO 3: Producto de otra categoría CON precio específico
    {
      'Nombre producto': 'Esencia Black XS Premium 30ml',
      'Categoría': 'Esencias',
      'Unidad': 'Mililitros',
      'Stock inicial': 25,
      'Precio compra': 8000,
      'Precio venta': 18000, // ← Precio específico, NO debe aplicar el 60% automático
      'Proveedor': 'Fragancias Milano'
    },
    // CASO 4: Producto de otra categoría SIN precio (debe calcular automáticamente con 60%)
    {
      'Nombre producto': 'Esencia Invictus Standard 30ml',
      'Categoría': 'Esencias',
      'Unidad': 'Mililitros',
      'Stock inicial': 20,
      'Precio compra': 7500,
      'Precio venta': 0, // ← Cero, debe calcular: 7500 × 1.60 = 12000
      'Proveedor': 'Fragancias Milano'
    },
    // CASO 5: Splash con precio específico
    {
      'Nombre producto': 'Splash Good Girl Deluxe 250ml',
      'Categoría': 'Splashs',
      'Unidad': 'Mililitros',
      'Stock inicial': 15,
      'Precio compra': 12000,
      'Precio venta': 25000, // ← Precio específico
      'Proveedor': 'Cosméticos Naturales'
    },
    // CASO 6: Splash sin precio (debe calcular con 60%)
    {
      'Nombre producto': 'Splash Polo Blue Standard 250ml',
      'Categoría': 'Splashs',
      'Unidad': 'Mililitros',
      'Stock inicial': 12,
      'Precio compra': 11000,
      'Precio venta': null, // ← Null, debe calcular: 11000 × 1.60 = 17600
      'Proveedor': 'Cosméticos Naturales'
    }
  ];

  // Crear workbook y worksheet
  const ws = XLSX.utils.json_to_sheet(testData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Productos');

  // Guardar archivo
  const fileName = 'test-precios-inteligentes.xlsx';
  XLSX.writeFile(wb, fileName);

  console.log('📊 ARCHIVO DE PRUEBA CREADO: ' + fileName);
  console.log('');
  console.log('🧪 CASOS DE PRUEBA INCLUIDOS:');
  console.log('');
  
  testData.forEach((product, index) => {
    const caso = index + 1;
    const tienePrecios = product['Precio venta'] && product['Precio venta'] !== '' && product['Precio venta'] !== 0;
    const esPerf11 = product['Categoría'].includes('Perfumes 1.1');
    
    console.log(`CASO ${caso}: ${product['Nombre producto']}`);
    console.log(`   Categoría: ${product['Categoría']}`);
    console.log(`   Precio compra: $${product['Precio compra']}`);
    console.log(`   Precio venta Excel: ${product['Precio venta'] || 'VACÍO'}`);
    
    if (tienePrecios) {
      console.log(`   ✅ ESPERADO: Usar precio del Excel = $${product['Precio venta']}`);
    } else {
      const margen = esPerf11 ? 1.80 : 1.60;
      const esperado = product['Precio compra'] * margen;
      const porcentaje = esPerf11 ? '80%' : '60%';
      console.log(`   🤖 ESPERADO: Calcular automático = $${product['Precio compra']} × ${margen} = $${esperado} (${porcentaje})`);
    }
    console.log('');
  });

  console.log('📝 INSTRUCCIONES:');
  console.log('1. Carga este archivo usando la carga masiva CON proveedor');
  console.log('2. Revisa los logs en el servidor para verificar que se aplicaron los precios correctos');
  console.log('3. Verifica en la base de datos que los precios coincidan con lo esperado');
  console.log('');
  console.log('🎯 RESULTADOS ESPERADOS EN LOS LOGS:');
  console.log('- "💰 Usando precio de venta del Excel" para casos 1, 3, 5');
  console.log('- "📊 Precio calculado automáticamente" para casos 2, 4, 6');
  console.log('- Perfumes 1.1 deben mostrar "80% rentabilidad"');
  console.log('- Otras categorías deben mostrar "60% rentabilidad"');

  return fileName;
}

// Ejecutar la creación del archivo de prueba
if (require.main === module) {
  console.log('🧪 CREANDO ARCHIVO DE PRUEBA PARA PRECIOS INTELIGENTES');
  console.log('=' .repeat(60));
  createPricingTestExcel();
}

module.exports = { createPricingTestExcel };

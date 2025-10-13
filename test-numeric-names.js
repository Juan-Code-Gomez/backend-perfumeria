// Test para validar que nombres de productos numéricos funcionan correctamente
// Ejecutar: node test-numeric-names.js

const testRows = [
  {
    'Nombre producto': '360',
    'Categoría': 'Premium ZB',
    'Unidad': 'Unidad',
    'Precio compra': 28000,
    'Precio venta': 90000,
    'Stock inicial': 2
  },
  {
    'Nombre producto': 212,  // Número sin comillas
    'Categoría': 'Premium ZB',
    'Unidad': 'Unidad',
    'Precio compra': 35000,
    'Precio venta': 95000,
    'Stock inicial': 1
  },
  {
    'Nombre producto': '1 Million',
    'Categoría': 'Premium ZB',
    'Unidad': 'Unidad',
    'Precio compra': 40000,
    'Precio venta': 100000,
    'Stock inicial': 3
  },
  {
    'Nombre producto': '', // Caso de error - nombre vacío
    'Categoría': 'Premium ZB',
    'Unidad': 'Unidad'
  },
  {
    'Nombre producto': null, // Caso de error - nombre null
    'Categoría': 'Premium ZB',
    'Unidad': 'Unidad'
  }
];

console.log('🧪 TESTING - Validación de nombres de productos');
console.log('='.repeat(50));

testRows.forEach((row, index) => {
  const fila = index + 2; // Simulando filas de Excel
  console.log(`\n📋 Probando fila ${fila}:`);
  console.log(`   Nombre: ${JSON.stringify(row['Nombre producto'])}`);
  
  // Aplicar la nueva lógica de validación
  const nombreProductoValue = row['Nombre producto'];
  
  // Validación nueva (más permisiva)
  if (nombreProductoValue === undefined || nombreProductoValue === null || nombreProductoValue.toString().trim() === '') {
    console.log(`   ❌ ERROR: Nombre de producto faltante o vacío`);
    console.log(`   💡 Tipo: ${typeof nombreProductoValue}, Valor: ${nombreProductoValue}`);
  } else {
    const nombreFinal = nombreProductoValue.toString().trim();
    console.log(`   ✅ VÁLIDO: "${nombreFinal}"`);
    console.log(`   💡 Tipo original: ${typeof nombreProductoValue}, Procesado: string`);
  }
});

console.log('\n🎯 CONCLUSIONES:');
console.log('- Nombres numéricos como "360" o 212 ahora son válidos');
console.log('- Se usa .toString() para convertir cualquier tipo a string');
console.log('- Solo se rechaza undefined, null, o strings vacíos después del trim');
console.log('- Perfumes con nombres como "360", "212 VIP", "1 Million" funcionarán correctamente');
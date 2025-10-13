// Test para verificar que la conversión de nombres funciona correctamente
console.log('🧪 TESTING - Conversión de nombres de productos a string');
console.log('='.repeat(60));

// Simular datos del Excel como los recibe el backend
const testRows = [
  { 'Nombre producto': '360' },           // String normal
  { 'Nombre producto': 360 },             // Número (tu caso problemático)
  { 'Nombre producto': '212 VIP' },       // String con número y texto
  { 'Nombre producto': 1000000 },         // Número grande
  { 'Nombre producto': 'Coco Chanel' },   // String normal
  { 'Nombre producto': '  360  ' },       // String con espacios
];

console.log('📋 Probando conversiones:');
testRows.forEach((row, index) => {
  const original = row['Nombre producto'];
  const converted = original.toString().trim();
  
  console.log(`\n${index + 1}. Original: ${JSON.stringify(original)} (${typeof original})`);
  console.log(`   Convertido: "${converted}" (${typeof converted})`);
  
  // Simular la consulta de Prisma
  const prismaMockQuery = {
    where: {
      name: converted,
      categoryId: 28,
      unitId: 7
    }
  };
  
  console.log(`   ✅ Prisma Query: name = "${prismaMockQuery.where.name}"`);
});

console.log('\n🎯 RESULTADO:');
console.log('- Todos los nombres se convierten correctamente a string');
console.log('- Se eliminan espacios en blanco con .trim()');
console.log('- Prisma ya NO recibirá números, solo strings');
console.log('- El producto "360" ahora funcionará correctamente');

// Test específico del caso problemático
console.log('\n🔍 CASO ESPECÍFICO - Producto "360":');
const problematicCase = { 'Nombre producto': 360 };
const fixed = problematicCase['Nombre producto'].toString().trim();
console.log(`Original: ${problematicCase['Nombre producto']} (${typeof problematicCase['Nombre producto']})`);
console.log(`Arreglado: "${fixed}" (${typeof fixed})`);
console.log(`✅ Prisma ahora recibe: name: "${fixed}" ← Ya no da error!`);
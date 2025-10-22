// Script para verificar el correcto manejo de fechas en el sistema
// Ejecutar: node scripts/verify-timezone-fix.js

const { parseLocalDate, startOfDay, endOfDay, formatLocalDate, getTodayLocal } = require('../dist/src/common/utils/timezone.util');

console.log('🧪 Verificando utilidades de timezone...\n');

// Test 1: parseLocalDate
console.log('1️⃣ Test parseLocalDate():');
const testDate1 = parseLocalDate('2024-10-15');
console.log(`   Input: "2024-10-15"`);
console.log(`   Output: ${testDate1}`);
console.log(`   Fecha local: ${testDate1.toLocaleDateString()}`);
console.log(`   ✅ Esperado: 15 de octubre de 2024\n`);

// Test 2: parseLocalDate con hora
console.log('2️⃣ Test parseLocalDate() con hora:');
const testDate2 = parseLocalDate('2024-10-15T14:30:00');
console.log(`   Input: "2024-10-15T14:30:00"`);
console.log(`   Output: ${testDate2}`);
console.log(`   Fecha y hora local: ${testDate2.toLocaleString()}`);
console.log(`   ✅ Esperado: 15 de octubre de 2024, 14:30\n`);

// Test 3: startOfDay
console.log('3️⃣ Test startOfDay():');
const testStart = startOfDay('2024-10-15');
console.log(`   Input: "2024-10-15"`);
console.log(`   Output: ${testStart}`);
console.log(`   Hora: ${testStart.toLocaleTimeString()}`);
console.log(`   ✅ Esperado: 00:00:00\n`);

// Test 4: endOfDay
console.log('4️⃣ Test endOfDay():');
const testEnd = endOfDay('2024-10-15');
console.log(`   Input: "2024-10-15"`);
console.log(`   Output: ${testEnd}`);
console.log(`   Hora: ${testEnd.toLocaleTimeString()}`);
console.log(`   ✅ Esperado: 23:59:59\n`);

// Test 5: formatLocalDate
console.log('5️⃣ Test formatLocalDate():');
const date = new Date(2024, 9, 15); // Mes 9 = Octubre (0-indexed)
const formatted = formatLocalDate(date);
console.log(`   Input: Date object (15 Oct 2024)`);
console.log(`   Output: ${formatted}`);
console.log(`   ✅ Esperado: "2024-10-15"\n`);

// Test 6: getTodayLocal
console.log('6️⃣ Test getTodayLocal():');
const today = getTodayLocal();
console.log(`   Output: ${today}`);
console.log(`   Fecha: ${today.toLocaleDateString()}`);
console.log(`   Hora: ${today.toLocaleTimeString()}`);
console.log(`   ✅ Esperado: Fecha de hoy con hora 12:00:00\n`);

// Test 7: Rango de fechas (caso de uso real)
console.log('7️⃣ Test rango de fechas (caso real):');
const rangeStart = startOfDay('2024-10-01');
const rangeEnd = endOfDay('2024-10-31');
console.log(`   Rango: Del 1 al 31 de octubre 2024`);
console.log(`   Start: ${rangeStart} (${rangeStart.toLocaleString()})`);
console.log(`   End: ${rangeEnd} (${rangeEnd.toLocaleString()})`);
console.log(`   ✅ Debería cubrir todo el mes de octubre\n`);

// Test 8: Verificar que no hay desfase de un día
console.log('8️⃣ Test desfase de día:');
const inputDate = '2024-10-01';
const parsed = parseLocalDate(inputDate);
const day = parsed.getDate();
console.log(`   Input: "${inputDate}"`);
console.log(`   Día parseado: ${day}`);
console.log(`   ${day === 1 ? '✅ CORRECTO' : '❌ ERROR: Hay desfase de día'}\n`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Verificación de utilidades completada');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Instrucciones para testing en API
console.log('📝 Para probar en la API:');
console.log('');
console.log('1. Crear un gasto:');
console.log('   POST /api/expenses');
console.log('   {');
console.log('     "date": "2024-10-15",');
console.log('     "amount": 50000,');
console.log('     "description": "Test timezone",');
console.log('     "category": "SERVICIOS",');
console.log('     "paymentMethod": "EFECTIVO"');
console.log('   }');
console.log('');
console.log('2. Verificar que se guardó con fecha correcta:');
console.log('   GET /api/expenses');
console.log('   - La fecha debe ser exactamente 2024-10-15');
console.log('');

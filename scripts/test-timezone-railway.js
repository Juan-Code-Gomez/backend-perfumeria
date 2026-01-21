/**
 * Script para verificar la configuración de timezone en Railway
 * Ejecutar con: railway run node scripts/test-timezone-railway.js
 */

console.log('\n🔍 ========== VERIFICACIÓN DE TIMEZONE EN RAILWAY ==========\n');

// 1. Variable de entorno
console.log('📌 1. VARIABLE DE ENTORNO:');
console.log(`   TZ = ${process.env.TZ || '❌ NO CONFIGURADA'}`);
console.log(`   NODE_ENV = ${process.env.NODE_ENV || 'development'}`);

// 2. Fecha y hora actual
console.log('\n📅 2. FECHA Y HORA ACTUAL:');
const now = new Date();
console.log(`   Date().toString() = ${now.toString()}`);
console.log(`   Date().toISOString() = ${now.toISOString()}`);
console.log(`   Date().toLocaleString('es-CO') = ${now.toLocaleString('es-CO')}`);
console.log(`   Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' }) = ${now.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);

// 3. Información del timezone
console.log('\n🌍 3. INFORMACIÓN DE TIMEZONE:');
console.log(`   Timezone Offset (minutos) = ${now.getTimezoneOffset()}`);
console.log(`   Timezone Offset (horas) = ${now.getTimezoneOffset() / 60}`);
console.log(`   ¿Es UTC-5? ${now.getTimezoneOffset() === 300 ? '✅ SÍ' : '❌ NO'}`);

// 4. Inicio y fin del día
console.log('\n🕐 4. INICIO Y FIN DEL DÍA (LOCAL):');
const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);
console.log(`   Inicio del día = ${startOfDay.toString()}`);
console.log(`   Inicio del día (ISO) = ${startOfDay.toISOString()}`);

const endOfDay = new Date();
endOfDay.setHours(23, 59, 59, 999);
console.log(`   Fin del día = ${endOfDay.toString()}`);
console.log(`   Fin del día (ISO) = ${endOfDay.toISOString()}`);

// 5. Test de parseLocalDate (simular la función)
console.log('\n🧪 5. TEST DE PARSEO DE FECHA:');
const testDate = '2026-01-19';
const parsed = new Date(testDate + 'T12:00:00'); // Simular parseLocalDate
console.log(`   Input: "${testDate}"`);
console.log(`   Parsed: ${parsed.toString()}`);
console.log(`   Día: ${parsed.getDate()}`);
console.log(`   Mes: ${parsed.getMonth() + 1}`);
console.log(`   Año: ${parsed.getFullYear()}`);

// 6. Comparación UTC vs Local
console.log('\n⚖️  6. COMPARACIÓN UTC VS LOCAL:');
console.log(`   Hora UTC: ${now.getUTCHours()}:${now.getUTCMinutes()}`);
console.log(`   Hora Local: ${now.getHours()}:${now.getMinutes()}`);
console.log(`   Diferencia: ${now.getHours() - now.getUTCHours()} horas`);

// 7. Casos problemáticos
console.log('\n⚠️  7. CASOS PROBLEMÁTICOS:');

// Caso 1: 2 AM en Colombia
const earlyMorning = new Date();
earlyMorning.setHours(2, 0, 0, 0);
console.log(`   Caso 1 - 2 AM Colombia:`);
console.log(`     Local: ${earlyMorning.toLocaleString('es-CO')}`);
console.log(`     UTC: ${earlyMorning.toISOString()}`);
console.log(`     Fecha guardada: ${earlyMorning.toISOString().split('T')[0]}`);

// Caso 2: 11 PM en Colombia
const lateNight = new Date();
lateNight.setHours(23, 0, 0, 0);
console.log(`   Caso 2 - 11 PM Colombia:`);
console.log(`     Local: ${lateNight.toLocaleString('es-CO')}`);
console.log(`     UTC: ${lateNight.toISOString()}`);
console.log(`     Fecha guardada: ${lateNight.toISOString().split('T')[0]}`);

// 8. Verificación final
console.log('\n✅ 8. VERIFICACIÓN FINAL:');
const isConfigured = process.env.TZ === 'America/Bogota';
const isCorrectOffset = now.getTimezoneOffset() === 300; // UTC-5 = 300 minutos

console.log(`   ¿Variable TZ configurada? ${isConfigured ? '✅ SÍ' : '❌ NO'}`);
console.log(`   ¿Offset correcto (UTC-5)? ${isCorrectOffset ? '✅ SÍ' : '❌ NO'}`);

if (isConfigured && isCorrectOffset) {
  console.log('\n🎉 ¡CONFIGURACIÓN CORRECTA! El sistema usa Colombia Standard Time.');
} else {
  console.log('\n❌ CONFIGURACIÓN INCORRECTA. Pasos para corregir:');
  console.log('   1. Railway Dashboard → Variables → Add: TZ=America/Bogota');
  console.log('   2. Esperar redeploy automático');
  console.log('   3. Ejecutar este script nuevamente');
}

console.log('\n========================================================\n');

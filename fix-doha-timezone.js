/**
 * Script de migración solo para DOHA
 * Corrige las fechas de cierres de caja que están desfasadas por timezone
 * 
 * Problema: Los cierres se guardaban en medianoche UTC, causando que aparezcan un día antes en Colombia (UTC-5)
 * Solución: Sumar 5 horas a cada fecha de cierre para que coincida con el día correcto
 * 
 * ESTE SCRIPT SOLO DEBE EJECUTARSE EN LA BASE DE DATOS DE DOHA
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:rOrTEiOgEyAuZDvAxtTBrdfCyaWGCVIq@ballast.proxy.rlwy.net:14597/railway'
    }
  }
});

async function fixDohaDates() {
  try {
    console.log('=' .repeat(60));
    console.log('🔧 DOHA TIMEZONE FIX - Cash Closing Dates Migration');
    console.log('=' .repeat(60));
    console.log('');
    
    // 1. Verificar que estamos en la base de datos correcta
    const config = await prisma.companyConfig.findFirst();
    console.log('📍 Company:', config.companyName);
    console.log('🌍 Configured Timezone:', config.timezone);
    console.log('');
    
    if (config.companyName !== 'Doha') {
      console.error('❌ ERROR: This script is ONLY for DOHA database!');
      console.error(`   Current database is for: ${config.companyName}`);
      console.error('   Aborting to prevent data corruption in other clients.');
      process.exit(1);
    }
    
    // 2. Obtener todos los cierres de caja
    const closings = await prisma.cashClosing.findMany({
      orderBy: { id: 'asc' }
    });
    
    console.log(`📊 Found ${closings.length} cash closings to fix\n`);
    
    if (closings.length === 0) {
      console.log('✅ No closings to fix. Exiting.');
      return;
    }
    
    // 3. Previsualizar los cambios
    console.log('📋 PREVIEW OF CHANGES:');
    console.log('-'.repeat(60));
    closings.forEach(closing => {
      const currentDate = new Date(closing.date);
      const fixedDate = new Date(currentDate.getTime() + (5 * 60 * 60 * 1000)); // +5 horas
      
      const currentLocal = currentDate.toLocaleString('es-CO', { timeZone: 'America/Bogota' });
      const fixedLocal = fixedDate.toLocaleString('es-CO', { timeZone: 'America/Bogota' });
      
      console.log(`Closing ID ${closing.id}:`);
      console.log(`  Current: ${currentDate.toISOString()} → Shown in Colombia as: ${currentLocal}`);
      console.log(`  Fixed:   ${fixedDate.toISOString()} → Will show in Colombia as: ${fixedLocal}`);
      console.log('');
    });
    
    // 4. Confirmar con el usuario (en producción, quitar esta parte)
    console.log('⚠️  WARNING: This will modify dates in the database!');
    console.log('   Press Ctrl+C to cancel or wait 5 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 5. Aplicar la corrección
    console.log('🔄 Applying fixes...\n');
    
    let fixed = 0;
    let errors = 0;
    
    for (const closing of closings) {
      try {
        const currentDate = new Date(closing.date);
        const fixedDate = new Date(currentDate.getTime() + (5 * 60 * 60 * 1000)); // +5 horas
        
        await prisma.cashClosing.update({
          where: { id: closing.id },
          data: { date: fixedDate }
        });
        
        fixed++;
        console.log(`✅ Fixed closing ID ${closing.id}`);
      } catch (error) {
        errors++;
        console.error(`❌ Error fixing closing ID ${closing.id}:`, error.message);
      }
    }
    
    console.log('');
    console.log('=' .repeat(60));
    console.log('📊 MIGRATION SUMMARY:');
    console.log(`   Total closings: ${closings.length}`);
    console.log(`   ✅ Fixed: ${fixed}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('=' .repeat(60));
    console.log('');
    
    // 6. Verificar resultado
    console.log('🔍 Verification - Sample of fixed dates:\n');
    const verifyClosings = await prisma.cashClosing.findMany({
      take: 5,
      orderBy: { id: 'desc' }
    });
    
    verifyClosings.forEach(closing => {
      const date = new Date(closing.date);
      const localDate = date.toLocaleString('es-CO', { timeZone: 'America/Bogota' });
      console.log(`Closing ID ${closing.id}: ${date.toISOString()} → ${localDate}`);
    });
    
    console.log('');
    console.log('✅ DOHA timezone fix completed successfully!');
    console.log('');
    
    // 7. Recomendaciones
    console.log('📝 NEXT STEPS:');
    console.log('1. Configure TZ environment variable in Railway:');
    console.log('   TZ=America/Bogota');
    console.log('2. Restart the application');
    console.log('3. Test creating a new cash closing to verify the fix');
    console.log('');
    
  } catch (error) {
    console.error('❌ FATAL ERROR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar migración
fixDohaDates()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

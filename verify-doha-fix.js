/**
 * Script de verificación post-fix para DOHA
 * Verifica que las fechas de cierres de caja estén correctas después de la migración
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:rOrTEiOgEyAuZDvAxtTBrdfCyaWGCVIq@ballast.proxy.rlwy.net:14597/railway'
    }
  }
});

async function verifyFix() {
  try {
    console.log('🔍 DOHA - Verification Report');
    console.log('='.repeat(60));
    console.log('');
    
    // 1. Verificar company
    const config = await prisma.companyConfig.findFirst();
    console.log('✅ Company:', config.companyName);
    console.log('✅ Timezone:', config.timezone);
    console.log('');
    
    // 2. Verificar últimos 5 cierres
    console.log('📊 Last 5 Cash Closings:');
    console.log('-'.repeat(60));
    
    const closings = await prisma.cashClosing.findMany({
      take: 5,
      orderBy: { id: 'desc' },
      select: {
        id: true,
        date: true,
        totalSales: true,
        createdAt: true,
      }
    });
    
    let allCorrect = true;
    
    closings.forEach(closing => {
      const date = new Date(closing.date);
      const createdAt = new Date(closing.createdAt);
      
      // Convertir a Colombia timezone
      const dateInColombia = date.toLocaleString('es-CO', { 
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      
      const createdInColombia = createdAt.toLocaleString('es-CO', { 
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      
      // Extraer fecha del cierre (sin hora)
      const closingDate = dateInColombia.split(',')[0].trim();
      const creationDate = createdInColombia.split(',')[0].trim();
      
      // Verificar que la fecha del cierre coincida con la fecha de creación
      const datesMatch = closingDate === creationDate;
      const status = datesMatch ? '✅' : '❌';
      
      console.log(`${status} Closing #${closing.id}:`);
      console.log(`   Date field: ${dateInColombia}`);
      console.log(`   Created at: ${createdInColombia}`);
      console.log(`   Sales: $${closing.totalSales.toLocaleString()}`);
      
      if (!datesMatch) {
        console.log(`   ⚠️  WARNING: Date mismatch! Closing date (${closingDate}) != Creation date (${creationDate})`);
        allCorrect = false;
      }
      
      console.log('');
    });
    
    // 3. Verificar que no haya fechas a las 7 PM (indicador de problema)
    console.log('🔎 Checking for problematic dates (7 PM indicators)...');
    const problematicClosings = closings.filter(closing => {
      const date = new Date(closing.date);
      const dateStr = date.toLocaleString('es-CO', { 
        timeZone: 'America/Bogota',
        hour: '2-digit',
        minute: '2-digit',
      });
      return dateStr.includes('19:00') || dateStr.includes('7:00 p');
    });
    
    if (problematicClosings.length > 0) {
      console.log(`❌ Found ${problematicClosings.length} closings with 7 PM dates (still problematic)`);
      allCorrect = false;
    } else {
      console.log('✅ No problematic 7 PM dates found');
    }
    console.log('');
    
    // 4. Resumen final
    console.log('='.repeat(60));
    if (allCorrect) {
      console.log('✅ ALL CHECKS PASSED - DOHA dates are correct!');
      console.log('');
      console.log('📝 Next steps:');
      console.log('   1. Test creating a new cash closing');
      console.log('   2. Verify it shows the correct date');
      console.log('   3. Filter sales by date and verify results');
    } else {
      console.log('❌ SOME CHECKS FAILED - Review warnings above');
      console.log('');
      console.log('🔧 Troubleshooting:');
      console.log('   1. Make sure TZ=America/Bogota is set in Railway');
      console.log('   2. Restart the Railway service');
      console.log('   3. Re-run the migration script');
      console.log('   4. Run this verification script again');
    }
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyFix();

// Script para analizar las fechas en la base de datos de DOHA
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:rOrTEiOgEyAuZDvAxtTBrdfCyaWGCVIq@ballast.proxy.rlwy.net:14597/railway'
    }
  }
});

async function analyzeDates() {
  try {
    console.log('🔍 Analyzing DOHA database dates...\n');
    
    // 1. Verificar configuración de timezone
    console.log('1️⃣ Company Configuration:');
    const config = await prisma.companyConfig.findFirst();
    console.log({
      companyName: config.companyName,
      timezone: config.timezone,
      dateFormat: config.dateFormat,
    });
    console.log('');
    
    // 2. Verificar el timezone de PostgreSQL
    console.log('2️⃣ PostgreSQL Timezone Setting:');
    const tzResult = await prisma.$queryRaw`SHOW TIMEZONE;`;
    console.log(tzResult);
    console.log('');
    
    // 3. Ver las últimas 10 ventas con sus fechas
    console.log('3️⃣ Last 10 Sales with date analysis:');
    const sales = await prisma.sale.findMany({
      take: 10,
      orderBy: { id: 'desc' },
      select: {
        id: true,
        date: true,
        totalAmount: true,
        paymentMethod: true,
        createdAt: true,
      }
    });
    
    sales.forEach(sale => {
      const date = new Date(sale.date);
      const createdAt = new Date(sale.createdAt);
      console.log(`Sale #${sale.id}:`);
      console.log(`  Date field (UTC): ${sale.date.toISOString()}`);
      console.log(`  Date field (Local): ${date.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
      console.log(`  Created At (UTC): ${sale.createdAt.toISOString()}`);
      console.log(`  Created At (Local): ${createdAt.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
      console.log(`  Amount: $${sale.totalAmount} - ${sale.paymentMethod}`);
      console.log('');
    });
    
    // 4. Ver los cierres de caja
    console.log('4️⃣ Cash Closings:');
    const closings = await prisma.cashClosing.findMany({
      take: 5,
      orderBy: { id: 'desc' },
      select: {
        id: true,
        date: true,
        openingCash: true,
        closingCash: true,
        totalSales: true,
        createdAt: true,
      }
    });
    
    closings.forEach(closing => {
      const date = new Date(closing.date);
      const createdAt = new Date(closing.createdAt);
      console.log(`Cash Closing #${closing.id}:`);
      console.log(`  Date field (UTC): ${closing.date.toISOString()}`);
      console.log(`  Date field (Local Colombia): ${date.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
      console.log(`  Created At (UTC): ${closing.createdAt.toISOString()}`);
      console.log(`  Created At (Local): ${createdAt.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
      console.log(`  Opening: $${closing.openingCash} → Closing: $${closing.closingCash}`);
      console.log(`  Total Sales: $${closing.totalSales}`);
      console.log('');
    });
    
    // 5. Ver ventas del 01/03/2026 (la fecha que aparece en la imagen)
    console.log('5️⃣ Sales for March 1, 2026:');
    const march1Start = new Date('2026-03-01T00:00:00-05:00'); // Colombia time
    const march1End = new Date('2026-03-01T23:59:59-05:00');
    console.log(`Searching from ${march1Start.toISOString()} to ${march1End.toISOString()}`);
    
    const march1Sales = await prisma.sale.findMany({
      where: {
        date: {
          gte: march1Start,
          lte: march1End,
        }
      },
      select: {
        id: true,
        date: true,
        totalAmount: true,
        paymentMethod: true,
      }
    });
    
    console.log(`Found ${march1Sales.length} sales for March 1, 2026`);
    march1Sales.forEach(sale => {
      const date = new Date(sale.date);
      console.log(`  Sale #${sale.id} - ${date.toLocaleString('es-CO', { timeZone: 'America/Bogota' })} - $${sale.totalAmount}`);
    });
    console.log('');
    
    // 6. Ver la diferencia de horas entre UTC y local
    console.log('6️⃣ Timezone Analysis:');
    const now = new Date();
    console.log(`Current time (Server): ${now.toISOString()}`);
    console.log(`Current time (Colombia): ${now.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
    const offsetMinutes = now.getTimezoneOffset();
    const offsetHours = offsetMinutes / 60;
    console.log(`Server timezone offset: ${offsetHours} hours from UTC`);
    console.log('Colombian timezone is UTC-5');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeDates();

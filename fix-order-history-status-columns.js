const { PrismaClient } = require('@prisma/client');

const databases = [
  {
    name: 'Parfum (turntable)',
    url: 'postgresql://postgres:sramdnCvXZjwgHUZBUBvkvWGSvRuGgrZ@turntable.proxy.rlwy.net:38668/railway'
  },
  {
    name: 'Mundo Perfumes',
    url: 'postgresql://postgres:wGcAKDSKDggpmWPulURTqPDEYOPovsPy@trolley.proxy.rlwy.net:45234/railway'
  },
  {
    name: 'DOHA',
    url: 'postgresql://postgres:rOrTEiOgEyAuZDvAxtTBrdfCyaWGCVIq@ballast.proxy.rlwy.net:14597/railway'
  },
  {
    name: 'Milan Fragancias',
    url: 'postgresql://postgres:huyVrrXIlyNOWCIXYnMuHNSACuYhDbog@tramway.proxy.rlwy.net:58936/railway'
  }
];

async function applyFix() {
  console.log('🔧 Agregando columnas previousStatus y newStatus a order_history\n');

  for (const db of databases) {
    console.log(`📊 Procesando base de datos: ${db.name}`);
    const prisma = new PrismaClient({
      datasources: { db: { url: db.url } }
    });

    try {
      // Verificar si las columnas ya existen
      const columnsResult = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'order_history' 
        AND column_name IN ('previousStatus', 'newStatus');
      `;

      const existingColumns = columnsResult.map(row => row.column_name);
      
      if (existingColumns.includes('previousStatus') && existingColumns.includes('newStatus')) {
        console.log(`  ℹ️  ${db.name}: Columnas ya existen\n`);
      } else {
        console.log(`  ↻ Agregando columnas faltantes...`);
        
        // Agregar previousStatus si no existe
        if (!existingColumns.includes('previousStatus')) {
          await prisma.$executeRaw`
            ALTER TABLE order_history 
            ADD COLUMN IF NOT EXISTS "previousStatus" TEXT;
          `;
          console.log(`  ✓ previousStatus agregada`);
        }
        
        // Agregar newStatus si no existe
        if (!existingColumns.includes('newStatus')) {
          await prisma.$executeRaw`
            ALTER TABLE order_history 
            ADD COLUMN IF NOT EXISTS "newStatus" TEXT;
          `;
          console.log(`  ✓ newStatus agregada`);
        }
        
        console.log(`  ✅ ${db.name}: Columnas agregadas exitosamente\n`);
      }
    } catch (error) {
      console.error(`  ❌ ${db.name}: Error al aplicar fix`);
      console.error(`     ${error.message}\n`);
    } finally {
      await prisma.$disconnect();
    }
  }

  console.log('✅ Proceso completado');
}

applyFix()
  .catch(console.error)
  .finally(() => process.exit(0));

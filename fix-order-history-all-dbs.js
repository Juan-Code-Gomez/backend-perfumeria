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
  console.log('🔧 Aplicando fix de columna order_history.timestamp → createdAt\n');

  for (const db of databases) {
    if (!db.url) {
      console.log(`⚠️  ${db.name}: URL no configurada, saltando...`);
      continue;
    }

    console.log(`📊 Procesando base de datos: ${db.name}`);
    const prisma = new PrismaClient({
      datasources: { db: { url: db.url } }
    });

    try {
      // Verificar si la columna timestamp existe
      const result = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'order_history' 
        AND column_name = 'timestamp';
      `;

      if (result.length > 0) {
        console.log(`  ↻ Renombrando timestamp → createdAt...`);
        
        await prisma.$executeRaw`
          ALTER TABLE order_history RENAME COLUMN timestamp TO "createdAt";
        `;
        
        console.log(`  ✅ ${db.name}: Columna renombrada exitosamente\n`);
      } else {
        console.log(`  ℹ️  ${db.name}: Columna ya fue renombrada o no existe\n`);
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

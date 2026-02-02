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
  console.log('🔧 Cambiando tipo de columna changes de JSON a TEXT en order_history\n');

  for (const db of databases) {
    console.log(`📊 Procesando base de datos: ${db.name}`);
    const prisma = new PrismaClient({
      datasources: { db: { url: db.url } }
    });

    try {
      // Verificar el tipo actual de la columna changes
      const columnInfo = await prisma.$queryRaw`
        SELECT data_type, udt_name
        FROM information_schema.columns 
        WHERE table_name = 'order_history' 
        AND column_name = 'changes';
      `;

      if (columnInfo.length === 0) {
        console.log(`  ⚠️  ${db.name}: Columna changes no existe\n`);
        continue;
      }

      const dataType = columnInfo[0].data_type;
      const udtName = columnInfo[0].udt_name;
      
      console.log(`  ℹ️  Tipo actual: ${dataType} (${udtName})`);
      
      if (dataType === 'json' || dataType === 'jsonb' || udtName === 'json' || udtName === 'jsonb') {
        console.log(`  ↻ Convirtiendo JSON a TEXT...`);
        
        // Cambiar de JSON a TEXT, convirtiendo los valores existentes
        await prisma.$executeRaw`
          ALTER TABLE order_history 
          ALTER COLUMN changes TYPE TEXT 
          USING CASE 
            WHEN changes IS NULL THEN NULL
            ELSE changes::TEXT
          END;
        `;
        
        console.log(`  ✅ ${db.name}: Columna changes convertida a TEXT\n`);
      } else if (dataType === 'text' || udtName === 'text') {
        console.log(`  ℹ️  ${db.name}: Columna ya es de tipo TEXT\n`);
      } else {
        console.log(`  ⚠️  ${db.name}: Tipo desconocido: ${dataType}\n`);
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

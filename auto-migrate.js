// auto-migrate.js - Sistema automático de migraciones para Railway
// Se ejecuta automáticamente en cada deploy ANTES de iniciar el servidor
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Lista de migraciones a aplicar (agregar nuevas al final)
const migrations = [
  {
    name: 'add_useFifoInventory',
    description: 'Agregar campo useFifoInventory a company_config',
    check: async (prisma) => {
      try {
        // Intentar leer el campo - si falla, no existe
        await prisma.$queryRaw`SELECT "useFifoInventory" FROM company_config LIMIT 1`;
        return true; // Existe
      } catch (error) {
        return false; // No existe
      }
    },
    apply: async (prisma) => {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE company_config 
        ADD COLUMN IF NOT EXISTS "useFifoInventory" BOOLEAN NOT NULL DEFAULT true;
      `);
      console.log('   ✅ Campo useFifoInventory agregado');
    }
  },
  // Agregar futuras migraciones aquí...
];

async function runAutoMigrations() {
  console.log('\n🔄 Ejecutando auto-migraciones...\n');

  try {
    await prisma.$connect();
    console.log('✅ Conexión a base de datos exitosa\n');

    let migrationsApplied = 0;
    let migrationsSkipped = 0;

    for (const migration of migrations) {
      try {
        console.log(`📝 Verificando: ${migration.name}`);
        console.log(`   Descripción: ${migration.description}`);

        const exists = await migration.check(prisma);

        if (exists) {
          console.log(`   ⏭️  Ya aplicada - saltando\n`);
          migrationsSkipped++;
          continue;
        }

        console.log(`   🔧 Aplicando migración...`);
        await migration.apply(prisma);
        console.log(`   ✅ Migración aplicada exitosamente\n`);
        migrationsApplied++;

      } catch (error) {
        console.error(`   ❌ Error en migración ${migration.name}:`);
        console.error(`   ${error.message}\n`);
        // Continuar con las siguientes migraciones
      }
    }

    console.log('═'.repeat(60));
    console.log('📊 RESUMEN DE AUTO-MIGRACIONES');
    console.log('═'.repeat(60));
    console.log(`✅ Aplicadas:  ${migrationsApplied}`);
    console.log(`⏭️  Saltadas:   ${migrationsSkipped}`);
    console.log(`📝 Total:      ${migrations.length}`);
    console.log('═'.repeat(60));
    console.log('✅ Sistema listo para iniciar\n');

  } catch (error) {
    console.error('\n❌ Error fatal en auto-migración:', error.message);
    console.error('⚠️  El servidor continuará iniciándose...\n');
    // NO fallar el deploy - mejor tener el servicio corriendo
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runAutoMigrations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error:', error);
      process.exit(0); // Exit 0 para no fallar el deploy
    });
}

module.exports = { runAutoMigrations };

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
  {
    name: 'add_multi_tenant_tables',
    description: 'Crear tablas Feature, TenantFeature y TenantCustomField',
    check: async (prisma) => {
      try {
        await prisma.$queryRaw`SELECT 1 FROM "Feature" LIMIT 1`;
        return true;
      } catch (error) {
        return false;
      }
    },
    apply: async (prisma) => {
      // Ejecutar cada comando por separado (PostgreSQL no permite múltiples en uno)
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Feature" (
          "id" SERIAL PRIMARY KEY,
          "code" TEXT NOT NULL UNIQUE,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "module" TEXT NOT NULL,
          "is_active" BOOLEAN NOT NULL DEFAULT true,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "TenantFeature" (
          "id" SERIAL PRIMARY KEY,
          "tenant_id" INTEGER NOT NULL,
          "feature_id" INTEGER NOT NULL,
          "is_enabled" BOOLEAN NOT NULL DEFAULT true,
          "config" JSONB,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "TenantFeature_tenant_feature_unique" UNIQUE ("tenant_id", "feature_id")
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "TenantCustomField" (
          "id" SERIAL PRIMARY KEY,
          "tenant_id" INTEGER NOT NULL,
          "module" TEXT NOT NULL,
          "field_name" TEXT NOT NULL,
          "field_label" TEXT NOT NULL,
          "field_type" TEXT NOT NULL,
          "is_required" BOOLEAN NOT NULL DEFAULT false,
          "default_value" TEXT,
          "options" JSONB,
          "validation_rules" JSONB,
          "display_order" INTEGER NOT NULL DEFAULT 0,
          "is_active" BOOLEAN NOT NULL DEFAULT true,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "TenantCustomField_tenant_module_field_unique" UNIQUE ("tenant_id", "module", "field_name")
        )
      `);

      // Foreign keys para TenantFeature
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "TenantFeature" DROP CONSTRAINT IF EXISTS "TenantFeature_tenant_id_fkey"`);
      } catch (e) { /* ignore */ }
      
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "TenantFeature" DROP CONSTRAINT IF EXISTS "TenantFeature_feature_id_fkey"`);
      } catch (e) { /* ignore */ }

      await prisma.$executeRawUnsafe(`
        ALTER TABLE "TenantFeature" 
        ADD CONSTRAINT "TenantFeature_tenant_id_fkey" 
        FOREIGN KEY ("tenant_id") REFERENCES "company_config"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE
      `);

      await prisma.$executeRawUnsafe(`
        ALTER TABLE "TenantFeature" 
        ADD CONSTRAINT "TenantFeature_feature_id_fkey" 
        FOREIGN KEY ("feature_id") REFERENCES "Feature"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE
      `);

      // Foreign key para TenantCustomField
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "TenantCustomField" DROP CONSTRAINT IF EXISTS "TenantCustomField_tenant_id_fkey"`);
      } catch (e) { /* ignore */ }

      await prisma.$executeRawUnsafe(`
        ALTER TABLE "TenantCustomField"
        ADD CONSTRAINT "TenantCustomField_tenant_id_fkey" 
        FOREIGN KEY ("tenant_id") REFERENCES "company_config"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE
      `);

      // Índices
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "TenantFeature_tenant_id_idx" ON "TenantFeature"("tenant_id")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "TenantFeature_feature_id_idx" ON "TenantFeature"("feature_id")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "TenantCustomField_tenant_id_idx" ON "TenantCustomField"("tenant_id")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Feature_code_idx" ON "Feature"("code")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Feature_module_idx" ON "Feature"("module")`);

      console.log('   ✅ Tablas de multi-tenancy creadas');
    }
  },
  {
    name: 'add_tenant_fields_to_company_config',
    description: 'Agregar campos tenant_code, tenant_name, industry, plan a company_config',
    check: async (prisma) => {
      try {
        await prisma.$queryRaw`SELECT "tenant_code" FROM company_config LIMIT 1`;
        return true;
      } catch (error) {
        return false;
      }
    },
    apply: async (prisma) => {
      await prisma.$executeRawUnsafe(`ALTER TABLE company_config ADD COLUMN IF NOT EXISTS "tenant_code" TEXT`);
      await prisma.$executeRawUnsafe(`ALTER TABLE company_config ADD COLUMN IF NOT EXISTS "tenant_name" TEXT`);
      await prisma.$executeRawUnsafe(`ALTER TABLE company_config ADD COLUMN IF NOT EXISTS "industry" TEXT`);
      await prisma.$executeRawUnsafe(`ALTER TABLE company_config ADD COLUMN IF NOT EXISTS "plan" TEXT DEFAULT 'FREE'`);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "company_config_tenant_code_key" ON "company_config"("tenant_code")`);
      console.log('   ✅ Campos de tenant agregados a company_config');
    }
  },
  {
    name: 'add_tenant_id_to_users',
    description: 'Agregar columna tenant_id a tabla users',
    check: async (prisma) => {
      try {
        await prisma.$queryRaw`SELECT "tenant_id" FROM users LIMIT 1`;
        return true;
      } catch (error) {
        return false;
      }
    },
    apply: async (prisma) => {
      await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "tenant_id" INTEGER`);
      
      // Drop constraint si existe
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE users DROP CONSTRAINT IF EXISTS "User_tenant_id_fkey"`);
      } catch (e) { /* ignore */ }
      
      await prisma.$executeRawUnsafe(`
        ALTER TABLE users
        ADD CONSTRAINT "User_tenant_id_fkey" 
        FOREIGN KEY ("tenant_id") REFERENCES "company_config"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE
      `);
      
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "User_tenant_id_idx" ON "users"("tenant_id")`);
      console.log('   ✅ Campo tenant_id agregado a users');
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

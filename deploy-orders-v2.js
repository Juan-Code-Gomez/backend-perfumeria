/**
 * Script de Deployment del Módulo de Pedidos - Versión 2
 * Ejecuta cada statement SQL por separado
 */

const { PrismaClient } = require('@prisma/client');

// Configuración de clientes
const CLIENTS = [
  {
    name: 'Cliente 1 - Tramway',
    dbUrl: 'postgresql://postgres:huyVrrXIlyNOWCIXYnMuHNSACuYhDbog@tramway.proxy.rlwy.net:58936/railway'
  },
  {
    name: 'Cliente 2 - Shinkansen',
    dbUrl: 'postgresql://postgres:SJBYEwPzlxYkrgMupzDOWYTAUXICMCHT@shinkansen.proxy.rlwy.net:21931/railway'
  },
  {
    name: 'Cliente 3 - Turntable',
    dbUrl: 'postgresql://postgres:sramdnCvXZjwgHUZBUBvkvWGSvRuGgrZ@turntable.proxy.rlwy.net:38668/railway'
  }
];

// Configuración de permisos
const PERMISSIONS_CONFIG = {
  'ADMIN': { canView: true, canCreate: true, canEdit: true, canDelete: true },
  'SUPER_ADMIN': { canView: true, canCreate: true, canEdit: true, canDelete: true },
  'CAJERO': { canView: true, canCreate: true, canEdit: true, canDelete: false },
  'BODEGA': { canView: true, canCreate: true, canEdit: false, canDelete: false },
  'VENDEDOR': { canView: true, canCreate: true, canEdit: false, canDelete: false },
};

async function runMigration(client) {
  console.log(`\n📦 Ejecutando migración para ${client.name}...`);
  
  const prisma = new PrismaClient({
    datasources: { db: { url: client.dbUrl } }
  });

  try {
    // 1. Crear tabla orders
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" SERIAL NOT NULL,
        "orderNumber" VARCHAR(50) NOT NULL,
        "clientId" INTEGER NOT NULL,
        "userId" INTEGER NOT NULL,
        "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deliveryDate" TIMESTAMP(3),
        "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('  ✅ Tabla orders creada');

    // 2. Crear tabla order_details
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "order_details" (
        "id" SERIAL NOT NULL,
        "orderId" INTEGER NOT NULL,
        "productId" INTEGER NOT NULL,
        "quantity" INTEGER NOT NULL,
        "unitPrice" DOUBLE PRECISION NOT NULL,
        "subtotal" DOUBLE PRECISION NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "order_details_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('  ✅ Tabla order_details creada');

    // 3. Crear tabla order_history
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "order_history" (
        "id" SERIAL NOT NULL,
        "orderId" INTEGER NOT NULL,
        "userId" INTEGER NOT NULL,
        "action" VARCHAR(20) NOT NULL,
        "previousStatus" VARCHAR(20),
        "newStatus" VARCHAR(20),
        "changes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "order_history_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('  ✅ Tabla order_history creada');

    // 4. Crear índices
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "orders_orderNumber_key" ON "orders"("orderNumber");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "orders_clientId_idx" ON "orders"("clientId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "orders_userId_idx" ON "orders"("userId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders"("status");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "orders_orderDate_idx" ON "orders"("orderDate");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "order_details_orderId_idx" ON "order_details"("orderId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "order_details_productId_idx" ON "order_details"("productId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "order_history_orderId_idx" ON "order_history"("orderId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "order_history_userId_idx" ON "order_history"("userId");`);
    console.log('  ✅ Índices creados');

    // 5. Agregar foreign keys
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_clientId_fkey') THEN
          ALTER TABLE "orders" ADD CONSTRAINT "orders_clientId_fkey" 
          FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_userId_fkey') THEN
          ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" 
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_details_orderId_fkey') THEN
          ALTER TABLE "order_details" ADD CONSTRAINT "order_details_orderId_fkey" 
          FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_details_productId_fkey') THEN
          ALTER TABLE "order_details" ADD CONSTRAINT "order_details_productId_fkey" 
          FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_history_orderId_fkey') THEN
          ALTER TABLE "order_history" ADD CONSTRAINT "order_history_orderId_fkey" 
          FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_history_userId_fkey') THEN
          ALTER TABLE "order_history" ADD CONSTRAINT "order_history_userId_fkey" 
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
    console.log('  ✅ Foreign keys agregadas');

    // 6. Agregar columna reservedStock
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Product' AND column_name = 'reservedStock'
        ) THEN
          ALTER TABLE "Product" ADD COLUMN "reservedStock" DOUBLE PRECISION NOT NULL DEFAULT 0;
        END IF;
      END $$;
    `);
    console.log('  ✅ Columna reservedStock agregada');

    // 7. Registrar migración
    const existingMigration = await prisma.$queryRaw`
      SELECT id FROM "_prisma_migrations" 
      WHERE migration_name = '20251105000001_add_orders_module';
    `;
    
    if (existingMigration.length === 0) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
        VALUES (
          gen_random_uuid()::text,
          '0',
          NOW(),
          '20251105000001_add_orders_module',
          NULL,
          NULL,
          NOW(),
          1
        );
      `);
      console.log('  ✅ Migración registrada');
    } else {
      console.log('  ℹ️  Migración ya estaba registrada');
    }

    await prisma.$disconnect();
    console.log('✅ Migración completada exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    return false;
  }
}

async function setupOrdersModule(client) {
  console.log(`\n🔧 Configurando módulo de pedidos para ${client.name}...`);
  
  const prisma = new PrismaClient({
    datasources: { db: { url: client.dbUrl } }
  });

  try {
    const moduleResult = await prisma.$queryRaw`
      INSERT INTO system_modules (name, "displayName", icon, route, description, "isActive", "order", "createdAt", "updatedAt")
      VALUES ('pedidos', 'Gestión de Pedidos', 'FileTextOutlined', '/orders', 'Módulo para gestionar pedidos de clientes con reserva de stock', true, 10, NOW(), NOW())
      ON CONFLICT (name) 
      DO UPDATE SET 
        "displayName" = 'Gestión de Pedidos',
        icon = 'FileTextOutlined',
        route = '/orders',
        description = 'Módulo para gestionar pedidos de clientes con reserva de stock',
        "updatedAt" = NOW()
      RETURNING id;
    `;

    const moduleId = moduleResult[0].id;
    console.log('✅ Módulo creado, ID:', moduleId);

    const roles = await prisma.$queryRaw`SELECT id, name FROM "Role";`;
    console.log(`📋 Roles encontrados: ${roles.length}`);

    for (const role of roles) {
      const config = PERMISSIONS_CONFIG[role.name];
      if (config) {
        await prisma.$queryRaw`
          INSERT INTO module_permissions ("moduleId", "roleId", "canView", "canCreate", "canEdit", "canDelete", "canExport", "createdAt", "updatedAt")
          VALUES (${moduleId}, ${role.id}, ${config.canView}, ${config.canCreate}, ${config.canEdit}, ${config.canDelete}, false, NOW(), NOW())
          ON CONFLICT ("moduleId", "roleId") 
          DO UPDATE SET 
            "canView" = ${config.canView},
            "canCreate" = ${config.canCreate},
            "canEdit" = ${config.canEdit},
            "canDelete" = ${config.canDelete},
            "updatedAt" = NOW();
        `;
        console.log(`  ✅ Permisos para ${role.name}`);
      }
    }

    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    return false;
  }
}

async function deployToClient(client) {
  console.log('\n' + '='.repeat(60));
  console.log(`🚀 ${client.name}`);
  console.log('='.repeat(60));

  const migrationOk = await runMigration(client);
  if (!migrationOk) return false;

  const moduleOk = await setupOrdersModule(client);
  if (!moduleOk) return false;

  console.log(`\n✅ COMPLETADO: ${client.name}`);
  return true;
}

async function main() {
  console.log('\n📦 DEPLOYMENT DEL MÓDULO DE PEDIDOS\n');
  
  const results = { success: [], failed: [] };

  for (const client of CLIENTS) {
    const success = await deployToClient(client);
    (success ? results.success : results.failed).push(client.name);
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN');
  console.log('='.repeat(60));
  console.log(`\n✅ Exitosos: ${results.success.length}`);
  results.success.forEach(n => console.log(`  - ${n}`));
  
  if (results.failed.length > 0) {
    console.log(`\n❌ Fallidos: ${results.failed.length}`);
    results.failed.forEach(n => console.log(`  - ${n}`));
  }
  
  console.log('\n🏁 Completado\n');
}

main().catch(console.error);

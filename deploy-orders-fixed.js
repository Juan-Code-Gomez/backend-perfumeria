/**
 * Script de Deployment del Módulo de Pedidos a Producción - CORREGIDO
 * 
 * Este script:
 * 1. Ejecuta la migración del módulo de pedidos en cada cliente
 * 2. Verifica que las tablas se hayan creado correctamente
 * 3. Crea permisos para todos los roles
 * 
 * Ejecutar con: node deploy-orders-fixed.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

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

// Configuración de permisos por rol
const PERMISSIONS_CONFIG = {
  'ADMIN': {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },
  'SUPER_ADMIN': {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },
  'CAJERO': {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: false,
  },
  'BODEGA': {
    canView: true,
    canCreate: true,
    canEdit: false,
    canDelete: false,
  },
  'VENDEDOR': {
    canView: true,
    canCreate: true,
    canEdit: false,
    canDelete: false,
  },
};

/**
 * Ejecutar la migración SQL directamente
 */
async function runMigration(client) {
  console.log(`\n📦 Ejecutando migración para ${client.name}...`);
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: client.dbUrl
      }
    }
  });

  try {
    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, 'prisma', 'migrations', '20251105000001_add_orders_module', 'migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    // Ejecutar la migración
    await prisma.$executeRawUnsafe(migrationSQL);
    
    console.log('✅ Migración ejecutada exitosamente');
    
    // Registrar la migración en _prisma_migrations
    await prisma.$executeRaw`
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
      )
      ON CONFLICT (migration_name) DO NOTHING;
    `;
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('❌ Error al ejecutar migración:', error.message);
    await prisma.$disconnect();
    return false;
  }
}

/**
 * Verificar que las tablas se crearon
 */
async function verifyTables(client) {
  console.log(`\n🔍 Verificando tablas en ${client.name}...`);
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: client.dbUrl
      }
    }
  });

  try {
    const tables = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' AND tablename IN ('orders', 'order_details', 'order_history')
      ORDER BY tablename;
    `;
    
    if (tables.length === 3) {
      console.log('✅ Todas las tablas creadas correctamente:');
      tables.forEach(t => console.log(`  - ${t.tablename}`));
      
      // Verificar columna reservedStock
      const productColumns = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns
        WHERE table_name = 'Product' AND column_name = 'reservedStock';
      `;
      
      if (productColumns.length > 0) {
        console.log('✅ Columna reservedStock agregada a Product');
      } else {
        console.log('⚠️  Columna reservedStock NO encontrada en Product');
      }
    } else {
      console.log(`❌ Solo ${tables.length}/3 tablas encontradas`);
    }
    
    await prisma.$disconnect();
    return tables.length === 3;
  } catch (error) {
    console.error('❌ Error al verificar tablas:', error.message);
    await prisma.$disconnect();
    return false;
  }
}

/**
 * Configurar módulo de pedidos para un cliente
 */
async function setupOrdersModule(client) {
  console.log(`\n🔧 Configurando módulo de pedidos para ${client.name}...`);
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: client.dbUrl
      }
    }
  });

  try {
    // 1. Crear o actualizar el módulo de Pedidos usando las tablas con snake_case
    const moduleResult = await prisma.$queryRaw`
      INSERT INTO system_modules (name, "displayName", icon, route, description)
      VALUES ('pedidos', 'Gestión de Pedidos', 'FileTextOutlined', '/orders', 'Módulo para gestionar pedidos de clientes con reserva de stock')
      ON CONFLICT (name) 
      DO UPDATE SET 
        "displayName" = 'Gestión de Pedidos',
        icon = 'FileTextOutlined',
        route = '/orders',
        description = 'Módulo para gestionar pedidos de clientes con reserva de stock'
      RETURNING id;
    `;

    const moduleId = moduleResult[0].id;
    console.log('✅ Módulo creado/actualizado, ID:', moduleId);

    // 2. Obtener todos los roles
    const roles = await prisma.$queryRaw`SELECT id, name FROM "Role";`;
    console.log(`📋 Roles encontrados: ${roles.length}`);

    // 3. Asignar permisos a cada rol
    for (const role of roles) {
      const config = PERMISSIONS_CONFIG[role.name];
      
      if (config) {
        await prisma.$queryRaw`
          INSERT INTO module_permissions ("moduleId", "roleId", "canView", "canCreate", "canEdit", "canDelete")
          VALUES (${moduleId}, ${role.id}, ${config.canView}, ${config.canCreate}, ${config.canEdit}, ${config.canDelete})
          ON CONFLICT ("moduleId", "roleId") 
          DO UPDATE SET 
            "canView" = ${config.canView},
            "canCreate" = ${config.canCreate},
            "canEdit" = ${config.canEdit},
            "canDelete" = ${config.canDelete};
        `;
        
        console.log(`  ✅ Permisos asignados para ${role.name}`);
      }
    }

    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('❌ Error al configurar módulo:', error.message);
    console.error('Stack:', error.stack);
    await prisma.$disconnect();
    return false;
  }
}

/**
 * Deployment completo para un cliente
 */
async function deployToClient(client) {
  console.log('\n' + '='.repeat(60));
  console.log(`🚀 INICIANDO DEPLOYMENT EN: ${client.name}`);
  console.log('='.repeat(60));

  const migrationSuccess = await runMigration(client);
  if (!migrationSuccess) {
    console.log(`\n❌ Deployment falló en ${client.name} - Migración`);
    return false;
  }

  const tablesOk = await verifyTables(client);
  if (!tablesOk) {
    console.log(`\n⚠️  Deployment incompleto en ${client.name} - Tablas`);
    return false;
  }

  const moduleOk = await setupOrdersModule(client);
  if (!moduleOk) {
    console.log(`\n❌ Deployment falló en ${client.name} - Módulo`);
    return false;
  }

  console.log(`\n✅ DEPLOYMENT COMPLETADO EN: ${client.name}`);
  return true;
}

/**
 * Main - Ejecutar deployment en todos los clientes
 */
async function main() {
  console.log('\n📦 DEPLOYMENT DEL MÓDULO DE PEDIDOS A PRODUCCIÓN');
  console.log('=' .repeat(60));
  console.log(`Total de clientes: ${CLIENTS.length}`);
  
  const results = {
    success: [],
    failed: []
  };

  for (const client of CLIENTS) {
    const success = await deployToClient(client);
    
    if (success) {
      results.success.push(client.name);
    } else {
      results.failed.push(client.name);
    }
    
    // Pausa entre clientes
    if (client !== CLIENTS[CLIENTS.length - 1]) {
      console.log('\n⏸️  Pausa de 2 segundos antes del siguiente cliente...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE DEPLOYMENT');
  console.log('='.repeat(60));
  console.log(`\n✅ Exitosos (${results.success.length}):`);
  results.success.forEach(name => console.log(`  - ${name}`));
  
  if (results.failed.length > 0) {
    console.log(`\n❌ Fallidos (${results.failed.length}):`);
    results.failed.forEach(name => console.log(`  - ${name}`));
  }

  console.log('\n🏁 Proceso completado\n');
}

main().catch(console.error);

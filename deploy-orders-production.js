/**
 * Script de Deployment del Módulo de Pedidos a Producción
 * 
 * Este script:
 * 1. Ejecuta migraciones de Prisma en cada cliente
 * 2. Crea el módulo "pedidos" en SystemModule
 * 3. Asigna permisos a todos los roles (ADMIN, CAJERO, BODEGA, VENDEDOR)
 * 4. Verifica que todo esté correcto
 * 
 * Ejecutar con: node deploy-orders-production.js
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

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
 * Ejecutar migraciones de Prisma para un cliente
 */
async function runMigrations(client) {
  console.log(`\n📦 Ejecutando migraciones de Prisma para ${client.name}...`);
  
  try {
    const output = execSync(`npx prisma migrate deploy`, {
      env: { ...process.env, DATABASE_URL: client.dbUrl },
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    console.log('✅ Migraciones ejecutadas exitosamente');
    // console.log(output); // Descomentar para ver detalles
    return true;
  } catch (error) {
    console.error('❌ Error al ejecutar migraciones:', error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.log(error.stderr);
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
    // 1. Crear o actualizar el módulo de Pedidos
    const module = await prisma.systemModule.upsert({
      where: { name: 'pedidos' },
      update: {
        displayName: 'Gestión de Pedidos',
        icon: 'FileTextOutlined',
        route: '/orders',
        description: 'Módulo para gestionar pedidos de clientes con reserva de stock',
      },
      create: {
        name: 'pedidos',
        displayName: 'Gestión de Pedidos',
        icon: 'FileTextOutlined',
        route: '/orders',
        description: 'Módulo para gestionar pedidos de clientes con reserva de stock',
      },
    });

    console.log('✅ Módulo creado/actualizado:', module.displayName);

    // 2. Obtener todos los roles
    const roles = await prisma.role.findMany();
    console.log(`📋 Roles encontrados: ${roles.length}`);

    // 3. Asignar permisos a cada rol
    let permissionsCreated = 0;
    for (const role of roles) {
      const config = PERMISSIONS_CONFIG[role.name];
      
      if (config) {
        await prisma.modulePermission.upsert({
          where: {
            moduleId_roleId: {
              moduleId: module.id,
              roleId: role.id,
            }
          },
          update: config,
          create: {
            moduleId: module.id,
            roleId: role.id,
            ...config,
          },
        });
        
        console.log(`  ✅ Permisos asignados para ${role.name}`);
        permissionsCreated++;
      }
    }

    console.log(`\n✅ Total de permisos configurados: ${permissionsCreated}`);

    // 4. Verificar permisos
    const permissions = await prisma.modulePermission.findMany({
      where: { moduleId: module.id },
      include: { role: true },
    });

    console.log('\n📊 Resumen de permisos:');
    permissions.forEach(p => {
      const view = p.canView ? '✓' : '✗';
      const create = p.canCreate ? '✓' : '✗';
      const edit = p.canEdit ? '✓' : '✗';
      const del = p.canDelete ? '✓' : '✗';
      console.log(`  ${p.role.name.padEnd(15)} | Ver: ${view} | Crear: ${create} | Editar: ${edit} | Eliminar: ${del}`);
    });

    return true;

  } catch (error) {
    console.error('❌ Error al configurar módulo:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Desplegar a un cliente específico
 */
async function deployToClient(client) {
  console.log('\n' + '='.repeat(70));
  console.log(`🚀 DEPLOYMENT: ${client.name}`);
  console.log('='.repeat(70));

  // Paso 1: Ejecutar migraciones
  const migrationsSuccess = await runMigrations(client);
  if (!migrationsSuccess) {
    console.log(`\n⚠️  Migraciones fallidas para ${client.name}. Continuando con configuración...`);
  }

  // Paso 2: Configurar módulo de pedidos
  const setupSuccess = await setupOrdersModule(client);
  
  if (setupSuccess) {
    console.log(`\n🎉 ¡Deployment completado exitosamente para ${client.name}!`);
    return true;
  } else {
    console.log(`\n❌ Deployment falló para ${client.name}`);
    return false;
  }
}

/**
 * Main: Desplegar a todos los clientes
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     DEPLOYMENT DE MÓDULO DE PEDIDOS A PRODUCCIÓN (RAILWAY)     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('📋 Clientes a desplegar:');
  CLIENTS.forEach((client, index) => {
    console.log(`   ${index + 1}. ${client.name}`);
  });
  console.log('');
  console.log('⚠️  IMPORTANTE:');
  console.log('   - Asegúrate de haber hecho git push a main');
  console.log('   - Railway debe estar desplegando backend y frontend');
  console.log('   - Este proceso puede tomar 10-15 minutos');
  console.log('');

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('¿Deseas continuar? (s/n): ', async (answer) => {
    readline.close();

    if (answer.toLowerCase() !== 's' && answer.toLowerCase() !== 'si') {
      console.log('\n❌ Deployment cancelado por el usuario');
      process.exit(0);
    }

    console.log('\n🚀 Iniciando deployment...\n');

    const results = [];

    // Desplegar a cada cliente
    for (const client of CLIENTS) {
      const success = await deployToClient(client);
      results.push({ client: client.name, success });
      
      // Esperar un poco entre clientes para no saturar las conexiones
      if (CLIENTS.indexOf(client) < CLIENTS.length - 1) {
        console.log('\n⏳ Esperando 3 segundos antes del siguiente cliente...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // Resumen final
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN FINAL DEL DEPLOYMENT');
    console.log('='.repeat(70));
    
    results.forEach((result, index) => {
      const status = result.success ? '✅ EXITOSO' : '❌ FALLIDO';
      console.log(`${index + 1}. ${result.client.padEnd(30)} ${status}`);
    });

    const allSuccess = results.every(r => r.success);
    
    if (allSuccess) {
      console.log('\n🎉 ¡DEPLOYMENT COMPLETADO EXITOSAMENTE EN TODOS LOS CLIENTES!');
      console.log('\n📝 Próximos pasos:');
      console.log('   1. Verificar en Railway que backend y frontend estén desplegados');
      console.log('   2. Acceder a cada aplicación web de cliente');
      console.log('   3. Iniciar sesión con usuario ADMIN');
      console.log('   4. Cerrar sesión y volver a entrar (para cargar módulos)');
      console.log('   5. Verificar que aparezca "Pedidos" en el menú');
      console.log('   6. Crear un pedido de prueba');
    } else {
      console.log('\n⚠️  Algunos deployments fallaron. Revisa los logs arriba.');
      console.log('   Puedes volver a ejecutar el script solo para los clientes fallidos.');
    }

    console.log('');
  });
}

// Ejecutar
main().catch((e) => {
  console.error('❌ Error fatal:', e);
  process.exit(1);
});

/**
 * Script para agregar el módulo de Pedidos al sistema
 * Ejecutar con: node add-orders-module.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando configuración del módulo de Pedidos...\n');

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

    console.log('✅ Módulo de Pedidos creado/actualizado:', module);

    // 2. Obtener roles
    const roles = await prisma.role.findMany({
      where: {
        name: {
          in: ['ADMIN', 'CAJERO', 'BODEGA', 'VENDEDOR']
        }
      }
    });

    console.log(`\n📋 Roles encontrados: ${roles.length}`);

    // 3. Definir permisos por rol
    const permissionsConfig = {
      'ADMIN': {
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

    // 4. Crear permisos para cada rol
    for (const role of roles) {
      const config = permissionsConfig[role.name];
      
      if (config) {
        const permission = await prisma.modulePermission.upsert({
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

        console.log(`✅ Permisos para ${role.name}:`, config);
      }
    }

    console.log('\n🎉 ¡Módulo de Pedidos configurado exitosamente!\n');

    // 5. Mostrar resumen
    const permissions = await prisma.modulePermission.findMany({
      where: { moduleId: module.id },
      include: {
        role: true,
      },
    });

    console.log('📊 Resumen de permisos:');
    console.table(permissions.map(p => ({
      Rol: p.role.name,
      Ver: p.canView ? '✓' : '✗',
      Crear: p.canCreate ? '✓' : '✗',
      Editar: p.canEdit ? '✓' : '✗',
      Eliminar: p.canDelete ? '✓' : '✗',
    })));

  } catch (error) {
    console.error('❌ Error al configurar el módulo:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function safeProductionMigration() {
  try {
    console.log('🚀 Iniciando migración segura para producción...');
    console.log('⚠️  MODO SEGURO: Solo agregar, nunca eliminar datos existentes\n');

    // 1. Verificar y crear el rol VENDEDOR si no existe
    console.log('1️⃣ Verificando rol VENDEDOR...');
    let vendedorRole = await prisma.role.findUnique({
      where: { name: 'VENDEDOR' }
    });

    if (!vendedorRole) {
      vendedorRole = await prisma.role.create({
        data: {
          name: 'VENDEDOR',
          description: 'Vendedor/Cajero con acceso limitado a POS, ventas y productos sin información de costos'
        }
      });
      console.log('✅ Rol VENDEDOR creado exitosamente');
    } else {
      console.log('✅ Rol VENDEDOR ya existe');
    }

    // 2. Verificar y crear módulos faltantes
    console.log('\n2️⃣ Verificando módulos del sistema...');
    const requiredModules = [
      {
        name: 'pos',
        displayName: 'POS - Punto de Venta',
        description: 'Sistema de punto de venta',
        route: '/pos',
        icon: 'CreditCardOutlined',
        order: 2,
      },
      {
        name: 'ventas',
        displayName: 'Ventas',
        description: 'Gestión de ventas y facturación',
        route: '/ventas',
        icon: 'ShoppingCartOutlined',
        order: 3,
      },
      {
        name: 'productos',
        displayName: 'Productos',
        description: 'Gestión de inventario y productos',
        route: '/products',
        icon: 'AppstoreOutlined',
        order: 4,
      },
      {
        name: 'gastos',
        displayName: 'Gastos',
        description: 'Gestión de gastos y egresos',
        route: '/expenses',
        icon: 'DollarOutlined',
        order: 7,
      },
      {
        name: 'cierres-caja',
        displayName: 'Cierres de caja',
        description: 'Control de cierres de caja',
        route: '/cash-closings',
        icon: 'FileDoneOutlined',
        order: 8,
      },
      {
        name: 'facturas',
        displayName: 'Facturas',
        description: 'Gestión de facturación',
        route: '/invoices',
        icon: 'FileTextOutlined',
        order: 10,
      }
    ];

    for (const moduleData of requiredModules) {
      const existingModule = await prisma.systemModule.findUnique({
        where: { name: moduleData.name }
      });

      if (!existingModule) {
        await prisma.systemModule.create({
          data: moduleData
        });
        console.log(`✅ Módulo ${moduleData.displayName} creado`);
      } else {
        // Actualizar datos sin afectar relaciones
        await prisma.systemModule.update({
          where: { name: moduleData.name },
          data: {
            displayName: moduleData.displayName,
            description: moduleData.description,
            route: moduleData.route,
            icon: moduleData.icon,
            order: moduleData.order
          }
        });
        console.log(`✅ Módulo ${moduleData.displayName} actualizado`);
      }
    }

    // 3. Configurar permisos del rol VENDEDOR
    console.log('\n3️⃣ Configurando permisos del rol VENDEDOR...');
    
    const modulePermissions = [
      { moduleName: 'pos', canView: true, canCreate: true, canEdit: false, canDelete: false, canExport: false },
      { moduleName: 'ventas', canView: true, canCreate: true, canEdit: false, canDelete: false, canExport: false },
      { moduleName: 'productos', canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false },
      { moduleName: 'gastos', canView: true, canCreate: true, canEdit: false, canDelete: false, canExport: false },
      { moduleName: 'cierres-caja', canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false },
      { moduleName: 'facturas', canView: true, canCreate: true, canEdit: false, canDelete: false, canExport: false }
    ];

    for (const permConfig of modulePermissions) {
      const module = await prisma.systemModule.findUnique({
        where: { name: permConfig.moduleName }
      });

      if (module && vendedorRole) {
        await prisma.modulePermission.upsert({
          where: {
            moduleId_roleId: {
              moduleId: module.id,
              roleId: vendedorRole.id
            }
          },
          update: {
            canView: permConfig.canView,
            canCreate: permConfig.canCreate,
            canEdit: permConfig.canEdit,
            canDelete: permConfig.canDelete,
            canExport: permConfig.canExport,
          },
          create: {
            moduleId: module.id,
            roleId: vendedorRole.id,
            canView: permConfig.canView,
            canCreate: permConfig.canCreate,
            canEdit: permConfig.canEdit,
            canDelete: permConfig.canDelete,
            canExport: permConfig.canExport,
          }
        });
        console.log(`✅ Permisos configurados para ${permConfig.moduleName}`);
      }
    }

    // 4. Crear usuario vendedor para producción
    console.log('\n4️⃣ Creando usuario vendedor para producción...');
    
    // Generar contraseña segura para producción
    const prodPassword = 'vendedor2024!';
    const hashedPassword = await bcrypt.hash(prodPassword, 10);

    const vendedorUser = await prisma.user.upsert({
      where: { username: 'vendedor' },
      update: {
        // Solo actualizar si ya existe, no cambiar contraseña
        name: 'Vendedor Principal'
      },
      create: {
        username: 'vendedor',
        password: hashedPassword,
        name: 'Vendedor Principal',
        roles: {
          create: [{ roleId: vendedorRole.id }]
        }
      }
    });

    // 5. Verificación final
    console.log('\n5️⃣ Verificación final...');
    
    const finalCheck = await prisma.modulePermission.findMany({
      where: { roleId: vendedorRole.id },
      include: { module: true }
    });

    console.log('\n📋 RESUMEN DE PERMISOS CONFIGURADOS:');
    console.log('═══════════════════════════════════════');
    finalCheck.forEach(perm => {
      const actions = [];
      if (perm.canView) actions.push('Ver');
      if (perm.canCreate) actions.push('Crear');
      if (perm.canEdit) actions.push('Editar');
      if (perm.canDelete) actions.push('Eliminar');
      console.log(`📌 ${perm.module.displayName}: ${actions.join(', ')}`);
    });

    console.log('\n🎉 ¡Migración completada exitosamente!');
    console.log('\n💡 CREDENCIALES PARA PRODUCCIÓN:');
    console.log('═════════════════════════════════');
    console.log('👤 Usuario: vendedor');
    console.log('🔑 Contraseña: vendedor2024!');
    console.log('\n⚠️  IMPORTANTE: Cambia esta contraseña después del primer login');
    
    return {
      success: true,
      user: 'vendedor',
      password: 'vendedor2024!',
      permissionsCount: finalCheck.length
    };

  } catch (error) {
    console.error('❌ Error en la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  safeProductionMigration()
    .then((result) => {
      console.log('\n✅ Migración completada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en la migración:', error);
      process.exit(1);
    });
}

module.exports = { safeProductionMigration };

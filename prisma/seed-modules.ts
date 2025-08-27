import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedModules() {
  console.log('🌱 Seeding system modules...');

  // Crear módulos del sistema
  const modules = [
    {
      name: 'dashboard',
      displayName: 'Dashboard Ejecutivo',
      description: 'Panel principal con métricas y resúmenes',
      route: '/',
      icon: 'PieChartOutlined',
      order: 1,
    },
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
      name: 'clientes',
      displayName: 'Clientes',
      description: 'Gestión de clientes',
      route: '/clients',
      icon: 'TeamOutlined',
      order: 5,
    },
    {
      name: 'proveedores',
      displayName: 'Proveedores',
      description: 'Gestión de proveedores',
      route: '/suppliers',
      icon: 'ShopOutlined',
      order: 6,
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
      name: 'capital',
      displayName: 'Capital',
      description: 'Gestión de capital y flujo de caja',
      route: '/capital',
      icon: 'WalletOutlined',
      order: 9,
    },
    {
      name: 'facturas',
      displayName: 'Facturas',
      description: 'Gestión de facturación',
      route: '/invoices',
      icon: 'FileTextOutlined',
      order: 10,
    },
    {
      name: 'reportes',
      displayName: 'Resumen de ganancias',
      description: 'Reportes y análisis de datos',
      route: '/reports/profit-summary',
      icon: 'BarChartOutlined',
      order: 11,
    },
    {
      name: 'configuracion',
      displayName: 'Configuración',
      description: 'Configuración de la empresa y negocio',
      route: '/company-config',
      icon: 'SettingOutlined',
      order: 12,
    },
    {
      name: 'categorias',
      displayName: 'Categorías',
      description: 'Gestión de categorías de productos',
      route: '/categories',
      icon: 'GiftOutlined',
      order: 13,
    },
    {
      name: 'unidades',
      displayName: 'Unidades',
      description: 'Gestión de unidades de medida',
      route: '/units',
      icon: 'GiftOutlined',
      order: 14,
    },
    {
      name: 'usuarios',
      displayName: 'Usuarios',
      description: 'Administración de usuarios del sistema',
      route: '/users',
      icon: 'TeamOutlined',
      order: 15,
    },
    // Módulos de administración del sistema (solo SUPER_ADMIN)
    {
      name: 'roles',
      displayName: 'Roles y Permisos',
      description: 'Gestión de roles y permisos del sistema',
      route: '/roles',
      icon: 'SafetyCertificateOutlined',
      order: 100,
    },
  ];

  for (const moduleData of modules) {
    await prisma.systemModule.upsert({
      where: { name: moduleData.name },
      update: moduleData,
      create: moduleData,
    });
  }

  console.log('✅ System modules seeded successfully');
}

export async function seedRoles() {
  console.log('🌱 Seeding roles...');

  const roles = [
    {
      name: 'SUPER_ADMIN',
      description: 'Desarrollador con acceso total incluyendo gestión de usuarios y sistema'
    },
    {
      name: 'ADMIN',
      description: 'Administrador del cliente con acceso completo a todas las funciones del negocio'
    },
    {
      name: 'MANAGER',
      description: 'Gerente con acceso a ventas, compras, inventario y reportes'
    },
    {
      name: 'EMPLOYEE',
      description: 'Empleado con acceso limitado a ventas y consultas'
    },
    {
      name: 'VIEWER',
      description: 'Solo lectura de información básica'
    }
  ];

  for (const roleData of roles) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: roleData,
      create: roleData,
    });
  }

  console.log('✅ Roles seeded successfully');
}

export async function seedPermissions() {
  console.log('🌱 Seeding permissions...');

  const roles = await prisma.role.findMany();
  const modules = await prisma.systemModule.findMany();

  const superAdmin = roles.find(r => r.name === 'SUPER_ADMIN');
  const admin = roles.find(r => r.name === 'ADMIN');
  const manager = roles.find(r => r.name === 'MANAGER');
  const employee = roles.find(r => r.name === 'EMPLOYEE');
  const viewer = roles.find(r => r.name === 'VIEWER');

  // SUPER_ADMIN - Acceso total incluyendo administración del sistema
  if (superAdmin) {
    for (const module of modules) {
      await prisma.modulePermission.upsert({
        where: { 
          moduleId_roleId: { 
            moduleId: module.id, 
            roleId: superAdmin.id 
          } 
        },
        update: {
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canExport: true,
        },
        create: {
          moduleId: module.id,
          roleId: superAdmin.id,
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canExport: true,
        },
      });
    }
  }

  // ADMIN - Acceso a todo excepto administración del sistema (users, roles, system-admin)
  if (admin) {
    const adminModules = modules.filter(m => 
      !['system-admin', 'users', 'roles'].includes(m.name)
    );
    
    for (const module of adminModules) {
      await prisma.modulePermission.upsert({
        where: { 
          moduleId_roleId: { 
            moduleId: module.id, 
            roleId: admin.id 
          } 
        },
        update: {
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canExport: true,
        },
        create: {
          moduleId: module.id,
          roleId: admin.id,
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canExport: true,
        },
      });
    }
  }

  // MANAGER - Acceso a operaciones del negocio
  if (manager) {
    const managerModules = modules.filter(m => 
      ['dashboard', 'sales', 'purchases', 'products', 'clients', 'suppliers', 'reports', 'categories', 'units'].includes(m.name)
    );
    
    for (const module of managerModules) {
      await prisma.modulePermission.upsert({
        where: { 
          moduleId_roleId: { 
            moduleId: module.id, 
            roleId: manager.id 
          } 
        },
        update: {
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: false, // No puede eliminar
          canExport: true,
        },
        create: {
          moduleId: module.id,
          roleId: manager.id,
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: false,
          canExport: true,
        },
      });
    }
  }

  // EMPLOYEE - Solo ventas y consultas básicas
  if (employee) {
    const employeeModules = modules.filter(m => 
      ['dashboard', 'sales', 'clients', 'products'].includes(m.name)
    );
    
    for (const module of employeeModules) {
      const permissions = {
        canView: true,
        canCreate: module.name === 'sales' || module.name === 'clients', // Solo puede crear ventas y clientes
        canEdit: module.name === 'sales' || module.name === 'clients',
        canDelete: false,
        canExport: false,
      };

      await prisma.modulePermission.upsert({
        where: { 
          moduleId_roleId: { 
            moduleId: module.id, 
            roleId: employee.id 
          } 
        },
        update: permissions,
        create: {
          moduleId: module.id,
          roleId: employee.id,
          ...permissions,
        },
      });
    }
  }

  // VIEWER - Solo lectura
  if (viewer) {
    const viewerModules = modules.filter(m => 
      ['dashboard', 'products', 'clients'].includes(m.name)
    );
    
    for (const module of viewerModules) {
      await prisma.modulePermission.upsert({
        where: { 
          moduleId_roleId: { 
            moduleId: module.id, 
            roleId: viewer.id 
          } 
        },
        update: {
          canView: true,
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canExport: false,
        },
        create: {
          moduleId: module.id,
          roleId: viewer.id,
          canView: true,
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canExport: false,
        },
      });
    }
  }

  console.log('✅ Permissions seeded successfully');
}

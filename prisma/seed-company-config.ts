// prisma/seed-company-config.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCompanyConfig() {
  console.log('🏢 Seeding company configuration...');

  try {
    // Verificar si ya existe configuración
    const existingConfig = await prisma.companyConfig.findFirst();
    
    if (!existingConfig) {
      // Crear configuración por defecto
      await prisma.companyConfig.create({
        data: {
          companyName: 'Perfumería Milan',
          nit: '123456789-0',
          address: 'Calle Principal #123, Bogotá, Colombia',
          phone: '+57 300 123 4567',
          email: 'info@perfumeriamilan.com',
          website: 'www.perfumeriamilan.com',
          invoicePrefix: 'FACT-',
          invoiceFooter: 'Gracias por su compra. ¡Vuelva pronto!',
          taxRate: 19.0,
          currency: 'COP',
          posReceiptHeader: '*** PERFUMERÍA MILAN ***\nNIT: 123456789-0\nCalle Principal #123\nTel: +57 300 123 4567',
          posReceiptFooter: '¡Gracias por su compra!\nSiga nuestras redes sociales\n@perfumeriamilan',
          printLogo: false,
          timezone: 'America/Bogota',
          dateFormat: 'DD/MM/YYYY',
          numberFormat: 'es-CO',
        },
      });
      console.log('✅ Company configuration created');
    } else {
      console.log('✅ Company configuration already exists');
    }

    // Crear módulos del sistema
    console.log('📦 Creating system modules...');

    const defaultModules = [
      {
        name: 'dashboard',
        displayName: 'Dashboard',
        description: 'Panel principal con estadísticas',
        route: '/',
        icon: 'DashboardOutlined',
        order: 1,
      },
      {
        name: 'sales',
        displayName: 'Ventas',
        description: 'Gestión de ventas y transacciones',
        route: '/ventas',
        icon: 'ShoppingCartOutlined',
        order: 2,
      },
      {
        name: 'pos',
        displayName: 'Punto de Venta',
        description: 'Sistema de punto de venta',
        route: '/pos',
        icon: 'CreditCardOutlined',
        order: 3,
      },
      {
        name: 'products',
        displayName: 'Productos',
        description: 'Gestión de inventario y productos',
        route: '/products',
        icon: 'AppstoreOutlined',
        order: 4,
      },
      {
        name: 'clients',
        displayName: 'Clientes',
        description: 'Gestión de base de clientes',
        route: '/clients',
        icon: 'TeamOutlined',
        order: 5,
      },
      {
        name: 'suppliers',
        displayName: 'Proveedores',
        description: 'Gestión de proveedores',
        route: '/suppliers',
        icon: 'ShopOutlined',
        order: 6,
      },
      {
        name: 'expenses',
        displayName: 'Gastos',
        description: 'Control de gastos y egresos',
        route: '/expenses',
        icon: 'DollarOutlined',
        order: 7,
      },
      {
        name: 'capital',
        displayName: 'Capital',
        description: 'Gestión de capital y finanzas',
        route: '/capital',
        icon: 'WalletOutlined',
        order: 8,
      },
      {
        name: 'invoices',
        displayName: 'Facturas',
        description: 'Gestión de facturas de proveedores',
        route: '/invoices',
        icon: 'FileTextOutlined',
        order: 9,
      },
      {
        name: 'cash-closings',
        displayName: 'Cierres de Caja',
        description: 'Cierres diarios de caja',
        route: '/cash-closings',
        icon: 'CalendarOutlined',
        order: 10,
      },
      {
        name: 'users',
        displayName: 'Usuarios',
        description: 'Gestión de usuarios del sistema',
        route: '/users',
        icon: 'UserOutlined',
        order: 11,
      },
      {
        name: 'categories',
        displayName: 'Categorías',
        description: 'Categorías de productos',
        route: '/categories',
        icon: 'TagsOutlined',
        order: 12,
      },
      {
        name: 'units',
        displayName: 'Unidades',
        description: 'Unidades de medida',
        route: '/units',
        icon: 'NumberOutlined',
        order: 13,
      },
      {
        name: 'reports',
        displayName: 'Reportes',
        description: 'Reportes y análisis',
        route: '/reports',
        icon: 'BarChartOutlined',
        order: 14,
      },
      {
        name: 'company-config',
        displayName: 'Configuración',
        description: 'Configuración de empresa',
        route: '/company-config',
        icon: 'SettingOutlined',
        order: 15,
      },
      {
        name: 'permissions',
        displayName: 'Permisos',
        description: 'Gestión de permisos y roles',
        route: '/permissions',
        icon: 'SafetyOutlined',
        order: 16,
      },
    ];

    for (const moduleData of defaultModules) {
      const existingModule = await prisma.systemModule.findUnique({
        where: { name: moduleData.name },
      });

      if (!existingModule) {
        await prisma.systemModule.create({
          data: moduleData,
        });
        console.log(`✅ Module "${moduleData.displayName}" created`);
      }
    }

    // Configurar permisos para rol ADMIN
    console.log('🔒 Setting up ADMIN permissions...');

    const adminRole = await prisma.role.findUnique({
      where: { name: 'ADMIN' },
    });

    if (adminRole) {
      const modules = await prisma.systemModule.findMany();

      for (const module of modules) {
        const existingPermission = await prisma.modulePermission.findUnique({
          where: {
            moduleId_roleId: {
              moduleId: module.id,
              roleId: adminRole.id,
            },
          },
        });

        if (!existingPermission) {
          await prisma.modulePermission.create({
            data: {
              moduleId: module.id,
              roleId: adminRole.id,
              canView: true,
              canCreate: true,
              canEdit: true,
              canDelete: true,
              canExport: true,
            },
          });
        }
      }
      console.log('✅ ADMIN permissions configured');
    }

    // Configurar permisos básicos para rol VENDEDOR
    console.log('🔒 Setting up VENDEDOR permissions...');

    const vendedorRole = await prisma.role.findUnique({
      where: { name: 'VENDEDOR' },
    });

    if (vendedorRole) {
      const vendedorModules = [
        'dashboard',
        'sales',
        'pos',
        'products',
        'clients',
        'cash-closings',
      ];

      for (const moduleName of vendedorModules) {
        const module = await prisma.systemModule.findUnique({
          where: { name: moduleName },
        });

        if (module) {
          const existingPermission = await prisma.modulePermission.findUnique({
            where: {
              moduleId_roleId: {
                moduleId: module.id,
                roleId: vendedorRole.id,
              },
            },
          });

          if (!existingPermission) {
            await prisma.modulePermission.create({
              data: {
                moduleId: module.id,
                roleId: vendedorRole.id,
                canView: true,
                canCreate: moduleName === 'sales' || moduleName === 'clients',
                canEdit: moduleName === 'clients',
                canDelete: false,
                canExport: false,
              },
            });
          }
        }
      }
      console.log('✅ VENDEDOR permissions configured');
    }

    // Configurar permisos básicos para rol USER
    console.log('🔒 Setting up USER permissions...');

    const userRole = await prisma.role.findUnique({
      where: { name: 'USER' },
    });

    if (userRole) {
      const userModules = ['dashboard', 'products', 'clients'];

      for (const moduleName of userModules) {
        const module = await prisma.systemModule.findUnique({
          where: { name: moduleName },
        });

        if (module) {
          const existingPermission = await prisma.modulePermission.findUnique({
            where: {
              moduleId_roleId: {
                moduleId: module.id,
                roleId: userRole.id,
              },
            },
          });

          if (!existingPermission) {
            await prisma.modulePermission.create({
              data: {
                moduleId: module.id,
                roleId: userRole.id,
                canView: true,
                canCreate: false,
                canEdit: false,
                canDelete: false,
                canExport: false,
              },
            });
          }
        }
      }
      console.log('✅ USER permissions configured');
    }

    console.log('🎉 Company configuration and permissions seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding company configuration:', error);
    throw error;
  }
}

if (require.main === module) {
  seedCompanyConfig()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export default seedCompanyConfig;

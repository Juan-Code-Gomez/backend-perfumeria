/**
 * Script de seed para la base de datos de EasyOnPOS (ambiente demo)
 * Crea roles, módulos del sistema y permisos
 * Ejecutar con:
 *   $env:DATABASE_URL="<url>"; node seed-easyonpos.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// ── Roles ──────────────────────────────────────────────────────────────────────
const ROLES = [
  { name: 'ADMIN',    description: 'Administrador con acceso completo' },
  { name: 'CAJERO',   description: 'Cajero – ventas y caja' },
  { name: 'BODEGA',   description: 'Bodega – pedidos y stock' },
  { name: 'VENDEDOR', description: 'Vendedor – POS y clientes' },
];

// ── Módulos del sistema ────────────────────────────────────────────────────────
//  order: posición en el menú  |  isActive: visible por defecto
const MODULES = [
  {
    name: 'dashboard',
    displayName: 'Dashboard',
    icon: 'PieChartOutlined',
    route: '/',
    description: 'Panel principal con resumen ejecutivo',
    order: 1,
    isActive: true,
  },
  {
    name: 'pos',
    displayName: 'Punto de Venta (POS)',
    icon: 'ShoppingCartOutlined',
    route: '/pos',
    description: 'Terminal de venta rápida',
    order: 2,
    isActive: true,
  },
  {
    name: 'ventas',
    displayName: 'Historial de Ventas',
    icon: 'ShoppingOutlined',
    route: '/ventas',
    description: 'Listado y gestión de ventas',
    order: 3,
    isActive: true,
  },
  {
    name: 'pedidos',
    displayName: 'Pedidos',
    icon: 'FileTextOutlined',
    route: '/orders',
    description: 'Gestión de pedidos de clientes',
    order: 4,
    isActive: true,
  },
  {
    name: 'compras',
    displayName: 'Compras',
    icon: 'FileDoneOutlined',
    route: '/purchases',
    description: 'Órdenes de compra a proveedores',
    order: 5,
    isActive: true,
  },
  {
    name: 'productos',
    displayName: 'Productos',
    icon: 'AppstoreOutlined',
    route: '/products',
    description: 'Catálogo de productos e inventario',
    order: 6,
    isActive: true,
  },
  {
    name: 'categorias',
    displayName: 'Categorías',
    icon: 'TagsOutlined',
    route: '/categories',
    description: 'Categorías de productos',
    order: 7,
    isActive: true,
  },
  {
    name: 'facturas',
    displayName: 'Facturas',
    icon: 'DollarOutlined',
    route: '/invoices',
    description: 'Gestión de facturas a proveedores (FIFO)',
    order: 8,
    isActive: true,
  },
  {
    name: 'clientes',
    displayName: 'Clientes',
    icon: 'TeamOutlined',
    route: '/clients',
    description: 'Gestión de clientes',
    order: 9,
    isActive: true,
  },
  {
    name: 'proveedores',
    displayName: 'Proveedores',
    icon: 'ShopOutlined',
    route: '/suppliers',
    description: 'Directorio de proveedores',
    order: 10,
    isActive: true,
  },
  {
    name: 'gastos',
    displayName: 'Gastos',
    icon: 'WalletOutlined',
    route: '/expenses',
    description: 'Registro de gastos operativos',
    order: 11,
    isActive: true,
  },
  {
    name: 'caja',
    displayName: 'Cierre de Caja',
    icon: 'CreditCardOutlined',
    route: '/cash-closings',
    description: 'Cierres de caja y sesiones',
    order: 12,
    isActive: true,
  },
  {
    name: 'reportes',
    displayName: 'Reportes',
    icon: 'BarChartOutlined',
    route: '/reports/profit-summary',
    description: 'Reportes de utilidad y ventas',
    order: 13,
    isActive: true,
  },
  {
    name: 'capital',
    displayName: 'Capital',
    icon: 'DollarOutlined',
    route: '/capital',
    description: 'Gestión de capital e inversiones',
    order: 14,
    isActive: true,
  },
  {
    name: 'configuracion',
    displayName: 'Configuración',
    icon: 'SettingOutlined',
    route: '/company-config',
    description: 'Configuración de la empresa',
    order: 15,
    isActive: true,
  },
  {
    name: 'usuarios',
    displayName: 'Usuarios',
    icon: 'UserOutlined',
    route: '/users',
    description: 'Gestión de usuarios del sistema',
    order: 16,
    isActive: true,
  },
  {
    name: 'roles',
    displayName: 'Roles y Permisos',
    icon: 'SafetyCertificateOutlined',
    route: '/roles',
    description: 'Administración de roles y permisos',
    order: 17,
    isActive: true,
  },
];

// ── Permisos por rol ────────────────────────────────────────────────────────────
// true/false: [canView, canCreate, canEdit, canDelete]
const PERMISSIONS = {
  // módulo         ADMIN               CAJERO              BODEGA              VENDEDOR
  dashboard:    { ADMIN:[1,1,1,1], CAJERO:[1,0,0,0], BODEGA:[1,0,0,0], VENDEDOR:[1,0,0,0] },
  pos:          { ADMIN:[1,1,1,1], CAJERO:[1,1,1,0], BODEGA:[0,0,0,0], VENDEDOR:[1,1,0,0] },
  ventas:       { ADMIN:[1,1,1,1], CAJERO:[1,1,1,0], BODEGA:[0,0,0,0], VENDEDOR:[1,1,0,0] },
  pedidos:      { ADMIN:[1,1,1,1], CAJERO:[1,1,1,0], BODEGA:[1,1,1,0], VENDEDOR:[1,1,0,0] },
  compras:      { ADMIN:[1,1,1,1], CAJERO:[0,0,0,0], BODEGA:[1,1,1,0], VENDEDOR:[0,0,0,0] },
  productos:    { ADMIN:[1,1,1,1], CAJERO:[1,0,0,0], BODEGA:[1,1,1,0], VENDEDOR:[1,0,0,0] },
  categorias:   { ADMIN:[1,1,1,1], CAJERO:[1,0,0,0], BODEGA:[1,0,0,0], VENDEDOR:[1,0,0,0] },
  facturas:     { ADMIN:[1,1,1,1], CAJERO:[0,0,0,0], BODEGA:[1,1,0,0], VENDEDOR:[0,0,0,0] },
  clientes:     { ADMIN:[1,1,1,1], CAJERO:[1,1,1,0], BODEGA:[0,0,0,0], VENDEDOR:[1,1,1,0] },
  proveedores:  { ADMIN:[1,1,1,1], CAJERO:[0,0,0,0], BODEGA:[1,0,0,0], VENDEDOR:[0,0,0,0] },
  gastos:       { ADMIN:[1,1,1,1], CAJERO:[1,1,0,0], BODEGA:[0,0,0,0], VENDEDOR:[0,0,0,0] },
  caja:         { ADMIN:[1,1,1,1], CAJERO:[1,1,1,0], BODEGA:[0,0,0,0], VENDEDOR:[0,0,0,0] },
  reportes:     { ADMIN:[1,1,1,1], CAJERO:[1,0,0,0], BODEGA:[0,0,0,0], VENDEDOR:[1,0,0,0] },
  capital:      { ADMIN:[1,1,1,1], CAJERO:[0,0,0,0], BODEGA:[0,0,0,0], VENDEDOR:[0,0,0,0] },
  configuracion:{ ADMIN:[1,1,1,1], CAJERO:[0,0,0,0], BODEGA:[0,0,0,0], VENDEDOR:[0,0,0,0] },
  usuarios:     { ADMIN:[1,1,1,1], CAJERO:[0,0,0,0], BODEGA:[0,0,0,0], VENDEDOR:[0,0,0,0] },
  roles:        { ADMIN:[1,1,1,1], CAJERO:[0,0,0,0], BODEGA:[0,0,0,0], VENDEDOR:[0,0,0,0] },
};

async function main() {
  console.log('\n🚀 Iniciando seed de EasyOnPOS...\n');

  // 1. Crear/actualizar roles
  console.log('📋 Creando roles...');
  const roleMap = {};
  for (const r of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
    roleMap[r.name] = role;
    console.log(`  ✅ Rol: ${role.name} (id=${role.id})`);
  }

  // 2. Crear/actualizar módulos
  console.log('\n📦 Creando módulos del sistema...');
  const moduleMap = {};
  for (const m of MODULES) {
    const mod = await prisma.systemModule.upsert({
      where: { name: m.name },
      update: {
        displayName: m.displayName,
        icon: m.icon,
        route: m.route,
        description: m.description,
        order: m.order,
        isActive: m.isActive,
      },
      create: m,
    });
    moduleMap[m.name] = mod;
    console.log(`  ✅ Módulo: ${mod.name} (id=${mod.id})`);
  }

  // 3. Crear permisos
  console.log('\n🔐 Asignando permisos...');
  for (const [moduleName, rolePerms] of Object.entries(PERMISSIONS)) {
    const mod = moduleMap[moduleName];
    if (!mod) continue;

    for (const [roleName, flags] of Object.entries(rolePerms)) {
      const role = roleMap[roleName];
      if (!role) continue;

      const [canView, canCreate, canEdit, canDelete] = flags;
      await prisma.modulePermission.upsert({
        where: { moduleId_roleId: { moduleId: mod.id, roleId: role.id } },
        update: {
          canView:   Boolean(canView),
          canCreate: Boolean(canCreate),
          canEdit:   Boolean(canEdit),
          canDelete: Boolean(canDelete),
        },
        create: {
          moduleId:  mod.id,
          roleId:    role.id,
          canView:   Boolean(canView),
          canCreate: Boolean(canCreate),
          canEdit:   Boolean(canEdit),
          canDelete: Boolean(canDelete),
        },
      });
    }
    console.log(`  ✅ Permisos para módulo: ${moduleName}`);
  }

  // 4. Asignar el usuario existente al rol ADMIN (si no tiene rol)
  console.log('\n👤 Revisando usuario admin...');
  const users = await prisma.user.findMany({ include: { roles: true } });
  for (const user of users) {
    if (user.roles.length === 0) {
      const adminRole = roleMap['ADMIN'];
      await prisma.userRole.create({
        data: { userId: user.id, roleId: adminRole.id },
      });
      console.log(`  ✅ Usuario "${user.username}" asignado a rol ADMIN`);
    } else {
      console.log(`  ℹ️  Usuario "${user.username}" ya tiene roles: ${user.roles.map(r => r.roleId).join(', ')}`);
    }
  }

  // 5. Resumen final
  const counts = {
    roles: await prisma.role.count(),
    modules: await prisma.systemModule.count(),
    permissions: await prisma.modulePermission.count(),
    users: await prisma.user.count(),
  };

  console.log('\n✅ Seed completado:');
  console.log(`   Roles:         ${counts.roles}`);
  console.log(`   Módulos:       ${counts.modules}`);
  console.log(`   Permisos:      ${counts.permissions}`);
  console.log(`   Usuarios:      ${counts.users}`);
  console.log('\n🎉 Base de datos lista para EasyOnPOS\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Error en seed:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

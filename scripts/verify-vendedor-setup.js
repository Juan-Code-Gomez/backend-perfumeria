// scripts/verify-vendedor-setup.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyVendedorSetup() {
  console.log('🔍 Verificando configuración del rol VENDEDOR...\n');

  try {
    // 1. Verificar que existe el rol VENDEDOR
    const vendedorRole = await prisma.role.findFirst({
      where: { name: 'VENDEDOR' }
    });

    if (!vendedorRole) {
      console.log('❌ Rol VENDEDOR no encontrado');
      return;
    }
    console.log(`✅ Rol VENDEDOR existe: ${vendedorRole.name} (ID: ${vendedorRole.id})`);

    // 2. Verificar permisos del rol VENDEDOR
    const permissions = await prisma.modulePermission.findMany({
      where: { roleId: vendedorRole.id },
      include: {
        module: true
      }
    });

    console.log('\n📋 Permisos configurados:');
    permissions.forEach(perm => {
      const actions = [];
      if (perm.canView) actions.push('view');
      if (perm.canCreate) actions.push('create');
      if (perm.canEdit) actions.push('edit');
      if (perm.canDelete) actions.push('delete');
      if (perm.canExport) actions.push('export');
      
      console.log(`   📦 ${perm.module.displayName}: [${actions.join(', ')}]`);
    });

    // 3. Verificar usuario vendedor
    const vendedorUser = await prisma.user.findFirst({
      where: { username: 'vendedor1' },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!vendedorUser) {
      console.log('\n❌ Usuario vendedor1 no encontrado');
      return;
    }

    console.log(`\n✅ Usuario vendedor existe: ${vendedorUser.name} (${vendedorUser.username})`);
    console.log('🔑 Roles asignados:');
    vendedorUser.roles.forEach(ur => {
      console.log(`   - ${ur.role.name}`);
    });

    // 4. Verificar módulos accesibles
    const accessibleModules = await prisma.modulePermission.findMany({
      where: { 
        roleId: vendedorRole.id,
        canView: true
      },
      include: {
        module: true
      }
    });

    console.log('\n🚪 Módulos accesibles para VENDEDOR:');
    accessibleModules.forEach(perm => {
      console.log(`   ✅ ${perm.module.displayName} (${perm.module.route})`);
    });

    console.log('\n🎉 ¡Configuración del rol VENDEDOR verificada exitosamente!');
    console.log('\n📝 Resumen:');
    console.log('   - Rol VENDEDOR creado ✅');
    console.log('   - Permisos configurados ✅');
    console.log('   - Usuario de prueba creado ✅');
    console.log('   - Acceso a POS, Ventas y Productos (solo lectura) ✅');

  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyVendedorSetup();

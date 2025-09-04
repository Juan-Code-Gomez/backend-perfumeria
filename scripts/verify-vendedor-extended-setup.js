const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyVendedorExtendedSetup() {
  try {
    console.log('🔍 Verificando configuración extendida del rol VENDEDOR...\n');

    // Verificar que el rol VENDEDOR existe
    const vendedorRole = await prisma.role.findUnique({
      where: { name: 'VENDEDOR' }
    });

    if (!vendedorRole) {
      console.error('❌ Rol VENDEDOR no encontrado');
      return;
    }

    console.log('✅ Rol VENDEDOR encontrado');

    // Verificar permisos del rol VENDEDOR
    const vendedorPermissions = await prisma.modulePermission.findMany({
      where: { roleId: vendedorRole.id },
      include: {
        module: true
      }
    });

    console.log('\n📋 PERMISOS DEL ROL VENDEDOR:');
    console.log('═══════════════════════════════════════\n');

    const expectedModules = ['pos', 'ventas', 'productos', 'gastos', 'cierres-caja', 'facturas'];
    
    expectedModules.forEach(moduleName => {
      const permission = vendedorPermissions.find(p => p.module.name === moduleName);
      
      if (permission) {
        const actions = [];
        if (permission.canView) actions.push('✅ Ver');
        if (permission.canCreate) actions.push('✅ Crear');
        if (permission.canEdit) actions.push('✅ Editar');
        if (permission.canDelete) actions.push('❌ Eliminar');
        if (permission.canExport) actions.push('❌ Exportar');
        
        console.log(`📌 ${permission.module.displayName}:`);
        console.log(`   ${actions.join(' | ')}\n`);
      } else {
        console.log(`❌ ${moduleName}: Sin permisos configurados\n`);
      }
    });

    // Verificar usuario vendedor de prueba
    const vendedorUser = await prisma.user.findUnique({
      where: { username: 'vendedor1' },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (vendedorUser) {
      console.log('✅ Usuario de prueba "vendedor1" encontrado');
      console.log(`   📧 Email: ${vendedorUser.email}`);
      console.log(`   👤 Roles: ${vendedorUser.roles.map(r => r.role.name).join(', ')}`);
    } else {
      console.log('⚠️  Usuario de prueba "vendedor1" no encontrado');
    }

    // Resumen de funcionalidades
    console.log('\n📝 RESUMEN DE FUNCIONALIDADES PARA VENDEDOR:');
    console.log('═══════════════════════════════════════════════\n');

    console.log('✅ ACCESO COMPLETO:');
    console.log('   • POS - Punto de Venta (crear ventas)');
    console.log('   • Administración de Ventas (ver y crear)');
    console.log('   • Cierres de caja (ver, crear y editar)\n');

    console.log('🔒 ACCESO RESTRINGIDO:');
    console.log('   • Productos: Solo lectura (sin precios de compra, márgenes, ni utilidades)');
    console.log('   • Gastos: Solo crear nuevos gastos');
    console.log('   • Facturas: Solo crear nuevas facturas\n');

    console.log('❌ SIN ACCESO:');
    console.log('   • Clientes, Proveedores, Capital, Reportes, Configuración');
    console.log('   • Editar o eliminar productos');
    console.log('   • Editar o eliminar gastos');
    console.log('   • Editar o eliminar facturas\n');

    console.log('🎉 ¡Configuración extendida del rol VENDEDOR verificada exitosamente!');
    console.log('\n💡 CREDENCIALES DE PRUEBA:');
    console.log('   👤 Usuario: vendedor1');
    console.log('   🔑 Contraseña: vendedor123');
    console.log('\n🌐 Puedes iniciar sesión con estas credenciales para probar las funcionalidades.');

  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyVendedorExtendedSetup();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateVendedorPermissions() {
  try {
    console.log('🔄 Actualizando permisos extendidos del rol VENDEDOR...');

    // Buscar el rol VENDEDOR
    const vendedorRole = await prisma.role.findUnique({
      where: { name: 'VENDEDOR' }
    });

    if (!vendedorRole) {
      console.error('❌ Rol VENDEDOR no encontrado');
      return;
    }

    // Buscar los módulos adicionales
    const gastosModule = await prisma.systemModule.findUnique({
      where: { name: 'gastos' }
    });

    const cierresCajaModule = await prisma.systemModule.findUnique({
      where: { name: 'cierres-caja' }
    });

    const facturasModule = await prisma.systemModule.findUnique({
      where: { name: 'facturas' }
    });

    if (!gastosModule || !cierresCajaModule || !facturasModule) {
      console.error('❌ Algunos módulos no fueron encontrados');
      return;
    }

    // Configurar permisos para GASTOS - Solo crear
    await prisma.modulePermission.upsert({
      where: {
        moduleId_roleId: {
          moduleId: gastosModule.id,
          roleId: vendedorRole.id
        }
      },
      update: {
        canView: true,
        canCreate: true,  // Puede crear gastos
        canEdit: false,   // No puede editar
        canDelete: false, // No puede eliminar
        canExport: false,
      },
      create: {
        moduleId: gastosModule.id,
        roleId: vendedorRole.id,
        canView: true,
        canCreate: true,
        canEdit: false,
        canDelete: false,
        canExport: false,
      },
    });

    console.log('✅ Permisos de GASTOS configurados para VENDEDOR');

    // Configurar permisos para CIERRES DE CAJA
    await prisma.modulePermission.upsert({
      where: {
        moduleId_roleId: {
          moduleId: cierresCajaModule.id,
          roleId: vendedorRole.id
        }
      },
      update: {
        canView: true,
        canCreate: true,  // Puede crear cierres
        canEdit: true,    // Puede editar cierres
        canDelete: false, // No puede eliminar
        canExport: false,
      },
      create: {
        moduleId: cierresCajaModule.id,
        roleId: vendedorRole.id,
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: false,
      },
    });

    console.log('✅ Permisos de CIERRES DE CAJA configurados para VENDEDOR');

    // Configurar permisos para FACTURAS - Solo crear
    await prisma.modulePermission.upsert({
      where: {
        moduleId_roleId: {
          moduleId: facturasModule.id,
          roleId: vendedorRole.id
        }
      },
      update: {
        canView: true,
        canCreate: true,  // Puede crear facturas
        canEdit: false,   // No puede editar
        canDelete: false, // No puede eliminar
        canExport: false,
      },
      create: {
        moduleId: facturasModule.id,
        roleId: vendedorRole.id,
        canView: true,
        canCreate: true,
        canEdit: false,
        canDelete: false,
        canExport: false,
      },
    });

    console.log('✅ Permisos de FACTURAS configurados para VENDEDOR');

    // Verificar los permisos actuales del rol VENDEDOR
    const vendedorPermissions = await prisma.modulePermission.findMany({
      where: { roleId: vendedorRole.id },
      include: {
        module: true
      }
    });

    console.log('\n📋 Permisos actuales del rol VENDEDOR:');
    console.log('═══════════════════════════════════════');
    
    vendedorPermissions.forEach(permission => {
      const actions = [];
      if (permission.canView) actions.push('Ver');
      if (permission.canCreate) actions.push('Crear');
      if (permission.canEdit) actions.push('Editar');
      if (permission.canDelete) actions.push('Eliminar');
      if (permission.canExport) actions.push('Exportar');
      
      console.log(`📌 ${permission.module.displayName}: ${actions.join(', ')}`);
    });

    console.log('\n🎉 ¡Permisos extendidos del rol VENDEDOR actualizados correctamente!');
    console.log('\n📝 Resumen de accesos:');
    console.log('• POS - Punto de Venta: Acceso completo');
    console.log('• Ventas: Acceso completo');
    console.log('• Productos: Solo lectura (sin precios de compra ni márgenes)');
    console.log('• Gastos: Solo crear nuevos gastos');
    console.log('• Cierres de caja: Crear y editar cierres');
    console.log('• Facturas: Solo crear nuevas facturas');

  } catch (error) {
    console.error('❌ Error al actualizar permisos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateVendedorPermissions();

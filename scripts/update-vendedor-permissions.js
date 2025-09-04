// scripts/update-vendedor-permissions.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateVendedorPermissions() {
  console.log('🔧 Actualizando permisos del rol VENDEDOR...');

  try {
    // Buscar el rol VENDEDOR
    const vendedorRole = await prisma.role.findFirst({
      where: { name: 'VENDEDOR' }
    });

    if (!vendedorRole) {
      console.log('❌ Rol VENDEDOR no encontrado. Ejecuta el seed primero.');
      return;
    }

    console.log(`✅ Rol VENDEDOR encontrado: ${vendedorRole.id}`);

    // Buscar los módulos que el vendedor debe tener acceso
    const allowedModules = await prisma.systemModule.findMany({
      where: {
        name: {
          in: ['pos', 'ventas', 'productos']
        }
      }
    });

    console.log(`✅ Módulos encontrados: ${allowedModules.length}`);

    // Eliminar permisos existentes del vendedor
    await prisma.modulePermission.deleteMany({
      where: {
        roleId: vendedorRole.id
      }
    });

    console.log('🗑️ Permisos anteriores eliminados');

    // Configurar nuevos permisos
    for (const module of allowedModules) {
      const permissions = {
        canView: true,
        canCreate: module.name === 'ventas', // Solo puede crear ventas
        canEdit: false, // No puede editar productos
        canDelete: false, // No puede eliminar nada
        canExport: false, // No puede exportar
      };

      await prisma.modulePermission.create({
        data: {
          moduleId: module.id,
          roleId: vendedorRole.id,
          ...permissions,
        }
      });

      console.log(`✅ Permisos configurados para ${module.name}:`, permissions);
    }

    console.log('✅ Permisos del rol VENDEDOR actualizados correctamente');

  } catch (error) {
    console.error('❌ Error actualizando permisos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateVendedorPermissions();

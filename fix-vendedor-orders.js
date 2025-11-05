/**
 * Script para asignar permisos del módulo de Pedidos al rol VENDEDOR
 * Ejecutar con: node fix-vendedor-orders.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Asignando permisos de Pedidos al rol VENDEDOR...\n');

  try {
    // 1. Buscar el módulo de pedidos
    const module = await prisma.systemModule.findUnique({
      where: { name: 'pedidos' }
    });

    if (!module) {
      console.log('❌ El módulo de Pedidos no existe');
      console.log('💡 Ejecuta primero: node add-orders-module.js\n');
      return;
    }

    console.log('✅ Módulo encontrado:', module.displayName, '(ID:', module.id, ')\n');

    // 2. Buscar TODOS los roles para ver cuál es el VENDEDOR
    const allRoles = await prisma.role.findMany();
    console.log('📋 Roles en la base de datos:');
    allRoles.forEach(role => {
      console.log(`   - ${role.name} (ID: ${role.id})`);
    });
    console.log('');

    // 3. Buscar el rol VENDEDOR (puede estar en mayúsculas, minúsculas, etc.)
    const vendedorRole = allRoles.find(r => 
      r.name.toUpperCase() === 'VENDEDOR' || 
      r.name.toLowerCase() === 'vendedor' ||
      r.name.includes('VENDEDOR') ||
      r.name.includes('vendedor')
    );

    if (!vendedorRole) {
      console.log('❌ No se encontró el rol VENDEDOR');
      console.log('💡 Verifica el nombre exacto del rol en la lista anterior\n');
      return;
    }

    console.log('✅ Rol VENDEDOR encontrado:', vendedorRole.name, '(ID:', vendedorRole.id, ')\n');

    // 4. Verificar si ya tiene permisos
    const existingPermission = await prisma.modulePermission.findUnique({
      where: {
        moduleId_roleId: {
          moduleId: module.id,
          roleId: vendedorRole.id,
        }
      }
    });

    if (existingPermission) {
      console.log('⚠️  El rol VENDEDOR ya tiene permisos asignados');
      console.log('🔄 Actualizando permisos...\n');
    }

    // 5. Crear o actualizar permisos para VENDEDOR
    const permission = await prisma.modulePermission.upsert({
      where: {
        moduleId_roleId: {
          moduleId: module.id,
          roleId: vendedorRole.id,
        }
      },
      update: {
        canView: true,
        canCreate: true,
        canEdit: false,
        canDelete: false,
        canExport: false,
      },
      create: {
        moduleId: module.id,
        roleId: vendedorRole.id,
        canView: true,
        canCreate: true,
        canEdit: false,
        canDelete: false,
        canExport: false,
      },
    });

    console.log('✅ Permisos asignados correctamente al rol VENDEDOR\n');

    // 6. Mostrar resumen
    console.log('📊 Resumen de permisos para VENDEDOR:');
    console.log('   - Ver pedidos: ✓ (solo sus propios pedidos)');
    console.log('   - Crear pedidos: ✓');
    console.log('   - Editar pedidos: ✗');
    console.log('   - Eliminar pedidos: ✗');
    console.log('   - Exportar: ✗');

    console.log('\n🎉 ¡Configuración completada exitosamente!');
    console.log('\n💡 Próximos pasos:');
    console.log('   1. El usuario VENDEDOR debe cerrar sesión');
    console.log('   2. Volver a iniciar sesión');
    console.log('   3. El módulo "Pedidos" debería aparecer en el menú\n');

  } catch (error) {
    console.error('❌ Error:', error);
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

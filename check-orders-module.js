/**
 * Script para verificar si el módulo de Pedidos existe en la base de datos
 * Ejecutar con: node check-orders-module.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando módulo de Pedidos en la base de datos...\n');

  try {
    // Buscar el módulo de pedidos
    const module = await prisma.systemModule.findUnique({
      where: { name: 'pedidos' },
      include: {
        permissions: {
          include: {
            role: true,
          }
        }
      }
    });

    if (!module) {
      console.log('❌ El módulo de Pedidos NO existe en la base de datos');
      console.log('\n💡 Solución: Ejecuta el script de configuración:');
      console.log('   node add-orders-module.js\n');
      return;
    }

    console.log('✅ El módulo de Pedidos existe:');
    console.log('   ID:', module.id);
    console.log('   Nombre:', module.name);
    console.log('   Display Name:', module.displayName);
    console.log('   Ruta:', module.route);
    console.log('   Icono:', module.icon);
    console.log('\n📊 Permisos asignados:\n');

    if (module.permissions.length === 0) {
      console.log('⚠️  NO hay permisos asignados a ningún rol');
      console.log('\n💡 Solución: Ejecuta el script de configuración:');
      console.log('   node add-orders-module.js\n');
      return;
    }

    // Mostrar tabla de permisos
    console.table(module.permissions.map(p => ({
      'Rol': p.role.name,
      'Ver': p.canView ? '✓' : '✗',
      'Crear': p.canCreate ? '✓' : '✗',
      'Editar': p.canEdit ? '✓' : '✗',
      'Eliminar': p.canDelete ? '✓' : '✗',
    })));

    // Verificar específicamente el rol VENDEDOR
    const vendedorPermission = module.permissions.find(p => p.role.name === 'VENDEDOR');
    
    if (!vendedorPermission) {
      console.log('\n⚠️  El rol VENDEDOR NO tiene permisos asignados');
      console.log('\n💡 Solución: Ejecuta el script de configuración:');
      console.log('   node add-orders-module.js\n');
    } else {
      console.log('\n✅ El rol VENDEDOR tiene permisos asignados correctamente');
      console.log('   - Puede crear pedidos:', vendedorPermission.canCreate ? 'SÍ' : 'NO');
      console.log('   - Puede ver pedidos:', vendedorPermission.canView ? 'SÍ' : 'NO');
      console.log('   - Puede editar pedidos:', vendedorPermission.canEdit ? 'NO (correcto)' : 'SÍ (incorrecto)');
      console.log('   - Puede eliminar pedidos:', vendedorPermission.canDelete ? 'NO (correcto)' : 'SÍ (incorrecto)');
    }

    console.log('\n✨ Verificación completada\n');

  } catch (error) {
    console.error('❌ Error al verificar el módulo:', error);
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

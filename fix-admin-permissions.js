// Script para asignar permisos completos al rol admin
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAdminPermissions() {
  try {
    console.log('🔧 Arreglando permisos del rol admin...');

    // Buscar el rol admin (en minúsculas o mayúsculas)
    let adminRole = await prisma.role.findFirst({
      where: {
        OR: [
          { name: 'admin' },
          { name: 'ADMIN' },
          { name: 'Admin' },
          { name: 'administrador' },
          { name: 'Administrador' },
        ]
      }
    });

    if (!adminRole) {
      console.log('⚠️  No se encontró el rol admin. Creándolo...');
      adminRole = await prisma.role.create({
        data: {
          name: 'admin',
          description: 'Administrador del sistema'
        }
      });
      console.log('✅ Rol admin creado');
    } else {
      console.log(`✅ Rol encontrado: ${adminRole.name} (ID: ${adminRole.id})`);
    }

    // Obtener todos los módulos del sistema
    const modules = await prisma.systemModule.findMany();
    console.log(`📦 Se encontraron ${modules.length} módulos`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Asignar permisos completos a todos los módulos
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
        console.log(`  ✅ Permisos creados para módulo: ${module.displayName}`);
        created++;
      } else if (
        !existingPermission.canView ||
        !existingPermission.canCreate ||
        !existingPermission.canEdit ||
        !existingPermission.canDelete ||
        !existingPermission.canExport
      ) {
        // Actualizar permisos existentes para asegurar que todos están en true
        await prisma.modulePermission.update({
          where: { id: existingPermission.id },
          data: {
            canView: true,
            canCreate: true,
            canEdit: true,
            canDelete: true,
            canExport: true,
          },
        });
        console.log(`  ✅ Permisos actualizados para módulo: ${module.displayName}`);
        updated++;
      } else {
        skipped++;
      }
    }

    console.log('');
    console.log('📊 Resumen:');
    console.log(`   ✅ Permisos creados: ${created}`);
    console.log(`   🔄 Permisos actualizados: ${updated}`);
    console.log(`   ⏭️  Permisos omitidos (ya correctos): ${skipped}`);
    console.log('');
    console.log('✅ ¡Permisos del rol admin configurados correctamente!');
    console.log('🔑 Ahora el usuario admin debería poder ver el stock y acceder a todo');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
fixAdminPermissions()
  .catch((e) => {
    console.error('❌ Error fatal:', e);
    process.exit(1);
  });

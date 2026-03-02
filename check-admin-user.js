// Script para verificar el rol del usuario admin
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdminUser() {
  try {
    console.log('🔍 Verificando usuario admin...\n');

    // Buscar usuario admin
    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!adminUser) {
      console.log('❌ Usuario admin no encontrado');
      return;
    }

    console.log('👤 Usuario encontrado:');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Nombre: ${adminUser.name}`);
    console.log(`   Username: ${adminUser.username}`);
    console.log('');
    console.log('🏷️  Roles asignados:');
    
    if (adminUser.roles.length === 0) {
      console.log('   ⚠️  No tiene roles asignados');
    } else {
      adminUser.roles.forEach(ur => {
        console.log(`   - ${ur.role.name} (ID: ${ur.role.id})`);
      });
    }

    // Listar todos los roles disponibles
    console.log('');
    console.log('📋 Todos los roles en el sistema:');
    const allRoles = await prisma.role.findMany();
    allRoles.forEach(role => {
      const userCount = adminUser.roles.filter(ur => ur.roleId === role.id).length;
      const marker = userCount > 0 ? '✅' : '  ';
      console.log(`   ${marker} ${role.name} (ID: ${role.id}) - ${role.description || 'Sin descripción'}`);
    });

    // Verificar permisos
    console.log('');
    if (adminUser.roles.length > 0) {
      console.log('🔐 Verificando permisos del usuario...');
      for (const userRole of adminUser.roles) {
        const permissions = await prisma.modulePermission.findMany({
          where: { roleId: userRole.roleId },
          include: {
            module: true
          }
        });
        console.log(`\n   Rol: ${userRole.role.name} - ${permissions.length} permisos configurados`);
        if (permissions.length > 0) {
          permissions.slice(0, 5).forEach(perm => {
            console.log(`     - ${perm.module.displayName}: View=${perm.canView}, Edit=${perm.canEdit}`);
          });
          if (permissions.length > 5) {
            console.log(`     ... y ${permissions.length - 5} más`);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
checkAdminUser()
  .catch((e) => {
    console.error('❌ Error fatal:', e);
    process.exit(1);
  });

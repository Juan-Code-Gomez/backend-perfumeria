const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function preDeploymentCheck() {
  try {
    console.log('🔍 Verificación pre-despliegue...\n');

    // 1. Verificar conexión a base de datos
    console.log('1️⃣ Verificando conexión a base de datos...');
    await prisma.$connect();
    console.log('✅ Conexión a base de datos exitosa\n');

    // 2. Verificar estado actual de roles
    console.log('2️⃣ Verificando roles existentes...');
    const roles = await prisma.role.findMany();
    console.log(`📋 Roles encontrados: ${roles.length}`);
    roles.forEach(role => {
      console.log(`   • ${role.name}: ${role.description}`);
    });
    console.log('');

    // 3. Verificar módulos del sistema
    console.log('3️⃣ Verificando módulos del sistema...');
    const modules = await prisma.systemModule.findMany({
      orderBy: { order: 'asc' }
    });
    console.log(`📋 Módulos encontrados: ${modules.length}`);
    modules.forEach(module => {
      console.log(`   • ${module.name}: ${module.displayName}`);
    });
    console.log('');

    // 4. Verificar permisos existentes
    console.log('4️⃣ Verificando permisos existentes...');
    const permissions = await prisma.modulePermission.findMany({
      include: {
        role: true,
        module: true
      }
    });
    console.log(`📋 Permisos configurados: ${permissions.length}`);
    
    const permissionsByRole = permissions.reduce((acc, perm) => {
      const roleName = perm.role.name;
      if (!acc[roleName]) acc[roleName] = [];
      acc[roleName].push(perm.module.name);
      return acc;
    }, {});

    Object.entries(permissionsByRole).forEach(([role, modules]) => {
      console.log(`   • ${role}: ${modules.length} módulos`);
    });
    console.log('');

    // 5. Verificar usuarios existentes
    console.log('5️⃣ Verificando usuarios existentes...');
    const users = await prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
    console.log(`👥 Usuarios encontrados: ${users.length}`);
    users.forEach(user => {
      const userRoles = user.roles.map(ur => ur.role.name).join(', ');
      console.log(`   • ${user.username} (${user.name}): ${userRoles}`);
    });
    console.log('');

    // 6. Determinar qué necesita ser migrado
    console.log('6️⃣ Análisis de migración requerida...');
    
    const vendedorRole = roles.find(r => r.name === 'VENDEDOR');
    const requiredModules = ['pos', 'ventas', 'productos', 'gastos', 'cierres-caja', 'facturas'];
    const missingModules = requiredModules.filter(name => 
      !modules.find(m => m.name === name)
    );
    
    const vendedorUser = users.find(u => u.username === 'vendedor');
    
    console.log('📋 ESTADO DE MIGRACIÓN:');
    console.log('═══════════════════════');
    console.log(`✅ Rol VENDEDOR: ${vendedorRole ? 'Existe' : 'Necesita crearse'}`);
    console.log(`✅ Módulos faltantes: ${missingModules.length === 0 ? 'Ninguno' : missingModules.join(', ')}`);
    console.log(`✅ Usuario vendedor: ${vendedorUser ? 'Existe' : 'Necesita crearse'}`);
    
    if (vendedorRole) {
      const vendedorPermissions = permissions.filter(p => p.role.name === 'VENDEDOR');
      console.log(`✅ Permisos VENDEDOR: ${vendedorPermissions.length} configurados`);
    }

    // 7. Recomendaciones
    console.log('\n7️⃣ Recomendaciones para despliegue...');
    console.log('══════════════════════════════════════');
    
    if (!vendedorRole || missingModules.length > 0 || !vendedorUser) {
      console.log('🚨 MIGRACIÓN REQUERIDA:');
      console.log('   1. Ejecutar script de migración de producción');
      console.log('   2. Verificar permisos después del despliegue');
      console.log('   3. Probar login con usuario vendedor');
    } else {
      console.log('✅ SISTEMA LISTO:');
      console.log('   • Todos los componentes necesarios están presentes');
      console.log('   • Se puede proceder con el despliegue normal');
    }

    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log('════════════════════');
    console.log('1. Hacer commit de los cambios');
    console.log('2. Push a la rama main');
    console.log('3. Ejecutar migración en producción (si es necesario)');
    console.log('4. Verificar funcionalidad del rol vendedor');

    return {
      rolesCount: roles.length,
      modulesCount: modules.length,
      permissionsCount: permissions.length,
      usersCount: users.length,
      needsMigration: !vendedorRole || missingModules.length > 0 || !vendedorUser
    };

  } catch (error) {
    console.error('❌ Error en verificación pre-despliegue:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  preDeploymentCheck()
    .then((result) => {
      console.log('\n✅ Verificación completada');
      process.exit(result.needsMigration ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Error en verificación:', error);
      process.exit(1);
    });
}

module.exports = { preDeploymentCheck };

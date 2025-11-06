/**
 * Verificar deployment del módulo de pedidos en producción
 */

const { PrismaClient } = require('@prisma/client');

const CLIENTS = [
  {
    name: 'Cliente 1 - Tramway',
    dbUrl: 'postgresql://postgres:huyVrrXIlyNOWCIXYnMuHNSACuYhDbog@tramway.proxy.rlwy.net:58936/railway'
  },
  {
    name: 'Cliente 2 - Shinkansen',
    dbUrl: 'postgresql://postgres:SJBYEwPzlxYkrgMupzDOWYTAUXICMCHT@shinkansen.proxy.rlwy.net:21931/railway'
  },
  {
    name: 'Cliente 3 - Turntable',
    dbUrl: 'postgresql://postgres:sramdnCvXZjwgHUZBUBvkvWGSvRuGgrZ@turntable.proxy.rlwy.net:38668/railway'
  }
];

async function verifyClient(client) {
  console.log('\n' + '='.repeat(60));
  console.log(`🔍 Verificando: ${client.name}`);
  console.log('='.repeat(60));

  const prisma = new PrismaClient({
    datasources: { db: { url: client.dbUrl } }
  });

  try {
    // 1. Verificar tablas
    const tables = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' AND tablename IN ('orders', 'order_details', 'order_history')
      ORDER BY tablename;
    `;
    
    console.log(`\n📋 Tablas (${tables.length}/3):`);
    tables.forEach(t => console.log(`  ✅ ${t.tablename}`));

    // 2. Verificar módulo
    const module = await prisma.$queryRaw`
      SELECT id, name, "displayName", route, "isActive"
      FROM system_modules
      WHERE name = 'pedidos';
    `;
    
    if (module.length > 0) {
      console.log(`\n📦 Módulo:`);
      console.log(`  ✅ ID: ${module[0].id}`);
      console.log(`  ✅ Nombre: ${module[0].displayName}`);
      console.log(`  ✅ Ruta: ${module[0].route}`);
      console.log(`  ✅ Activo: ${module[0].isActive}`);

      // 3. Verificar permisos
      const permissions = await prisma.$queryRaw`
        SELECT r.name, mp."canView", mp."canCreate", mp."canEdit", mp."canDelete"
        FROM module_permissions mp
        JOIN "Role" r ON r.id = mp."roleId"
        WHERE mp."moduleId" = ${module[0].id}
        ORDER BY r.name;
      `;

      console.log(`\n🔐 Permisos (${permissions.length}):`);
      permissions.forEach(p => {
        const perms = [];
        if (p.canView) perms.push('ver');
        if (p.canCreate) perms.push('crear');
        if (p.canEdit) perms.push('editar');
        if (p.canDelete) perms.push('eliminar');
        console.log(`  ✅ ${p.name}: ${perms.join(', ')}`);
      });
    } else {
      console.log('\n❌ Módulo NO encontrado');
    }

    // 4. Verificar columna reservedStock
    const productColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'Product' AND column_name = 'reservedStock';
    `;
    
    console.log(`\n🏷️  Columna reservedStock: ${productColumns.length > 0 ? '✅ Existe' : '❌ No existe'}`);

    console.log(`\n✅ Verificación completada para ${client.name}`);
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('\n📊 VERIFICACIÓN DEL DEPLOYMENT DE PEDIDOS\n');

  for (const client of CLIENTS) {
    await verifyClient(client);
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Verificación completada\n');
}

main().catch(console.error);

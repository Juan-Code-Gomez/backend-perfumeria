/**
 * Script de Diagnóstico de Errores en Producción
 * 
 * Verifica el estado de las tablas críticas después del deployment
 */

const { PrismaClient } = require('@prisma/client');

// Cliente de producción (usa el primero para diagnóstico)
const PRODUCTION_DB = 'postgresql://postgres:huyVrrXIlyNOWCIXYnMuHNSACuYhDbog@tramway.proxy.rlwy.net:58936/railway';

async function diagnose() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: PRODUCTION_DB
      }
    }
  });

  console.log('\n🔍 DIAGNÓSTICO DE BASE DE DATOS EN PRODUCCIÓN\n');
  console.log('=' .repeat(60));

  try {
    // 1. Verificar que las tablas existan
    console.log('\n📋 Verificando existencia de tablas...\n');
    
    const tables = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `;
    
    console.log('Tablas encontradas:');
    tables.forEach(t => console.log(`  - ${t.tablename}`));
    
    const requiredTables = ['Order', 'OrderDetail', 'OrderHistory', 'SystemModule', 'ModulePermission'];
    const missingTables = requiredTables.filter(
      required => !tables.some(t => t.tablename === required)
    );
    
    if (missingTables.length > 0) {
      console.log('\n❌ TABLAS FALTANTES:', missingTables.join(', '));
    } else {
      console.log('\n✅ Todas las tablas requeridas existen');
    }

    // 2. Verificar estructura de la tabla Order
    console.log('\n📊 Verificando estructura de tabla Order...\n');
    
    const orderColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Order'
      ORDER BY ordinal_position;
    `;
    
    console.log('Columnas de Order:');
    orderColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // 3. Verificar módulo de pedidos
    console.log('\n📦 Verificando módulo de pedidos...\n');
    
    const ordersModule = await prisma.systemModule.findUnique({
      where: { name: 'pedidos' },
      include: {
        permissions: {
          include: {
            role: true
          }
        }
      }
    });

    if (ordersModule) {
      console.log('✅ Módulo de pedidos encontrado:');
      console.log(`  - ID: ${ordersModule.id}`);
      console.log(`  - Nombre: ${ordersModule.displayName}`);
      console.log(`  - Ruta: ${ordersModule.route}`);
      console.log(`  - Permisos configurados: ${ordersModule.permissions.length}`);
      
      ordersModule.permissions.forEach(perm => {
        console.log(`    • ${perm.role.name}: view=${perm.canView}, create=${perm.canCreate}, edit=${perm.canEdit}, delete=${perm.canDelete}`);
      });
    } else {
      console.log('❌ Módulo de pedidos NO encontrado');
    }

    // 4. Contar registros en tablas nuevas
    console.log('\n📈 Contando registros...\n');
    
    const orderCount = await prisma.order.count();
    const orderDetailCount = await prisma.orderDetail.count();
    const orderHistoryCount = await prisma.orderHistory.count();
    
    console.log(`Orders: ${orderCount}`);
    console.log(`OrderDetails: ${orderDetailCount}`);
    console.log(`OrderHistory: ${orderHistoryCount}`);

    // 5. Verificar columna reservedStock en Product
    console.log('\n🏷️  Verificando columna reservedStock en Product...\n');
    
    const productColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'Product' AND column_name = 'reservedStock';
    `;
    
    if (productColumns.length > 0) {
      console.log('✅ Columna reservedStock existe:');
      productColumns.forEach(col => {
        console.log(`  - Tipo: ${col.data_type}`);
        console.log(`  - Default: ${col.column_default}`);
      });
      
      // Verificar si hay productos con stock reservado
      const productsWithReserved = await prisma.product.findMany({
        where: {
          reservedStock: {
            gt: 0
          }
        },
        select: {
          id: true,
          name: true,
          stock: true,
          reservedStock: true
        },
        take: 5
      });
      
      if (productsWithReserved.length > 0) {
        console.log('\n📦 Productos con stock reservado:');
        productsWithReserved.forEach(p => {
          console.log(`  - ${p.name}: Stock=${p.stock}, Reservado=${p.reservedStock}`);
        });
      } else {
        console.log('\n📦 No hay productos con stock reservado (normal si no hay pedidos)');
      }
    } else {
      console.log('❌ Columna reservedStock NO existe en Product');
    }

    // 6. Intentar una consulta de dashboard
    console.log('\n📊 Probando consulta de dashboard...\n');
    
    try {
      const testDashboard = await prisma.sale.count();
      console.log(`✅ Consulta de ventas exitosa: ${testDashboard} ventas`);
    } catch (error) {
      console.log('❌ Error en consulta de dashboard:', error.message);
    }

    // 7. Verificar índices y foreign keys
    console.log('\n🔗 Verificando foreign keys de Order...\n');
    
    const foreignKeys = await prisma.$queryRaw`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'Order' AND tc.constraint_type = 'FOREIGN KEY';
    `;
    
    if (foreignKeys.length > 0) {
      console.log('Foreign keys encontradas:');
      foreignKeys.forEach(fk => {
        console.log(`  - ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    } else {
      console.log('⚠️  No se encontraron foreign keys para Order');
    }

  } catch (error) {
    console.error('\n❌ ERROR DURANTE DIAGNÓSTICO:', error.message);
    console.error('\nStack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
    console.log('\n' + '='.repeat(60));
    console.log('🏁 Diagnóstico completado\n');
  }
}

diagnose();

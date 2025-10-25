#!/usr/bin/env node

/**
 * 🔍 DIAGNÓSTICO DE BASE DE DATOS - DASHBOARD
 * 
 * Este script te ayuda a identificar qué está fallando en el dashboard
 * ejecutando las mismas consultas que hace el servicio.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// Colores para logs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('');
  log('═══════════════════════════════════════════════════', 'cyan');
  log(`  ${title}`, 'cyan');
  log('═══════════════════════════════════════════════════', 'cyan');
}

async function testConnection() {
  section('1. PRUEBA DE CONEXIÓN A BASE DE DATOS');
  
  try {
    await prisma.$queryRaw`SELECT 1 as test`;
    log('✓ Conexión exitosa a la base de datos', 'green');
    return true;
  } catch (error) {
    log('✗ Error de conexión a la base de datos', 'red');
    console.error(error.message);
    return false;
  }
}

async function testTables() {
  section('2. VERIFICAR TABLAS EXISTENTES');
  
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    log(`✓ Encontradas ${tables.length} tablas:`, 'green');
    tables.forEach(t => {
      console.log(`  - ${t.table_name}`);
    });
    
    // Verificar tablas críticas para el dashboard
    const criticalTables = ['Sale', 'Expense', 'Product', 'CashClosing', 'Purchase'];
    const missingTables = criticalTables.filter(ct => 
      !tables.some(t => t.table_name === ct)
    );
    
    if (missingTables.length > 0) {
      log(`⚠️  Faltan tablas críticas: ${missingTables.join(', ')}`, 'yellow');
      return false;
    }
    
    return true;
  } catch (error) {
    log('✗ Error al verificar tablas', 'red');
    console.error(error.message);
    return false;
  }
}

async function testSalesTable() {
  section('3. PRUEBA: TABLA SALE (Ventas)');
  
  try {
    const count = await prisma.sale.count();
    log(`✓ Tabla Sale: ${count} registros`, 'green');
    
    if (count > 0) {
      const sample = await prisma.sale.findFirst({
        include: { details: true }
      });
      log(`  Ejemplo de venta:`, 'cyan');
      console.log(`    ID: ${sample.id}`);
      console.log(`    Fecha: ${sample.date}`);
      console.log(`    Total: $${sample.totalAmount}`);
      console.log(`    Detalles: ${sample.details.length} productos`);
    }
    
    return true;
  } catch (error) {
    log('✗ Error al consultar tabla Sale', 'red');
    console.error(error);
    return false;
  }
}

async function testExpenseTable() {
  section('4. PRUEBA: TABLA EXPENSE (Gastos)');
  
  try {
    const count = await prisma.expense.count({
      where: { deletedAt: null }
    });
    log(`✓ Tabla Expense: ${count} registros activos`, 'green');
    
    if (count > 0) {
      const sample = await prisma.expense.findFirst({
        where: { deletedAt: null }
      });
      log(`  Ejemplo de gasto:`, 'cyan');
      console.log(`    ID: ${sample.id}`);
      console.log(`    Descripción: ${sample.description}`);
      console.log(`    Monto: $${sample.amount}`);
      console.log(`    Fecha: ${sample.date}`);
    }
    
    return true;
  } catch (error) {
    log('✗ Error al consultar tabla Expense', 'red');
    console.error(error);
    return false;
  }
}

async function testProductTable() {
  section('5. PRUEBA: TABLA PRODUCT (Productos)');
  
  try {
    const count = await prisma.product.count();
    log(`✓ Tabla Product: ${count} registros`, 'green');
    
    if (count > 0) {
      const sample = await prisma.product.findFirst();
      log(`  Ejemplo de producto:`, 'cyan');
      console.log(`    ID: ${sample.id}`);
      console.log(`    Nombre: ${sample.name}`);
      console.log(`    Stock: ${sample.stock}`);
      console.log(`    Precio Compra: $${sample.purchasePrice}`);
      console.log(`    Precio Venta: $${sample.salePrice}`);
    }
    
    return true;
  } catch (error) {
    log('✗ Error al consultar tabla Product', 'red');
    console.error(error);
    return false;
  }
}

async function testCashClosingTable() {
  section('6. PRUEBA: TABLA CASHCLOSING (Cierres de Caja)');
  
  try {
    const count = await prisma.cashClosing.count();
    log(`✓ Tabla CashClosing: ${count} registros`, 'green');
    
    if (count > 0) {
      const sample = await prisma.cashClosing.findFirst({
        orderBy: { date: 'desc' }
      });
      log(`  Último cierre de caja:`, 'cyan');
      console.log(`    ID: ${sample.id}`);
      console.log(`    Fecha: ${sample.date}`);
      console.log(`    Total: $${sample.totalCash}`);
    } else {
      log(`  ⚠️  No hay cierres de caja registrados`, 'yellow');
    }
    
    return true;
  } catch (error) {
    log('✗ Error al consultar tabla CashClosing', 'red');
    console.error(error);
    return false;
  }
}

async function testDashboardQuery() {
  section('7. PRUEBA: CONSULTA COMPLETA DEL DASHBOARD');
  
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    log('Ejecutando consultas del dashboard...', 'blue');
    
    // Ventas de hoy
    const salesToday = await prisma.sale.findMany({
      where: { date: { gte: todayStart, lte: todayEnd } },
      include: { details: { include: { product: true } } },
    });
    log(`  ✓ Ventas de hoy: ${salesToday.length}`, 'green');
    
    // Ventas del mes
    const salesMonth = await prisma.sale.findMany({
      where: { date: { gte: monthStart } },
    });
    log(`  ✓ Ventas del mes: ${salesMonth.length}`, 'green');
    
    // Gastos del mes
    const expensesMonth = await prisma.expense.findMany({
      where: { 
        date: { gte: monthStart },
        deletedAt: null 
      },
    });
    log(`  ✓ Gastos del mes: ${expensesMonth.length}`, 'green');
    
    // Productos
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        stock: true,
        purchasePrice: true,
      }
    });
    log(`  ✓ Productos: ${products.length}`, 'green');
    
    // Calcular totales
    const totalSalesToday = salesToday.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const totalSalesMonth = salesMonth.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const totalExpensesMonth = expensesMonth.reduce((sum, e) => sum + Number(e.amount), 0);
    
    log('', 'reset');
    log('RESUMEN:', 'cyan');
    console.log(`  Ventas hoy: $${totalSalesToday.toFixed(2)}`);
    console.log(`  Ventas mes: $${totalSalesMonth.toFixed(2)}`);
    console.log(`  Gastos mes: $${totalExpensesMonth.toFixed(2)}`);
    console.log(`  Utilidad mes: $${(totalSalesMonth - totalExpensesMonth).toFixed(2)}`);
    
    return true;
  } catch (error) {
    log('✗ Error en consulta del dashboard', 'red');
    console.error('Error detallado:', error);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

async function checkSchemaIssues() {
  section('8. VERIFICAR PROBLEMAS DE SCHEMA');
  
  try {
    // Verificar campos que podrían faltar
    log('Verificando campos en Sale...', 'blue');
    const sale = await prisma.sale.findFirst();
    
    if (sale) {
      const expectedFields = ['id', 'date', 'totalAmount', 'isPaid', 'paymentMethod'];
      const missingFields = expectedFields.filter(field => !(field in sale));
      
      if (missingFields.length > 0) {
        log(`⚠️  Campos faltantes en Sale: ${missingFields.join(', ')}`, 'yellow');
      } else {
        log('✓ Todos los campos esperados presentes en Sale', 'green');
      }
    } else {
      log('⚠️  No hay registros en Sale para verificar', 'yellow');
    }
    
    return true;
  } catch (error) {
    log('✗ Error al verificar schema', 'red');
    console.error(error);
    return false;
  }
}

async function checkMigrations() {
  section('9. VERIFICAR MIGRACIONES APLICADAS');
  
  try {
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at, applied_steps_count
      FROM _prisma_migrations
      ORDER BY finished_at DESC
      LIMIT 10
    `;
    
    log(`✓ Últimas ${migrations.length} migraciones aplicadas:`, 'green');
    migrations.forEach(m => {
      console.log(`  - ${m.migration_name} (${m.applied_steps_count} pasos)`);
      console.log(`    Aplicada: ${m.finished_at}`);
    });
    
    // Verificar que el baseline está
    const hasBaseline = migrations.some(m => 
      m.migration_name.includes('baseline_complete_schema')
    );
    
    if (hasBaseline) {
      log('✓ Baseline migration encontrada', 'green');
    } else {
      log('⚠️  No se encontró baseline migration', 'yellow');
    }
    
    return true;
  } catch (error) {
    log('✗ Error al verificar migraciones', 'red');
    console.error(error);
    return false;
  }
}

async function main() {
  console.log('');
  log('╔═══════════════════════════════════════════════════╗', 'magenta');
  log('║  🔍 DIAGNÓSTICO DE BASE DE DATOS - DASHBOARD      ║', 'magenta');
  log('╚═══════════════════════════════════════════════════╝', 'magenta');
  console.log('');
  
  log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✓ Configurada' : '✗ No configurada'}`, 
    process.env.DATABASE_URL ? 'green' : 'red');
  
  const results = {
    connection: false,
    tables: false,
    sales: false,
    expenses: false,
    products: false,
    cashClosing: false,
    dashboard: false,
    schema: false,
    migrations: false,
  };
  
  // Ejecutar todas las pruebas
  results.connection = await testConnection();
  if (!results.connection) {
    log('', 'reset');
    log('❌ No se pudo conectar a la base de datos. Verifica DATABASE_URL', 'red');
    await prisma.$disconnect();
    process.exit(1);
  }
  
  results.tables = await testTables();
  results.sales = await testSalesTable();
  results.expenses = await testExpenseTable();
  results.products = await testProductTable();
  results.cashClosing = await testCashClosingTable();
  results.schema = await checkSchemaIssues();
  results.migrations = await checkMigrations();
  results.dashboard = await testDashboardQuery();
  
  // Resumen
  section('RESUMEN DE DIAGNÓSTICO');
  
  const allPassed = Object.values(results).every(r => r === true);
  
  Object.entries(results).forEach(([test, passed]) => {
    log(`${passed ? '✓' : '✗'} ${test}`, passed ? 'green' : 'red');
  });
  
  console.log('');
  if (allPassed) {
    log('✅ TODAS LAS PRUEBAS PASARON', 'green');
    log('El problema podría estar en:', 'yellow');
    log('  1. Variables de entorno en Railway (DATABASE_URL)', 'yellow');
    log('  2. Permisos de la base de datos', 'yellow');
    log('  3. Error en otro servicio (CapitalService, InvoiceService)', 'yellow');
  } else {
    log('❌ ALGUNAS PRUEBAS FALLARON', 'red');
    log('Revisa los errores arriba para identificar el problema', 'yellow');
  }
  
  console.log('');
  log('═══════════════════════════════════════════════════', 'cyan');
  
  await prisma.$disconnect();
}

main()
  .catch((error) => {
    console.error('Error fatal:', error);
    prisma.$disconnect();
    process.exit(1);
  });

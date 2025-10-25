const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURACIÓN DE BASES DE DATOS
// ============================================
// Agrega aquí las URLs de las otras 3 bases de datos
const databases = [
  {
    name: 'Producción Principal',
    url: process.env.DATABASE_URL, // La que ya tienes configurada
  },
  {
    name: 'Cliente 2',
    url: 'postgresql://usuario:password@host:puerto/database', // Reemplazar con datos reales
  },
  {
    name: 'Cliente 3',
    url: 'postgresql://usuario:password@host:puerto/database', // Reemplazar con datos reales
  },
  {
    name: 'Cliente 4',
    url: 'postgresql://usuario:password@host:puerto/database', // Reemplazar con datos reales
  },
];

// ============================================
// FUNCIÓN PARA APLICAR FIX EN UNA BD
// ============================================
async function applyFixToDatabase(dbConfig) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbConfig.url,
      },
    },
  });

  try {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`🔧 Aplicando fix a: ${dbConfig.name}`);
    console.log(`${'═'.repeat(60)}`);

    // Leer el script SQL
    const sqlScript = fs.readFileSync(
      path.join(__dirname, 'fix-all-missing-columns.sql'),
      'utf8'
    );

    // Ejecutar el script
    console.log('📝 Ejecutando script SQL...');
    await prisma.$executeRawUnsafe(sqlScript);

    // Verificar columnas de Purchase
    const purchaseColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'Purchase' 
      AND column_name IN ('subtotal', 'discount', 'invoiceNumber', 'invoiceDate', 'dueDate', 'notes')
      ORDER BY column_name;
    `;

    // Verificar columna de Invoice
    const invoiceNotes = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'Invoice' 
      AND column_name = 'notes';
    `;

    console.log('\n📊 Verificación:');
    console.log(`  Purchase: ${purchaseColumns.length}/6 columnas agregadas`);
    console.log(`  Invoice: ${invoiceNotes.length}/1 columna agregada`);

    if (purchaseColumns.length === 6 && invoiceNotes.length === 1) {
      console.log('\n✅ FIX APLICADO EXITOSAMENTE');
      return { success: true, database: dbConfig.name };
    } else {
      console.log('\n⚠️  Algunas columnas podrían no haberse agregado');
      return { 
        success: false, 
        database: dbConfig.name,
        error: 'No todas las columnas fueron agregadas'
      };
    }

  } catch (error) {
    console.error(`\n❌ Error en ${dbConfig.name}:`, error.message);
    return { 
      success: false, 
      database: dbConfig.name, 
      error: error.message 
    };
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================
async function applyFixToAllDatabases() {
  console.log('🚀 INICIANDO APLICACIÓN DE FIXES EN MÚLTIPLES BASES DE DATOS');
  console.log(`Total de bases de datos: ${databases.length}\n`);

  const results = [];

  // Ejecutar en serie (una por una) para evitar problemas de conexión
  for (const db of databases) {
    const result = await applyFixToDatabase(db);
    results.push(result);
  }

  // Mostrar resumen final
  console.log('\n\n');
  console.log('═'.repeat(60));
  console.log('📈 RESUMEN FINAL');
  console.log('═'.repeat(60));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n✅ Exitosos: ${successful.length}/${results.length}`);
  successful.forEach(r => {
    console.log(`   ✓ ${r.database}`);
  });

  if (failed.length > 0) {
    console.log(`\n❌ Fallidos: ${failed.length}/${results.length}`);
    failed.forEach(r => {
      console.log(`   ✗ ${r.database}`);
      console.log(`     Error: ${r.error}`);
    });
  }

  console.log('\n' + '═'.repeat(60));
}

// ============================================
// EJECUTAR
// ============================================
applyFixToAllDatabases()
  .then(() => {
    console.log('\n🎉 Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });

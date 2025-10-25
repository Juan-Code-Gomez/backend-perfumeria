const { execSync } = require('child_process');
const fs = require('fs');

// Colores
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkDatabaseDiff() {
  log('\n====================================================', 'cyan');
  log('  VERIFICADOR DE DIFERENCIAS - PRODUCCIÓN vs LOCAL', 'cyan');
  log('====================================================\n', 'cyan');

  try {
    // Cargar variables de entorno
    require('dotenv').config();
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      log('❌ Error: DATABASE_URL no configurado en .env', 'red');
      log('💡 Configura DATABASE_URL en tu archivo .env apuntando a PRODUCCIÓN', 'yellow');
      process.exit(1);
    }

    log('📊 Analizando diferencias entre:', 'blue');
    log(`   Schema Local: prisma/schema.prisma`, 'blue');
    log(`   Base de Datos: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`, 'blue');

    // Ejecutar prisma migrate diff
    log('\n🔍 Ejecutando análisis con Prisma...', 'blue');
    
    try {
      const output = execSync(
        'npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma --script',
        { encoding: 'utf-8' }
      );

      if (output.trim() === '' || output.includes('No difference detected')) {
        log('\n✅ ¡BASES DE DATOS SINCRONIZADAS!', 'green');
        log('   No hay diferencias entre local y producción.', 'green');
        log('   No se requiere migración.\n', 'green');
        return;
      }

      log('\n⚠️  DIFERENCIAS DETECTADAS:', 'yellow');
      log('   La base de datos de producción NO está sincronizada con el schema local.\n', 'yellow');

      // Guardar el diff en un archivo
      const diffFile = 'production-diff.sql';
      fs.writeFileSync(diffFile, output);
      
      log(`💾 Diferencias guardadas en: ${diffFile}`, 'cyan');
      log('\n📋 Vista previa de cambios necesarios:', 'magenta');
      log('─'.repeat(60), 'magenta');
      
      // Mostrar primeras líneas del diff
      const lines = output.split('\n').slice(0, 30);
      lines.forEach(line => {
        if (line.includes('CREATE TABLE')) {
          log(line, 'green');
        } else if (line.includes('ALTER TABLE')) {
          log(line, 'yellow');
        } else if (line.includes('CREATE INDEX')) {
          log(line, 'cyan');
        } else if (line.includes('DROP')) {
          log(line, 'red');
        } else {
          console.log(line);
        }
      });
      
      if (output.split('\n').length > 30) {
        log(`\n... (${output.split('\n').length - 30} líneas más)`, 'cyan');
      }
      
      log('─'.repeat(60), 'magenta');

      log('\n📝 Resumen de cambios:', 'blue');
      const createTables = (output.match(/CREATE TABLE/g) || []).length;
      const alterTables = (output.match(/ALTER TABLE/g) || []).length;
      const createIndexes = (output.match(/CREATE INDEX/g) || []).length;
      const dropTables = (output.match(/DROP TABLE/g) || []).length;

      if (createTables > 0) log(`   ✓ Tablas a crear: ${createTables}`, 'green');
      if (alterTables > 0) log(`   ✓ Tablas a modificar: ${alterTables}`, 'yellow');
      if (createIndexes > 0) log(`   ✓ Índices a crear: ${createIndexes}`, 'cyan');
      if (dropTables > 0) log(`   ⚠️  Tablas a eliminar: ${dropTables}`, 'red');

      log('\n💡 Recomendaciones:', 'blue');
      log('   1. Usar sync-production-safe.sql (más seguro, incluye IF NOT EXISTS)', 'blue');
      log('   2. O revisar production-diff.sql generado y ejecutarlo manualmente', 'blue');
      log('   3. Hacer backup antes de aplicar cambios', 'blue');

      log('\n🚀 Para aplicar sincronización segura:', 'green');
      log('   node execute-sync-production.js', 'green');

    } catch (error) {
      if (error.message.includes('No difference detected')) {
        log('\n✅ ¡BASES DE DATOS SINCRONIZADAS!', 'green');
        log('   No hay diferencias entre local y producción.\n', 'green');
        return;
      }

      log('\n❌ Error al analizar diferencias:', 'red');
      console.error(error.message);
      
      log('\n💡 Posibles causas:', 'yellow');
      log('   - No se puede conectar a la base de datos de producción', 'yellow');
      log('   - Credenciales incorrectas en DATABASE_URL', 'yellow');
      log('   - Firewall bloqueando la conexión', 'yellow');
      
      log('\n💡 Solución alternativa:', 'blue');
      log('   Usa sync-production-safe.sql que es 100% seguro y no requiere conexión previa.', 'blue');
      log('   Este script incluye todas las verificaciones IF NOT EXISTS.', 'blue');
    }

  } catch (error) {
    log('\n❌ Error inesperado:', 'red');
    console.error(error.message);
  }

  log('\n====================================================\n', 'cyan');
}

checkDatabaseDiff();

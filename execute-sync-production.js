const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  log('\n====================================================', 'cyan');
  log('  SINCRONIZACIÓN SEGURA - PRODUCCIÓN', 'cyan');
  log('====================================================\n', 'cyan');

  try {
    // 1. Verificar que existe el archivo SQL
    const sqlFile = path.join(__dirname, 'sync-production-safe.sql');
    if (!fs.existsSync(sqlFile)) {
      log('❌ Error: No se encuentra el archivo sync-production-safe.sql', 'red');
      process.exit(1);
    }

    log('✓ Archivo SQL encontrado', 'green');

    // 2. Leer la configuración de la base de datos
    require('dotenv').config();
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      log('❌ Error: DATABASE_URL no configurado en .env', 'red');
      process.exit(1);
    }

    log('✓ Configuración de base de datos cargada', 'green');

    // 3. Confirmar ejecución
    log('\n⚠️  IMPORTANTE:', 'yellow');
    log('  Este script sincronizará la base de datos con el schema actual.', 'yellow');
    log('  NO borrará datos existentes, solo agregará/modificará estructura.', 'yellow');
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      readline.question('\n¿Continuar con la migración? (si/no): ', resolve);
    });
    readline.close();

    if (answer.toLowerCase() !== 'si' && answer.toLowerCase() !== 's') {
      log('\n❌ Migración cancelada por el usuario', 'yellow');
      process.exit(0);
    }

    // 4. Ejecutar el script SQL usando psql
    log('\n🔄 Ejecutando migración...', 'blue');
    
    try {
      const command = `psql "${databaseUrl}" -f "${sqlFile}"`;
      const output = execSync(command, { encoding: 'utf-8' });
      
      log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE\n', 'green');
      log('Resultado:', 'cyan');
      console.log(output);

    } catch (error) {
      log('\n❌ Error al ejecutar la migración:', 'red');
      console.error(error.message);
      
      log('\n💡 Alternativas:', 'yellow');
      log('1. Ejecutar manualmente en pgAdmin:', 'yellow');
      log('   - Abrir pgAdmin', 'yellow');
      log('   - Query Tool → Abrir sync-production-safe.sql', 'yellow');
      log('   - Ejecutar (F5)', 'yellow');
      log('\n2. Usar psql directamente desde terminal:', 'yellow');
      log(`   psql "${databaseUrl}" -f sync-production-safe.sql`, 'yellow');
      
      process.exit(1);
    }

    // 5. Regenerar Prisma Client
    log('\n🔄 Regenerando Prisma Client...', 'blue');
    try {
      execSync('npx prisma generate', { encoding: 'utf-8', stdio: 'inherit' });
      log('✅ Prisma Client regenerado', 'green');
    } catch (error) {
      log('⚠️  Error al regenerar Prisma Client (puedes hacerlo manualmente)', 'yellow');
    }

    log('\n====================================================', 'cyan');
    log('  ✅ SINCRONIZACIÓN COMPLETADA', 'green');
    log('====================================================\n', 'cyan');

    log('Próximos pasos:', 'blue');
    log('1. Verificar que no hay errores en la consola', 'blue');
    log('2. Reiniciar el servidor backend', 'blue');
    log('3. Probar los módulos actualizados en producción', 'blue');

  } catch (error) {
    log('\n❌ Error inesperado:', 'red');
    console.error(error);
    process.exit(1);
  }
}

main();

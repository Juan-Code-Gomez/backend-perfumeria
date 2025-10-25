const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  console.log('\n' + '═'.repeat(60));
  log(`  ${message}`, 'cyan');
  console.log('═'.repeat(60) + '\n');
}

async function fullSyncProduction() {
  header('🚀 SINCRONIZACIÓN COMPLETA DE PRODUCCIÓN');
  
  log('Este asistente te guiará paso a paso para:', 'blue');
  log('  1. Verificar diferencias', 'blue');
  log('  2. Crear backup de seguridad', 'blue');
  log('  3. Ejecutar migración', 'blue');
  log('  4. Verificar resultado', 'blue');

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = (question) => new Promise(resolve => readline.question(question, resolve));

  try {
    // Paso 1: Verificar configuración
    header('PASO 1: Verificación de Configuración');
    
    require('dotenv').config();
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      log('❌ DATABASE_URL no configurado en .env', 'red');
      log('💡 Configura DATABASE_URL apuntando a PRODUCCIÓN', 'yellow');
      readline.close();
      process.exit(1);
    }

    const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ':****@');
    log('✓ DATABASE_URL configurado', 'green');
    log(`  ${maskedUrl}`, 'cyan');

    const answer1 = await ask('\n¿Es correcta la conexión a PRODUCCIÓN? (si/no): ');
    if (answer1.toLowerCase() !== 'si' && answer1.toLowerCase() !== 's') {
      log('\n❌ Proceso cancelado. Verifica DATABASE_URL en .env', 'yellow');
      readline.close();
      process.exit(0);
    }

    // Paso 2: Verificar diferencias
    header('PASO 2: Análisis de Diferencias');
    
    log('🔍 Verificando qué falta en producción...', 'blue');
    
    const answer2 = await ask('\n¿Verificar diferencias antes de continuar? (si/no): ');
    
    if (answer2.toLowerCase() === 'si' || answer2.toLowerCase() === 's') {
      log('\n📊 Ejecutando análisis...', 'blue');
      
      try {
        const { execSync } = require('child_process');
        const diffOutput = execSync('node check-production-diff.js', { 
          encoding: 'utf-8',
          stdio: 'inherit'
        });
      } catch (error) {
        log('\n⚠️  No se pudo ejecutar el análisis automático', 'yellow');
        log('Continuando con la migración...', 'yellow');
      }
      
      const answer3 = await ask('\n¿Continuar con la migración? (si/no): ');
      if (answer3.toLowerCase() !== 'si' && answer3.toLowerCase() !== 's') {
        log('\n❌ Proceso cancelado', 'yellow');
        readline.close();
        process.exit(0);
      }
    }

    // Paso 3: Backup
    header('PASO 3: Backup de Seguridad');
    
    log('💾 Es ALTAMENTE RECOMENDADO crear un backup antes de migrar', 'yellow');
    
    const answer4 = await ask('\n¿Crear backup automático? (si/no): ');
    
    if (answer4.toLowerCase() === 'si' || answer4.toLowerCase() === 's') {
      log('\n📦 Creando backup...', 'blue');
      
      try {
        // Verificar si pg_dump está disponible
        try {
          execSync('pg_dump --version', { stdio: 'ignore' });
        } catch {
          log('\n⚠️  pg_dump no disponible', 'yellow');
          log('💡 Opciones:', 'yellow');
          log('  1. Hacer backup manual desde pgAdmin', 'yellow');
          log('  2. Continuar sin backup (NO RECOMENDADO)', 'yellow');
          
          const answer5 = await ask('\n¿Continuar SIN backup? (si/no): ');
          if (answer5.toLowerCase() !== 'si' && answer5.toLowerCase() !== 's') {
            log('\n❌ Proceso cancelado. Haz backup manual primero.', 'yellow');
            readline.close();
            process.exit(0);
          }
        }

        // Intentar crear backup
        const parseConnectionString = (url) => {
          const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
          if (!match) throw new Error('Invalid URL');
          return {
            user: match[1],
            password: match[2],
            host: match[3],
            port: match[4],
            database: match[5]
          };
        };

        const dbConfig = parseConnectionString(databaseUrl);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 10);
        const backupDir = path.join(__dirname, 'backups');
        const backupFile = path.join(backupDir, `backup_${dbConfig.database}_${timestamp}.sql`);

        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir);
        }

        const backupCmd = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -F p -f "${backupFile}"`;
        const env = { ...process.env, PGPASSWORD: dbConfig.password };
        
        execSync(backupCmd, { env, stdio: 'pipe' });

        if (fs.existsSync(backupFile)) {
          const sizeMB = (fs.statSync(backupFile).size / 1024 / 1024).toFixed(2);
          log(`\n✅ Backup creado: ${backupFile} (${sizeMB} MB)`, 'green');
        }
        
      } catch (error) {
        log('\n⚠️  No se pudo crear backup automático', 'yellow');
        log('Error: ' + error.message, 'red');
        
        const answer6 = await ask('\n¿Continuar sin backup? (si/no): ');
        if (answer6.toLowerCase() !== 'si' && answer6.toLowerCase() !== 's') {
          log('\n❌ Proceso cancelado', 'yellow');
          readline.close();
          process.exit(0);
        }
      }
    }

    // Paso 4: Ejecutar migración
    header('PASO 4: Ejecución de Migración');
    
    log('🔧 Se ejecutará: sync-production-safe.sql', 'blue');
    log('   Este script:', 'blue');
    log('   ✓ NO borra datos', 'green');
    log('   ✓ Solo agrega/modifica estructura', 'green');
    log('   ✓ Es idempotente (seguro ejecutar varias veces)', 'green');
    
    const answer7 = await ask('\n¿Ejecutar migración AHORA? (si/no): ');
    
    if (answer7.toLowerCase() !== 'si' && answer7.toLowerCase() !== 's') {
      log('\n❌ Migración cancelada', 'yellow');
      readline.close();
      process.exit(0);
    }

    log('\n🚀 Ejecutando migración...', 'blue');
    
    try {
      const sqlFile = path.join(__dirname, 'sync-production-safe.sql');
      const command = `psql "${databaseUrl}" -f "${sqlFile}"`;
      
      const output = execSync(command, { encoding: 'utf-8' });
      
      log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE', 'green');
      
      // Mostrar últimas líneas del output
      const lines = output.trim().split('\n').slice(-10);
      log('\n📋 Últimas líneas del resultado:', 'cyan');
      lines.forEach(line => console.log('  ' + line));
      
    } catch (error) {
      log('\n❌ Error ejecutando migración:', 'red');
      console.error(error.message);
      
      log('\n💡 Alternativa: Usar pgAdmin manualmente', 'yellow');
      log('   1. Abrir pgAdmin', 'yellow');
      log('   2. Query Tool → Abrir sync-production-safe.sql', 'yellow');
      log('   3. Ejecutar (F5)', 'yellow');
      
      readline.close();
      process.exit(1);
    }

    // Paso 5: Post-migración
    header('PASO 5: Post-Migración');
    
    log('🔄 Regenerando Prisma Client...', 'blue');
    
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      log('✅ Prisma Client regenerado', 'green');
    } catch (error) {
      log('⚠️  Error regenerando Prisma Client', 'yellow');
      log('Ejecuta manualmente: npx prisma generate', 'yellow');
    }

    // Resumen final
    header('✅ SINCRONIZACIÓN COMPLETADA');
    
    log('🎉 Todo listo! Próximos pasos:', 'green');
    log('  1. Reiniciar el backend en producción', 'blue');
    log('  2. Probar los módulos actualizados:', 'blue');
    log('     • Facturas', 'cyan');
    log('     • Compras con FIFO', 'cyan');
    log('     • Pagos de facturas', 'cyan');
    log('     • Sistema de parámetros', 'cyan');
    log('  3. Verificar logs del servidor', 'blue');
    log('  4. Confirmar con usuarios', 'blue');
    
    log('\n📁 Archivos generados:', 'blue');
    log('  • Backup en: backups/', 'cyan');
    log('  • Logs de migración disponibles', 'cyan');

    readline.close();

  } catch (error) {
    log('\n❌ Error inesperado:', 'red');
    console.error(error);
    readline.close();
    process.exit(1);
  }
}

fullSyncProduction();

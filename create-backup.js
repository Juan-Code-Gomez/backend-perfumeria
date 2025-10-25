const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

function parseConnectionString(url) {
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }
  
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5]
  };
}

async function createBackup() {
  log('\n====================================================', 'cyan');
  log('  BACKUP AUTOMÁTICO DE PRODUCCIÓN', 'cyan');
  log('====================================================\n', 'cyan');

  try {
    // Cargar .env
    require('dotenv').config();
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      log('❌ Error: DATABASE_URL no configurado', 'red');
      process.exit(1);
    }

    // Parsear connection string
    let dbConfig;
    try {
      dbConfig = parseConnectionString(databaseUrl);
      log('✓ Configuración de base de datos cargada', 'green');
      log(`  Base de datos: ${dbConfig.database}`, 'blue');
      log(`  Host: ${dbConfig.host}:${dbConfig.port}`, 'blue');
      log(`  Usuario: ${dbConfig.user}`, 'blue');
    } catch (error) {
      log('❌ Error parseando DATABASE_URL', 'red');
      log('💡 Formato esperado: postgresql://user:pass@host:port/database', 'yellow');
      process.exit(1);
    }

    // Crear nombre de archivo con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const backupDir = path.join(__dirname, 'backups');
    const backupFile = path.join(backupDir, `backup_${dbConfig.database}_${timestamp}.sql`);

    // Crear directorio de backups si no existe
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
      log('✓ Directorio de backups creado', 'green');
    }

    log('\n🔄 Iniciando backup...', 'blue');
    log(`  Archivo: ${backupFile}`, 'cyan');

    // Verificar si pg_dump está disponible
    try {
      execSync('pg_dump --version', { encoding: 'utf-8', stdio: 'ignore' });
    } catch (error) {
      log('\n❌ pg_dump no encontrado', 'red');
      log('\n💡 Alternativas:', 'yellow');
      log('1. Instalar PostgreSQL client tools', 'yellow');
      log('2. Hacer backup manual desde pgAdmin:', 'yellow');
      log('   - Click derecho en la base de datos', 'yellow');
      log('   - Backup...', 'yellow');
      log('   - Guardar archivo', 'yellow');
      log('\n3. Ejecutar la migración sin backup (no recomendado):', 'yellow');
      log('   node execute-sync-production.js', 'yellow');
      process.exit(1);
    }

    // Ejecutar pg_dump
    const command = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -F p -f "${backupFile}"`;
    
    log('\n⏳ Creando backup (esto puede tomar unos segundos)...', 'yellow');
    
    try {
      // Establecer password en variable de entorno
      const env = { ...process.env, PGPASSWORD: dbConfig.password };
      
      execSync(command, { 
        encoding: 'utf-8', 
        env,
        stdio: 'pipe'
      });

      // Verificar que se creó el archivo
      if (fs.existsSync(backupFile)) {
        const stats = fs.statSync(backupFile);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        
        log('\n✅ BACKUP CREADO EXITOSAMENTE', 'green');
        log(`  📁 Ubicación: ${backupFile}`, 'cyan');
        log(`  📊 Tamaño: ${sizeMB} MB`, 'cyan');
        log(`  📅 Fecha: ${new Date().toLocaleString('es-CO')}`, 'cyan');

        // Preguntar si continuar con la migración
        log('\n📋 Opciones:', 'blue');
        log('1. Ejecutar migración ahora: node execute-sync-production.js', 'blue');
        log('2. Solo hacer backup y terminar', 'blue');
        
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const answer = await new Promise(resolve => {
          readline.question('\n¿Ejecutar migración ahora? (si/no): ', resolve);
        });
        readline.close();

        if (answer.toLowerCase() === 'si' || answer.toLowerCase() === 's') {
          log('\n🚀 Iniciando migración...', 'blue');
          require('./execute-sync-production.js');
        } else {
          log('\n✅ Backup completado. Migración no ejecutada.', 'green');
          log('💡 Para ejecutar la migración más tarde:', 'blue');
          log('   node execute-sync-production.js', 'blue');
        }

      } else {
        throw new Error('El archivo de backup no se creó');
      }

    } catch (error) {
      log('\n❌ Error creando backup:', 'red');
      console.error(error.message);
      
      log('\n💡 Posibles causas:', 'yellow');
      log('- Credenciales incorrectas', 'yellow');
      log('- No hay conexión al servidor', 'yellow');
      log('- Permisos insuficientes', 'yellow');
      
      process.exit(1);
    }

  } catch (error) {
    log('\n❌ Error inesperado:', 'red');
    console.error(error);
    process.exit(1);
  }
}

createBackup();

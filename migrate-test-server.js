#!/usr/bin/env node

/**
 * Script para ejecutar migraciones en el servidor de prueba
 * Base de datos: postgresql://postgres:bFVTvxEHHlbUhYzAjePffYeBOFNmHrWy@mainline.proxy.rlwy.net:32067/railway
 */

const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function execCommand(command, description) {
  log(description, 'blue');
  try {
    const output = execSync(command, { 
      encoding: 'utf-8',
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: 'postgresql://postgres:bFVTvxEHHlbUhYzAjePffYeBOFNmHrWy@mainline.proxy.rlwy.net:32067/railway'
      }
    });
    log(`✓ ${description} - Completado`, 'green');
    return true;
  } catch (error) {
    log(`✗ ${description} - Falló`, 'red');
    console.error(error.message);
    return false;
  }
}

async function main() {
  log('═══════════════════════════════════════════════════', 'cyan');
  log('  🚀 MIGRANDO SERVIDOR DE PRUEBA', 'cyan');
  log('═══════════════════════════════════════════════════', 'cyan');

  try {
    log('📦 Ejecutando migraciones de Prisma...', 'yellow');
    
    // Ejecutar migraciones
    if (!execCommand('npx prisma migrate deploy', 'Aplicar migraciones')) {
      throw new Error('Fallo al aplicar migraciones');
    }
    
    // Generar Prisma Client
    if (!execCommand('npx prisma generate', 'Generar Prisma Client')) {
      throw new Error('Fallo al generar Prisma Client');
    }
    
    log('═══════════════════════════════════════════════════', 'green');
    log('  ✅ MIGRACIONES COMPLETADAS', 'green');
    log('═══════════════════════════════════════════════════', 'green');
    log('', 'reset');
    log('Ahora puedes hacer seed ejecutando:', 'cyan');
    log('node migrate-test-server-seed.js', 'yellow');
    
    process.exit(0);
    
  } catch (error) {
    log('═══════════════════════════════════════════════════', 'red');
    log('  ❌ ERROR EN MIGRACIONES', 'red');
    log('═══════════════════════════════════════════════════', 'red');
    console.error(error);
    process.exit(1);
  }
}

main();

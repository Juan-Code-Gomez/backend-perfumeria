#!/usr/bin/env node

/**
 * VERIFICADOR PRE-PUSH - RAILWAY AUTO-DEPLOY
 * 
 * Verifica que todo esté configurado correctamente antes de hacer push
 */

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

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    log(`  ✓ ${description}`, 'green');
    return true;
  } else {
    log(`  ✗ ${description} - NO ENCONTRADO`, 'red');
    return false;
  }
}

function checkPackageJson() {
  const packagePath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  
  const requiredScripts = [
    'railway:start',
    'railway:build',
    'migrate:deploy',
    'build'
  ];
  
  let allFound = true;
  requiredScripts.forEach(script => {
    if (packageJson.scripts[script]) {
      log(`  ✓ Script "${script}" configurado`, 'green');
    } else {
      log(`  ✗ Script "${script}" NO ENCONTRADO`, 'red');
      allFound = false;
    }
  });
  
  return allFound;
}

function checkMigrations() {
  const migrationsDir = path.join(__dirname, 'prisma', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    log('  ✗ Directorio de migraciones NO EXISTE', 'red');
    return false;
  }
  
  const migrations = fs.readdirSync(migrationsDir).filter(f => 
    fs.statSync(path.join(migrationsDir, f)).isDirectory()
  );
  
  if (migrations.length === 0) {
    log('  ✗ No hay migraciones', 'red');
    return false;
  }
  
  log(`  ✓ ${migrations.length} migraciones encontradas`, 'green');
  
  // Verificar baseline
  const hasBaseline = migrations.some(m => 
    m.includes('baseline_complete_schema')
  );
  
  if (hasBaseline) {
    log('  ✓ Migración baseline encontrada', 'green');
  } else {
    log('  ⚠  Migración baseline NO encontrada', 'yellow');
  }
  
  return true;
}

function main() {
  log('\n═══════════════════════════════════════════════════', 'cyan');
  log('  🔍 VERIFICACIÓN PRE-PUSH - RAILWAY AUTO-DEPLOY', 'cyan');
  log('═══════════════════════════════════════════════════\n', 'cyan');

  let allChecks = true;

  // 1. Archivos necesarios
  log('1. Verificando archivos:', 'blue');
  allChecks = checkFile('railway-auto-deploy.js', 'Script de auto-deploy') && allChecks;
  allChecks = checkFile('railway.json', 'Configuración de Railway') && allChecks;
  allChecks = checkFile('prisma/schema.prisma', 'Schema de Prisma') && allChecks;

  // 2. Scripts de package.json
  log('\n2. Verificando scripts en package.json:', 'blue');
  allChecks = checkPackageJson() && allChecks;

  // 3. Migraciones
  log('\n3. Verificando migraciones:', 'blue');
  allChecks = checkMigrations() && allChecks;

  // 4. .env (advertencia)
  log('\n4. Verificando configuración:', 'blue');
  if (fs.existsSync('.env')) {
    log('  ✓ Archivo .env existe (desarrollo)', 'green');
    log('  ℹ  Recuerda: Railway usa sus propias variables de entorno', 'cyan');
  } else {
    log('  ⚠  No hay .env (normal en Railway)', 'yellow');
  }

  // Resultado final
  log('\n═══════════════════════════════════════════════════', 'cyan');
  
  if (allChecks) {
    log('  ✅ TODO CORRECTO - LISTO PARA PUSH', 'green');
    log('═══════════════════════════════════════════════════\n', 'cyan');
    
    log('📝 Próximos pasos:', 'blue');
    log('  1. git add .', 'cyan');
    log('  2. git commit -m "feat: Railway auto-deployment"', 'cyan');
    log('  3. git push origin main', 'cyan');
    log('  4. Railway hará deployment automático en TODOS los clientes', 'cyan');
    log('');
    
    process.exit(0);
  } else {
    log('  ❌ HAY PROBLEMAS - REVISAR ERRORES', 'red');
    log('═══════════════════════════════════════════════════\n', 'cyan');
    
    log('💡 Solución:', 'yellow');
    log('  Revisa los errores marcados con ✗ arriba', 'yellow');
    log('  Asegúrate de tener todos los archivos necesarios', 'yellow');
    log('');
    
    process.exit(1);
  }
}

main();

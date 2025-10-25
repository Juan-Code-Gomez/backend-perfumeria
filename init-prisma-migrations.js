#!/usr/bin/env node

/**
 * SCRIPT DE INICIALIZACIÓN DE MIGRACIONES PRISMA
 * 
 * Este script:
 * 1. Crea el directorio de migraciones si no existe
 * 2. Establece el "baseline" (punto de partida) con el schema actual
 * 3. Permite que nuevos cambios se migren automáticamente
 * 
 * Úsalo SOLO UNA VEZ en cada base de datos existente.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function initializePrismaMigrations() {
  log('\n═══════════════════════════════════════════════════════', 'cyan');
  log('  🔧 INICIALIZACIÓN DE SISTEMA DE MIGRACIONES PRISMA', 'cyan');
  log('═══════════════════════════════════════════════════════\n', 'cyan');

  try {
    // 1. Verificar que existe schema.prisma
    const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
    if (!fs.existsSync(schemaPath)) {
      log('❌ No se encuentra prisma/schema.prisma', 'red');
      process.exit(1);
    }

    log('✓ Schema de Prisma encontrado', 'green');

    // 2. Crear el directorio de migraciones
    const migrationsDir = path.join(__dirname, 'prisma', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
      log('✓ Directorio de migraciones creado', 'green');
    } else {
      log('✓ Directorio de migraciones ya existe', 'green');
    }

    // 3. Crear la migración inicial (baseline)
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const migrationName = `${timestamp}_baseline_complete_schema`;
    const migrationDir = path.join(migrationsDir, migrationName);

    if (!fs.existsSync(migrationDir)) {
      fs.mkdirSync(migrationDir, { recursive: true });
      log(`✓ Migración baseline creada: ${migrationName}`, 'green');
    }

    // 4. Generar el SQL de la migración desde el schema actual
    log('\n🔄 Generando SQL de migración desde schema.prisma...', 'blue');
    
    const sqlContent = execSync(
      'npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script',
      { encoding: 'utf-8' }
    );

    // 5. Guardar el SQL en migration.sql
    const migrationFile = path.join(migrationDir, 'migration.sql');
    fs.writeFileSync(migrationFile, sqlContent);
    
    log(`✓ Archivo de migración creado: migration.sql`, 'green');
    log(`  Tamaño: ${(sqlContent.length / 1024).toFixed(2)} KB`, 'cyan');

    // 6. Marcar la migración como aplicada (para bases de datos existentes)
    log('\n📋 IMPORTANTE:', 'yellow');
    log('Para bases de datos EXISTENTES (desarrollo, producción actual):', 'yellow');
    log('  Ejecuta: npx prisma migrate resolve --applied ' + migrationName, 'cyan');
    log('', 'yellow');
    log('Para bases de datos NUEVAS:', 'yellow');
    log('  Ejecuta: npx prisma migrate deploy', 'cyan');

    log('\n✅ Sistema de migraciones inicializado correctamente', 'green');
    log('\n📝 Próximos pasos:', 'blue');
    log('1. Para marcar como aplicada en BD existente:', 'blue');
    log(`   npx prisma migrate resolve --applied ${migrationName}`, 'cyan');
    log('', 'blue');
    log('2. Para futuros cambios en el schema:', 'blue');
    log('   npx prisma migrate dev --name nombre_del_cambio', 'cyan');
    log('', 'blue');
    log('3. Para aplicar en producción:', 'blue');
    log('   npx prisma migrate deploy', 'cyan');

  } catch (error) {
    log('\n❌ Error inicializando migraciones:', 'red');
    console.error(error.message);
    process.exit(1);
  }
}

initializePrismaMigrations();

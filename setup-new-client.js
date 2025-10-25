#!/usr/bin/env node

/**
 * Script de Inicialización para Nuevos Clientes
 * 
 * Este script garantiza que una base de datos nueva tenga:
 * - Todas las migraciones aplicadas
 * - Todas las columnas necesarias (fix post-baseline)
 * - Prisma Client actualizado
 * - Datos iniciales (seed)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  try {
    log(`\n📝 ${description}...`, 'cyan');
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completado`, 'green');
    return true;
  } catch (error) {
    log(`❌ Error en: ${description}`, 'red');
    log(error.message, 'red');
    return false;
  }
}

async function setupNewClient() {
  log('\n═══════════════════════════════════════════════════════', 'blue');
  log('🚀 INICIALIZANDO NUEVO CLIENTE', 'blue');
  log('═══════════════════════════════════════════════════════\n', 'blue');

  const steps = [
    {
      name: 'Verificar conexión',
      command: 'node -e "const {PrismaClient} = require(\'@prisma/client\'); const p = new PrismaClient(); p.$connect().then(() => console.log(\'OK\')).catch(e => process.exit(1))"',
      critical: true,
    },
    {
      name: 'Aplicar migraciones de Prisma',
      command: 'npx prisma migrate deploy',
      critical: true,
    },
    {
      name: 'Aplicar fix de columnas post-baseline',
      command: 'npx prisma db execute --file=./fix-all-missing-columns.sql --schema=./prisma/schema.prisma',
      critical: true,
    },
    {
      name: 'Generar Prisma Client',
      command: 'npx prisma generate',
      critical: true,
    },
    {
      name: 'Inicializar parámetros del sistema',
      command: 'node initialize-parameters.ts',
      critical: false,
    },
  ];

  let totalSteps = steps.length;
  let completedSteps = 0;
  let failedSteps = 0;

  for (const step of steps) {
    const success = runCommand(step.command, step.name);
    
    if (success) {
      completedSteps++;
    } else {
      failedSteps++;
      if (step.critical) {
        log('\n❌ PASO CRÍTICO FALLÓ. Abortando...', 'red');
        process.exit(1);
      } else {
        log('\n⚠️  Paso opcional falló, continuando...', 'yellow');
      }
    }
  }

  // Resumen
  log('\n\n═══════════════════════════════════════════════════════', 'blue');
  log('📊 RESUMEN DE INICIALIZACIÓN', 'blue');
  log('═══════════════════════════════════════════════════════', 'blue');
  log(`Total de pasos: ${totalSteps}`, 'cyan');
  log(`✅ Completados: ${completedSteps}`, 'green');
  if (failedSteps > 0) {
    log(`❌ Fallidos: ${failedSteps}`, 'red');
  }
  log('═══════════════════════════════════════════════════════\n', 'blue');

  if (failedSteps === 0) {
    log('🎉 NUEVO CLIENTE INICIALIZADO EXITOSAMENTE', 'green');
    log('\n📝 Próximos pasos:', 'cyan');
    log('   1. Crear usuario administrador', 'cyan');
    log('   2. Configurar parámetros del sistema', 'cyan');
    log('   3. Cargar datos iniciales (categorías, unidades, etc.)', 'cyan');
    return true;
  } else {
    log('⚠️  INICIALIZACIÓN COMPLETADA CON ADVERTENCIAS', 'yellow');
    return false;
  }
}

// Ejecutar
setupNewClient()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    log(`\n💥 Error fatal: ${error.message}`, 'red');
    process.exit(1);
  });

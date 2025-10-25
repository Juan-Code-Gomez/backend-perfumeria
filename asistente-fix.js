#!/usr/bin/env node

/**
 * Script Interactivo para Aplicar Fixes
 * Ayuda paso a paso para aplicar los fixes en múltiples bases de datos
 */

const readline = require('readline');
const { execSync } = require('child_process');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function ask(question) {
  return new Promise(resolve => {
    rl.question(`${colors.cyan}${question}${colors.reset}`, answer => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.clear();
  log('═══════════════════════════════════════════════════════', 'blue');
  log('🔧 ASISTENTE PARA APLICAR FIXES EN MÚLTIPLES BDs', 'blue');
  log('═══════════════════════════════════════════════════════\n', 'blue');

  log('Este asistente te guiará para aplicar los fixes en tus bases de datos.\n', 'cyan');

  const choice = await ask(
    '¿Cómo deseas aplicar los fixes?\n' +
    '  1) Automático - Configurar y ejecutar script\n' +
    '  2) Manual - Obtener comandos SQL para copiar/pegar\n' +
    '  3) Ver estado actual\n' +
    '  4) Salir\n\n' +
    'Selecciona una opción (1-4): '
  );

  console.log('');

  switch(choice) {
    case '1':
      await modoAutomatico();
      break;
    case '2':
      await modoManual();
      break;
    case '3':
      await verEstado();
      break;
    case '4':
      log('👋 ¡Hasta luego!', 'cyan');
      rl.close();
      return;
    default:
      log('❌ Opción inválida', 'red');
      rl.close();
      return;
  }

  rl.close();
}

async function modoAutomatico() {
  log('═══════════════════════════════════════════════════════', 'magenta');
  log('🤖 MODO AUTOMÁTICO', 'magenta');
  log('═══════════════════════════════════════════════════════\n', 'magenta');

  log('📝 Pasos a seguir:\n', 'yellow');
  log('1. Obtén las URLs de tus bases de datos de Railway', 'white');
  log('2. Edita el archivo .env y agrega las URLs:', 'white');
  log('   DATABASE_URL_CLIENT_2="postgresql://..."', 'cyan');
  log('   DATABASE_URL_CLIENT_3="postgresql://..."', 'cyan');
  log('   DATABASE_URL_CLIENT_4="postgresql://..."\n', 'cyan');

  const continuar = await ask('¿Ya configuraste las URLs en .env? (s/n): ');

  if (continuar.toLowerCase() === 's') {
    log('\n🚀 Ejecutando script...\n', 'green');
    try {
      execSync('node apply-fix-multi-db.js', { stdio: 'inherit' });
    } catch (error) {
      log('\n❌ Error al ejecutar el script', 'red');
    }
  } else {
    log('\n📝 Instrucciones guardadas en: RESUMEN-SOLUCION.md', 'yellow');
    log('   Edita el archivo .env y vuelve a ejecutar este asistente.', 'yellow');
  }
}

async function modoManual() {
  log('═══════════════════════════════════════════════════════', 'magenta');
  log('🛠️  MODO MANUAL', 'magenta');
  log('═══════════════════════════════════════════════════════\n', 'magenta');

  log('📋 Copia y pega estos comandos SQL en Railway:\n', 'yellow');

  const sqlCommands = `
-- ============================================
-- TABLA PURCHASE
-- ============================================
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "subtotal" DOUBLE PRECISION;
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "discount" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT;
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "invoiceDate" TIMESTAMP(3);
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3);
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Índices
CREATE INDEX IF NOT EXISTS "Purchase_invoiceNumber_key" ON "Purchase"("invoiceNumber") WHERE "invoiceNumber" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Purchase_invoiceDate_idx" ON "Purchase"("invoiceDate") WHERE "invoiceDate" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Purchase_dueDate_idx" ON "Purchase"("dueDate") WHERE "dueDate" IS NOT NULL;

-- Actualizar datos existentes
UPDATE "Purchase" SET "subtotal" = "totalAmount" WHERE "subtotal" IS NULL;

-- ============================================
-- TABLA INVOICE
-- ============================================
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT COUNT(*) as purchase_columns FROM information_schema.columns
WHERE table_name = 'Purchase' AND column_name IN ('subtotal', 'discount', 'invoiceNumber', 'invoiceDate', 'dueDate', 'notes');
-- Debe retornar 6

SELECT COUNT(*) as invoice_columns FROM information_schema.columns
WHERE table_name = 'Invoice' AND column_name = 'notes';
-- Debe retornar 1
`;

  log(sqlCommands, 'cyan');

  const guardar = await ask('\n¿Deseas guardar estos comandos en un archivo? (s/n): ');

  if (guardar.toLowerCase() === 's') {
    fs.writeFileSync('comandos-sql-manual.sql', sqlCommands);
    log('✅ Comandos guardados en: comandos-sql-manual.sql', 'green');
  }
}

async function verEstado() {
  log('═══════════════════════════════════════════════════════', 'magenta');
  log('📊 VERIFICANDO ESTADO', 'magenta');
  log('═══════════════════════════════════════════════════════\n', 'magenta');

  log('🔍 Verificando base de datos actual...\n', 'yellow');

  try {
    execSync('node check-purchase-schema.js', { stdio: 'inherit' });
    log('');
    execSync('node check-invoice-tables.js', { stdio: 'inherit' });
  } catch (error) {
    log('\n❌ Error al verificar el estado', 'red');
  }
}

main().catch(error => {
  log(`\n💥 Error: ${error.message}`, 'red');
  process.exit(1);
});

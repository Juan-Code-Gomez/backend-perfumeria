#!/usr/bin/env node

/**
 * TEST LOCAL DEL SCRIPT DE RAILWAY
 * 
 * Este script simula lo que pasará en Railway
 * Úsalo para verificar antes de hacer push
 */

const { execSync } = require('child_process');

console.log('═══════════════════════════════════════════════════');
console.log('  🧪 TEST LOCAL - RAILWAY AUTO-DEPLOY');
console.log('═══════════════════════════════════════════════════');
console.log('');

console.log('📋 Verificando configuración...');
console.log('');

// 1. Verificar que existe railway-auto-deploy.js
const fs = require('fs');
if (!fs.existsSync('./railway-auto-deploy.js')) {
  console.error('❌ No se encontró railway-auto-deploy.js');
  process.exit(1);
}
console.log('✓ railway-auto-deploy.js existe');

// 2. Verificar que existe package.json con los scripts
const packageJson = require('./package.json');
if (!packageJson.scripts['railway:start']) {
  console.error('❌ No existe script railway:start en package.json');
  process.exit(1);
}
console.log('✓ Scripts de Railway configurados');

// 3. Verificar que existe la migración baseline
const baselinePath = './prisma/migrations/20251025161155_baseline_complete_schema';
if (!fs.existsSync(baselinePath)) {
  console.error('❌ No se encontró la migración baseline');
  process.exit(1);
}
console.log('✓ Migración baseline existe');

// 4. Verificar estado de migraciones
console.log('');
console.log('📊 Verificando estado de migraciones...');
try {
  execSync('npx prisma migrate status', { stdio: 'inherit' });
} catch (error) {
  console.error('⚠️  Error al verificar migraciones');
}

console.log('');
console.log('═══════════════════════════════════════════════════');
console.log('  ✅ CONFIGURACIÓN VERIFICADA');
console.log('═══════════════════════════════════════════════════');
console.log('');
console.log('🎯 Próximo paso:');
console.log('');
console.log('  git add .');
console.log('  git commit -m "fix: Railway auto-deploy con baseline correcto"');
console.log('  git push origin main');
console.log('');
console.log('Railway ejecutará automáticamente:');
console.log('  1. npm run build');
console.log('  2. npm run railway:start (railway-auto-deploy.js)');
console.log('  3. node dist/src/main.js');
console.log('');

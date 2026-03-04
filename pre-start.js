#!/usr/bin/env node
// pre-start.js - Script que se ejecuta antes de iniciar el servidor
// Aplica migraciones automáticas y luego inicia la aplicación

const { runAutoMigrations } = require('./auto-migrate');
const { spawn } = require('child_process');

async function preStart() {
  console.log('\n🚀 PRE-START: Preparando aplicación...\n');

  try {
    // 1. Ejecutar auto-migraciones
    await runAutoMigrations();

    // 2. Iniciar el servidor
    console.log('🚀 Iniciando servidor NestJS...\n');
    
    const nodeArgs = process.argv.slice(2); // Capturar argumentos adicionales
    const serverProcess = spawn('node', ['dist/src/main.js', ...nodeArgs], {
      stdio: 'inherit',
      shell: true
    });

    serverProcess.on('error', (error) => {
      console.error('❌ Error al iniciar servidor:', error);
      process.exit(1);
    });

    serverProcess.on('exit', (code) => {
      process.exit(code);
    });

    // Manejar señales de terminación
    process.on('SIGTERM', () => {
      console.log('\n⚠️  SIGTERM recibido, cerrando servidor...');
      serverProcess.kill('SIGTERM');
    });

    process.on('SIGINT', () => {
      console.log('\n⚠️  SIGINT recibido, cerrando servidor...');
      serverProcess.kill('SIGINT');
    });

  } catch (error) {
    console.error('\n❌ Error en pre-start:', error);
    // Intentar iniciar el servidor de todas formas
    console.log('\n⚠️  Iniciando servidor sin migraciones...\n');
    const serverProcess = spawn('node', ['dist/src/main.js'], {
      stdio: 'inherit',
      shell: true
    });
    
    serverProcess.on('exit', (code) => {
      process.exit(code);
    });
  }
}

preStart();

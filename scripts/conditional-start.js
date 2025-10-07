#!/usr/bin/env node
// Script condicional para Railway - detecta si necesita setup inicial
const { spawn } = require('child_process');
const { PrismaClient } = require('@prisma/client');

async function checkNeedsSetup() {
  const prisma = new PrismaClient();
  try {
    // Intentar contar usuarios - si falla es porque no hay tablas
    await prisma.user.count();
    await prisma.$disconnect();
    return false; // No necesita setup
  } catch (error) {
    await prisma.$disconnect();
    return true; // Necesita setup
  }
}

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Ejecutando: ${command} ${args.join(' ')}`);
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

async function main() {
  try {
    const needsSetup = await checkNeedsSetup();
    
    if (needsSetup) {
      console.log('🆕 Base de datos nueva detectada - Configurando...');
      await runCommand('npx', ['prisma', 'db', 'push']);
      await runCommand('npx', ['prisma', 'db', 'seed']);
    } else {
      console.log('✅ Base de datos existente - Saltando setup');
    }
    
    // Siempre iniciar la aplicación
    console.log('🎯 Iniciando aplicación...');
    await runCommand('npm', ['run', 'start:prod']);
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    process.exit(1);
  }
}

main();
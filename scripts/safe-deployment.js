#!/usr/bin/env node
// Script de despliegue seguro para Railway
// Maneja tanto nuevos despliegues como actualizaciones de proyectos existentes

const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const prisma = new PrismaClient();

async function checkDatabaseExists() {
  try {
    // Intentar una consulta simple para verificar conectividad
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexión a base de datos establecida');
    return true;
  } catch (error) {
    console.log('❌ No se puede conectar a la base de datos:', error.message);
    return false;
  }
}

async function checkIfDatabaseHasData() {
  try {
    // Verificar si existen tablas principales
    const users = await prisma.user.count();
    const roles = await prisma.role.count();
    
    console.log(`📊 Usuarios existentes: ${users}`);
    console.log(`📊 Roles existentes: ${roles}`);
    
    // Si hay usuarios o roles, la DB ya tiene datos
    return users > 0 || roles > 0;
  } catch (error) {
    // Verificar si el error es por tabla inexistente
    if (error.code === 'P2021' || error.message.includes('does not exist')) {
      console.log('ℹ️  Las tablas principales no existen - Base de datos nueva detectada');
      return false;
    }
    
    // Si es otro tipo de error, re-lanzarlo
    console.error('❌ Error verificando datos existentes:', error.message);
    throw error;
  }
}

async function runMigrationsOnly() {
  try {
    console.log('🔄 Ejecutando migraciones existentes...');
    await execAsync('npx prisma migrate deploy');
    console.log('✅ Migraciones aplicadas correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error.message);
    return false;
  }
}

async function setupNewDatabase() {
  try {
    console.log('🆕 Configurando base de datos nueva...');
    
    // Opción 1: Usar db push para crear tablas según el schema actual
    console.log('📋 Creando tablas desde schema...');
    await execAsync('npx prisma db push --skip-generate');
    
    // Opción 2: Ejecutar seed para datos iniciales
    console.log('🌱 Insertando datos iniciales...');
    await execAsync('npx prisma db seed');
    
    console.log('✅ Base de datos nueva configurada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error configurando nueva base de datos:', error.message);
    
    // Fallback: intentar con migraciones
    try {
      console.log('🔄 Intentando con migraciones como fallback...');
      await execAsync('npx prisma migrate deploy');
      await execAsync('npx prisma db seed');
      console.log('✅ Configuración completada con migraciones');
      return true;
    } catch (fallbackError) {
      console.error('❌ Fallback también falló:', fallbackError.message);
      return false;
    }
  }
}

async function main() {
  console.log('🚀 Iniciando despliegue seguro...');
  
  try {
    // 1. Verificar conexión a la base de datos
    const canConnect = await checkDatabaseExists();
    if (!canConnect) {
      console.error('💥 No se puede conectar a la base de datos. Abortando despliegue.');
      process.exit(1);
    }
    
    // 2. Verificar si la base de datos tiene datos
    const hasData = await checkIfDatabaseHasData();
    
    if (hasData) {
      // Base de datos existente - solo ejecutar migraciones
      console.log('🔄 Base de datos existente detectada - Modo actualización');
      const success = await runMigrationsOnly();
      if (!success) {
        console.error('💥 Error actualizando base de datos existente');
        process.exit(1);
      }
    } else {
      // Base de datos nueva - configuración completa
      console.log('🆕 Base de datos nueva detectada - Modo configuración inicial');
      const success = await setupNewDatabase();
      if (!success) {
        console.error('💥 Error configurando nueva base de datos');
        process.exit(1);
      }
    }
    
    console.log('🎉 Despliegue completado exitosamente');
    
  } catch (error) {
    console.error('💥 Error durante el despliegue:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { main };
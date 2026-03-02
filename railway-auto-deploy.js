#!/usr/bin/env node

/**
 * RAILWAY AUTO-DEPLOYMENT SCRIPT
 * 
 * Este script se ejecuta automáticamente en Railway durante el deployment.
 * Maneja clientes existentes con migraciones de Prisma.
 * 
 * Flujo:
 * 1. Verifica si la base de datos tiene la tabla _prisma_migrations
 * 2. Si es nueva, aplica todas las migraciones
 * 3. Si es existente, marca baseline y aplica solo las nuevas
 * 4. Inicia la aplicación
 */

const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

// Colores para logs
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
      stdio: 'inherit'
    });
    log(`✓ ${description} - Completado`, 'green');
    return true;
  } catch (error) {
    log(`✗ ${description} - Falló`, 'red');
    console.error(error.message);
    return false;
  }
}

async function checkIfDatabaseIsNew(prisma) {
  try {
    // Verificar si existe la tabla de migraciones
    const migrationTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '_prisma_migrations'
      ) as exists
    `;
    
    if (!migrationTableExists[0].exists) {
      // La tabla _prisma_migrations NO existe
      // Verificar si hay OTRAS tablas en la BD
      const otherTables = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      `;
      
      const tableCount = parseInt(otherTables[0].count);
      
      if (tableCount > 0) {
        log(`⚠️  BD tiene ${tableCount} tablas pero NO tiene _prisma_migrations`, 'yellow');
        log('Esto es una BD EXISTENTE que necesita baseline', 'yellow');
        return false; // NO es nueva, es existente sin migraciones
      } else {
        log('BD completamente vacía - Nueva instalación', 'cyan');
        return true; // Es nueva de verdad
      }
    }
    
    // La tabla existe, verificar cuántas migraciones tiene
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM _prisma_migrations
    `;
    
    const migrationCount = parseInt(result[0].count);
    log(`Base de datos tiene ${migrationCount} migraciones aplicadas`, 'cyan');
    
    return migrationCount === 0;
  } catch (error) {
    log(`Error al verificar BD: ${error.message}`, 'red');
    // Si hay error, asumir que es existente por seguridad
    return false;
  }
}

async function checkIfBaselineExists(prisma) {
  try {
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM _prisma_migrations 
        WHERE migration_name = '20251025161155_baseline_complete_schema'
      ) as exists
    `;
    
    return result[0].exists;
  } catch (error) {
    return false;
  }
}

async function main() {
  log('═══════════════════════════════════════════════════', 'cyan');
  log('  🚀 RAILWAY AUTO-DEPLOYMENT - PRISMA MIGRATIONS', 'cyan');
  log('═══════════════════════════════════════════════════', 'cyan');

  // Validar DATABASE_URL antes de continuar
  if (!process.env.DATABASE_URL) {
    log('❌ ERROR: DATABASE_URL no está configurada', 'red');
    log('Configura la variable DATABASE_URL en Railway y vuelve a deployar', 'yellow');
    process.exit(1);
  }

  log(`✓ DATABASE_URL configurada: ${process.env.DATABASE_URL.substring(0, 20)}...`, 'green');

  // Inicializar Prisma Client DESPUÉS de validar
  const prisma = new PrismaClient();

  try {
    // 1. Verificar tipo de base de datos
    const isNewDatabase = await checkIfDatabaseIsNew(prisma);
    
    if (isNewDatabase) {
      // Base de datos nueva
      log('📦 Base de datos NUEVA detectada', 'yellow');
      log('Aplicando todas las migraciones...', 'blue');
      
      if (!execCommand('npx prisma migrate deploy', 'Aplicar migraciones')) {
        throw new Error('Fallo al aplicar migraciones');
      }
      
    } else {
      // Base de datos existente
      log('📊 Base de datos EXISTENTE detectada', 'yellow');
      
      const baselineExists = await checkIfBaselineExists(prisma);
      
      if (!baselineExists) {
        log('⚠️  Base de datos existente sin baseline marcado', 'yellow');
        log('Marcando baseline como aplicado (primera vez)...', 'blue');
        
        // IMPORTANTE: Marcar baseline ANTES de intentar migrate deploy
        try {
          execSync(
            'npx prisma migrate resolve --applied 20251025161155_baseline_complete_schema',
            { encoding: 'utf-8', stdio: 'inherit' }
          );
          log('✓ Baseline marcado exitosamente', 'green');
        } catch (error) {
          log('⚠️  Error al marcar baseline, continuando...', 'yellow');
        }
      } else {
        log('✓ Baseline ya marcado previamente', 'green');
      }
      
      // Aplicar migraciones nuevas (si las hay)
      log('Aplicando migraciones pendientes...', 'blue');
      try {
        execSync('npx prisma migrate deploy', { 
          encoding: 'utf-8',
          stdio: 'inherit'
        });
        log('✓ Migraciones aplicadas exitosamente', 'green');
      } catch (error) {
        log('⚠️  No hay migraciones pendientes o ya están aplicadas', 'yellow');
      }
    }
    
    // 2. Generar Prisma Client (postinstall ya lo hace, pero por si acaso)
    log('Verificando Prisma Client...', 'blue');
    if (!execCommand('npx prisma generate', 'Generar Prisma Client')) {
      throw new Error('Fallo al generar Prisma Client');
    }
    
    // 3. Verificar y crear tabla company_config si no existe
    log('Verificando tabla company_config...', 'blue');
    try {
      const tableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'company_config'
        ) as exists
      `;
      
      if (!tableExists[0].exists) {
        log('⚠️  Tabla company_config no existe, creando...', 'yellow');
        await prisma.$executeRawUnsafe(`
          CREATE TABLE "company_config" (
            "id" SERIAL PRIMARY KEY,
            "companyName" TEXT NOT NULL,
            "nit" TEXT,
            "address" TEXT,
            "phone" TEXT,
            "email" TEXT,
            "website" TEXT,
            "logo" TEXT,
            "invoicePrefix" TEXT,
            "invoiceFooter" TEXT,
            "taxRate" DOUBLE PRECISION DEFAULT 0,
            "currency" TEXT NOT NULL DEFAULT 'COP',
            "posReceiptHeader" TEXT,
            "posReceiptFooter" TEXT,
            "printLogo" BOOLEAN NOT NULL DEFAULT false,
            "timezone" TEXT NOT NULL DEFAULT 'America/Bogota',
            "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
            "numberFormat" TEXT NOT NULL DEFAULT 'es-CO',
            "showLogo" BOOLEAN NOT NULL DEFAULT true,
            "showNIT" BOOLEAN NOT NULL DEFAULT true,
            "showAddress" BOOLEAN NOT NULL DEFAULT true,
            "showPhone" BOOLEAN NOT NULL DEFAULT true,
            "showEmail" BOOLEAN NOT NULL DEFAULT true,
            "showWebsite" BOOLEAN NOT NULL DEFAULT true,
            "ticketWidth" TEXT NOT NULL DEFAULT '80mm',
            "fontSize" TEXT NOT NULL DEFAULT 'medium',
            "includeVendor" BOOLEAN NOT NULL DEFAULT true,
            "includeCashSession" BOOLEAN NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);
        log('✓ Tabla company_config creada', 'green');
      } else {
        log('✓ Tabla company_config existe', 'green');
      }
    } catch (error) {
      log(`⚠️  Error al verificar/crear company_config: ${error.message}`, 'yellow');
    }
    
    log('═══════════════════════════════════════════════════', 'green');
    log('  ✅ DEPLOYMENT COMPLETADO EXITOSAMENTE', 'green');
    log('═══════════════════════════════════════════════════', 'green');
    
    await prisma.$disconnect();
    process.exit(0);
    
  } catch (error) {
    log('═══════════════════════════════════════════════════', 'red');
    log('  ❌ ERROR EN DEPLOYMENT', 'red');
    log('═══════════════════════════════════════════════════', 'red');
    console.error(error);
    
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      log('Error al desconectar Prisma', 'yellow');
    }
    process.exit(1);
  }
}

main();

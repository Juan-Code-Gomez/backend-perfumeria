#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

// Configurar la URL para el servidor de prueba
process.env.DATABASE_URL = 'postgresql://postgres:bFVTvxEHHlbUhYzAjePffYeBOFNmHrWy@mainline.proxy.rlwy.net:32067/railway';

const prisma = new PrismaClient();

async function main() {
  console.log('Verificando migraciones aplicadas...\n');
  
  try {
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at
      FROM _prisma_migrations
      ORDER BY finished_at DESC
    `;
    
    console.log(`Total de migraciones: ${migrations.length}\n`);
    migrations.forEach((m, i) => {
      console.log(`${i + 1}. ${m.migration_name}`);
      console.log(`   Aplicada: ${m.finished_at}\n`);
    });
    
    console.log('\nVerificando tablas existentes...\n');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    console.log(`Total de tablas: ${tables.length}\n`);
    tables.forEach((t, i) => {
      console.log(`${i + 1}. ${t.table_name}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

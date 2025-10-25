// Script para ejecutar la migración de InvoicePayment directamente
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Configurado' : 'NO CONFIGURADO');

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('🔄 Ejecutando migración para crear tabla InvoicePayment...');
    
    const sqlPath = path.join(__dirname, 'add-invoice-payment-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Ejecutar el SQL
    await prisma.$executeRawUnsafe(sql);
    
    console.log('✅ Tabla InvoicePayment creada exitosamente');
    
    // Verificar que la tabla existe
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'InvoicePayment'
    `;
    
    console.log('Verificación:', result);
    
  } catch (error) {
    console.error('❌ Error al ejecutar migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();

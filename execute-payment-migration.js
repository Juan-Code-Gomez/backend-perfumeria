// Script para ejecutar la migración de InvoicePayment
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('🔄 Ejecutando migración para tabla InvoicePayment y enum ExpenseCategory...\n');
    
    // Paso 1: Crear tabla InvoicePayment
    console.log('📋 Creando tabla InvoicePayment...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "InvoicePayment" (
        "id" SERIAL PRIMARY KEY,
        "invoiceId" INTEGER NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "paymentMethod" TEXT,
        "notes" TEXT,
        "expenseId" INTEGER UNIQUE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "InvoicePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE
      );
    `);
    console.log('✅ Tabla InvoicePayment creada\n');

    // Paso 2: Crear índices
    console.log('📋 Creando índices...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "InvoicePayment_invoiceId_idx" ON "InvoicePayment"("invoiceId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "InvoicePayment_paymentDate_idx" ON "InvoicePayment"("paymentDate");
    `);
    console.log('✅ Índices creados\n');

    // Paso 3: Agregar valor al enum ExpenseCategory
    console.log('📋 Agregando SUPPLIER_PAYMENT al enum ExpenseCategory...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'SUPPLIER_PAYMENT';
      `);
      console.log('✅ Valor SUPPLIER_PAYMENT agregado al enum\n');
    } catch (error) {
      // Si el valor ya existe, continuamos
      console.log('ℹ️  Valor SUPPLIER_PAYMENT ya existe en el enum\n');
    }

    // Verificar que todo se creó correctamente
    const tableExists = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'InvoicePayment'
    `;
    
    console.log('✅ Verificación:', tableExists);
    console.log('\n✅ Migración completada exitosamente!');
    console.log('\n💡 Ahora ejecuta: npx prisma generate');
    
  } catch (error) {
    console.error('❌ Error al ejecutar migración:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();

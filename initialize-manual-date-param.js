// Script para inicializar el parámetro allow_manual_sale_date
// Ejecutar con: node initialize-manual-date-param.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initializeParameter() {
  try {
    console.log('🔄 Verificando si el parámetro existe...');

    const existing = await prisma.systemParameter.findUnique({
      where: { parameterKey: 'allow_manual_sale_date' }
    });

    if (existing) {
      console.log('✅ El parámetro ya existe:', existing);
      return;
    }

    console.log('➕ Creando el parámetro allow_manual_sale_date...');

    const parameter = await prisma.systemParameter.create({
      data: {
        parameterKey: 'allow_manual_sale_date',
        parameterValue: false, // Desactivado por defecto
        parameterType: 'boolean',
        description: 'Permite seleccionar fecha manual al registrar ventas (para migración de datos históricos)',
        category: 'sales',
        isActive: true,
      }
    });

    console.log('✅ Parámetro creado exitosamente:', parameter);

  } catch (error) {
    console.error('❌ Error al inicializar parámetro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initializeParameter();

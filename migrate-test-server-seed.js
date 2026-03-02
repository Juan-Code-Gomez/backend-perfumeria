#!/usr/bin/env node

/**
 * Script para ejecutar seed en el servidor de prueba
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Configurar la URL para el servidor de prueba
process.env.DATABASE_URL = 'postgresql://postgres:bFVTvxEHHlbUhYzAjePffYeBOFNmHrWy@mainline.proxy.rlwy.net:32067/railway';

const prisma = new PrismaClient();

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

async function main() {
  log('═══════════════════════════════════════════════════', 'cyan');
  log('  🌱 SEED SERVIDOR DE PRUEBA', 'cyan');
  log('═══════════════════════════════════════════════════', 'cyan');

  try {
    // 1. Crear rol ADMIN si no existe
    log('Creando rol ADMIN...', 'blue');
    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: {
        name: 'ADMIN',
        description: 'Administrador del sistema',
      },
    });
    log(`✓ Rol ADMIN creado (ID: ${adminRole.id})`, 'green');

    // 2. Crear usuario administrador
    log('Creando usuario administrador...', 'blue');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: hashedPassword,
        name: 'Administrador',
        isActive: true,
      },
    });
    log(`✓ Usuario admin creado (ID: ${admin.id})`, 'green');

    // 3. Asignar rol ADMIN al usuario
    log('Asignando rol al usuario...', 'blue');
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: admin.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userId: admin.id,
        roleId: adminRole.id,
      },
    });
    log(`✓ Rol asignado al usuario`, 'green');

    // 4. Crear configuración de compañía
    log('Creando configuración de compañía...', 'blue');
    const companyConfig = await prisma.companyConfig.upsert({
      where: { id: 1 },
      update: {},
      create: {
        companyName: 'Servidor de Prueba',
        nit: '000000000-0',
        address: 'Dirección de prueba',
        phone: '000-0000000',
        email: 'prueba@ejemplo.com',
        currency: 'COP',
        printLogo: false,
        timezone: 'America/Bogota',
        dateFormat: 'DD/MM/YYYY',
        numberFormat: 'es-CO',
      },
    });
    log(`✓ Configuración de compañía creada`, 'green');

    // 5. Crear unidades básicas
    log('Creando unidades de medida...', 'blue');
    const units = ['Unidad', 'Caja', 'Paquete', 'Kilo', 'Litro'];
    for (const unitName of units) {
      await prisma.unit.upsert({
        where: { name: unitName },
        update: {},
        create: { name: unitName },
      });
    }
    log(`✓ ${units.length} unidades creadas`, 'green');

    // 6. Crear categorías básicas
    log('Creando categorías...', 'blue');
    const categories = ['Perfumes', 'Maquillaje', 'Cuidado Personal', 'Accesorios'];
    for (const categoryName of categories) {
      await prisma.category.upsert({
        where: { name: categoryName },
        update: {},
        create: { name: categoryName, description: `Categoría de ${categoryName}` },
      });
    }
    log(`✓ ${categories.length} categorías creadas`, 'green');

    // 7. Crear proveedor por defecto
    log('Creando proveedor por defecto...', 'blue');
    await prisma.supplier.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Proveedor General',
        nit: '000000000-0',
        contactPerson: 'Contacto',
        phone: '000-0000000',
        isActive: true,
      },
    });
    log(`✓ Proveedor por defecto creado`, 'green');

    log('═══════════════════════════════════════════════════', 'green');
    log('  ✅ SEED COMPLETADO', 'green');
    log('═══════════════════════════════════════════════════', 'green');
    log('', 'reset');
    log('Usuario administrador:', 'cyan');
    log('  Username: admin', 'yellow');
    log('  Password: admin123', 'yellow');

  } catch (error) {
    log('═══════════════════════════════════════════════════', 'red');
    log('  ❌ ERROR EN SEED', 'red');
    log('═══════════════════════════════════════════════════', 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

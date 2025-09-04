// scripts/create-vendedor-user.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createVendedorUser() {
  console.log('👤 Creando usuario vendedor de prueba...');

  try {
    // Buscar el rol VENDEDOR
    const vendedorRole = await prisma.role.findFirst({
      where: { name: 'VENDEDOR' }
    });

    if (!vendedorRole) {
      console.log('❌ Rol VENDEDOR no encontrado. Ejecuta el seed primero.');
      return;
    }

    console.log(`✅ Rol VENDEDOR encontrado: ${vendedorRole.id}`);

    // Verificar si ya existe un usuario vendedor
    const existingUser = await prisma.user.findFirst({
      where: { username: 'vendedor1' }
    });

    if (existingUser) {
      console.log('ℹ️ Usuario vendedor1 ya existe.');
      return;
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash('vendedor123', 10);

    // Crear el usuario
    const newUser = await prisma.user.create({
      data: {
        username: 'vendedor1',
        password: hashedPassword,
        name: 'Juan Vendedor',
        isActive: true,
      }
    });

    console.log(`✅ Usuario creado: ${newUser.id} - ${newUser.name}`);

    // Asignar el rol VENDEDOR al usuario
    await prisma.userRole.create({
      data: {
        userId: newUser.id,
        roleId: vendedorRole.id,
      }
    });

    console.log('✅ Rol VENDEDOR asignado al usuario');

    console.log('\n🎉 Usuario vendedor creado exitosamente!');
    console.log('📋 Credenciales de acceso:');
    console.log('   👤 Usuario: vendedor1');
    console.log('   🔐 Contraseña: vendedor123');

  } catch (error) {
    console.error('❌ Error creando usuario vendedor:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createVendedorUser();

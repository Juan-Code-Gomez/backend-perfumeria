// Script para crear un usuario administrador de prueba
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('👤 Creando usuario administrador de prueba...');

    // Verificar si ya existe el usuario
    const existingUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (existingUser) {
      console.log('⚠️ Usuario admin ya existe');
      console.log('🔑 Credenciales: admin / admin123');
      return existingUser;
    }

    // Verificar si existe el rol de admin
    let adminRole = await prisma.role.findUnique({
      where: { name: 'admin' }
    });

    if (!adminRole) {
      console.log('🏷️ Creando rol de administrador...');
      adminRole = await prisma.role.create({
        data: {
          name: 'admin',
          description: 'Administrador del sistema'
        }
      });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Crear usuario admin
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        name: 'Administrador',
        isActive: true
      }
    });

    // Asignar rol de admin
    await prisma.userRole.create({
      data: {
        userId: admin.id,
        roleId: adminRole.id
      }
    });

    console.log('✅ Usuario administrador creado exitosamente');
    console.log('🔑 Credenciales:');
    console.log('   Usuario: admin');
    console.log('   Contraseña: admin123');
    console.log('');
    console.log('🚀 Ahora puedes usar estos datos para autenticarte');

    return admin;

  } catch (error) {
    console.error('❌ Error creando usuario:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createTestUser()
    .catch((e) => {
      console.error('❌ Error:', e);
      process.exit(1);
    });
}

export default createTestUser;

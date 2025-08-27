// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { seedModules, seedRoles, seedPermissions } from './seed-modules';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed modules and roles first
  await seedModules();
  await seedRoles();
  await seedPermissions();

  // 2. Crea el usuario super admin
  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'SUPER_ADMIN' }
  });

  if (!superAdminRole) {
    throw new Error('SUPER_ADMIN role not found');
  }

  // 2. Crea el usuario super admin
  const password = await bcrypt.hash('superadmin123', 10); // ¡Cámbialo luego!
  const superAdmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      password,
      name: 'Super Administrador',
      roles: {
        create: [{ roleId: superAdminRole.id }]
      }
    },
  });

  // 3. Crear usuario admin del cliente
  const adminRole = await prisma.role.findUnique({
    where: { name: 'ADMIN' }
  });

  if (adminRole) {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: adminPassword,
        name: 'Administrador Cliente',
        roles: {
          create: [{ roleId: adminRole.id }]
        }
      },
    });
  }

  console.log('🎉 Database seeding completed successfully!');
  console.log('👤 Super Admin: superadmin / superadmin123');
  console.log('👤 Client Admin: admin / admin123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

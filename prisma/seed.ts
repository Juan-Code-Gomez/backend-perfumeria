// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Limpia todas las tablas (opcional si usas migrate reset)
  // await prisma.userRole.deleteMany();
  // await prisma.user.deleteMany();
  // await prisma.role.deleteMany();

  // 1. Crea los roles base
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Administrador total' },
  });
  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: { name: 'USER', description: 'Usuario estándar' },
  });

  // 2. Crea el usuario admin solo si no existe
  const password = await bcrypt.hash('admin123', 10); // ¡Cámbialo luego!
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password,
      name: 'Administrador',
      roles: {
        create: [{ roleId: adminRole.id }]
      }
    },
  });

  console.log('Seed ejecutado: roles y usuario admin creados');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

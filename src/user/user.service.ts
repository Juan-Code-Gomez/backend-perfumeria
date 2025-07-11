// src/user/user.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // Nuevo signature: roleIds opcional
  async create(data: {
    name: string;
    username: string;
    password: string;
    roleIds?: number[];
  }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Si no me pasaron roleIds, por defecto conectamos al rol "USER"
    const roleConnections =
      data.roleIds && data.roleIds.length > 0
        ? data.roleIds.map((id) => ({ role: { connect: { id } } }))
        : [{ role: { connect: { name: 'USER' } } }];

    return this.prisma.user.create({
      data: {
        username: data.username,
        name: data.name,
        password: hashedPassword,
        roles: {
          create: roleConnections,
        },
      },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      include: { roles: { include: { role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username: username },
      include: { roles: { include: { role: true } } },
    });
  }

  async update(
    id: number,
    data: { name?: string; password?: string; roleIds?: number[] },
  ) {
    // Actualiza solo los campos enviados
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.password)
      updateData.password = await bcrypt.hash(data.password, 10);

    // Actualizar roles (opcional)
    if (data.roleIds && Array.isArray(data.roleIds)) {
      // Primero elimina los roles existentes, luego agrega los nuevos
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      updateData.roles = {
        create: data.roleIds.map((roleId) => ({
          role: { connect: { id: roleId } },
        })),
      };
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { roles: { include: { role: true } } },
    });
  }

  async remove(id: number) {
    // Primero elimina los roles asociados para evitar errores de FK
    await this.prisma.userRole.deleteMany({ where: { userId: id } });
    return this.prisma.user.delete({ where: { id } });
  }
}

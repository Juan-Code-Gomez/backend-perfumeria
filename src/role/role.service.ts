import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role as RoleModel, Prisma } from '@prisma/client';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { name: string; description?: string }) {
    return this.prisma.role.create({
      data,
    });
  }

  findAll() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.role.findUnique({
      where: { id },
    });
  }

  update(id: number, data: { name?: string; description?: string }) {
    return this.prisma.role.update({
      where: { id },
      data,
    });
  }

  remove(id: number) {
    return this.prisma.role.delete({
      where: { id },
    });
  }
}

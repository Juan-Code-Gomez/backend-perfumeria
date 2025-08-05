import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  createClient(data: Prisma.ClientCreateInput) {
    return this.prisma.client.create({ data });
  }

  findClients(name?: string) {
    return this.prisma.client.findMany({
      where: {
        name: { contains: name, mode: 'insensitive' },
      },
    });
  }

  getClientById(id: number) {
    return this.prisma.client.findUnique({ where: { id } });
  }

  async updateClient(id: number, data: Prisma.ClientUpdateInput) {
    const exists = await this.prisma.client.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Cliente no encontrado');
    return this.prisma.client.update({ where: { id }, data });
  }

  async deleteClient(id: number) {
    const exists = await this.prisma.client.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Cliente no encontrado');
    return this.prisma.client.delete({ where: { id } });
  }
}

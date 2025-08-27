import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async createClient(data: Prisma.ClientCreateInput) {
    const client = await this.prisma.client.create({ data });
    return {
      success: true,
      data: client,
    };
  }

  async findClients(name?: string) {
    const clients = await this.prisma.client.findMany({
      where: name ? {
        name: { contains: name, mode: 'insensitive' },
      } : {},
      orderBy: { createdAt: 'desc' },
    });
    
    return {
      success: true,
      data: clients,
      timestamp: new Date().toISOString(),
    };
  }

  async getClientById(id: number) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    
    return {
      success: true,
      data: client,
    };
  }

  async updateClient(id: number, data: Prisma.ClientUpdateInput) {
    const exists = await this.prisma.client.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Cliente no encontrado');
    
    const client = await this.prisma.client.update({ where: { id }, data });
    return {
      success: true,
      data: client,
    };
  }

  async deleteClient(id: number) {
    const exists = await this.prisma.client.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Cliente no encontrado');
    
    await this.prisma.client.delete({ where: { id } });
    return {
      success: true,
      message: 'Cliente eliminado exitosamente',
    };
  }
}

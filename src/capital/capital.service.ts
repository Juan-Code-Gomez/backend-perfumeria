// src/capital/capital.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCapitalDto, UpdateCapitalDto } from './dto/create-capital.dto';

@Injectable()
export class CapitalService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCapitalDto) {
    return this.prisma.capital.create({ data });
  }

  async findAll() {
    return this.prisma.capital.findMany({
      orderBy: { date: 'desc' },
    });
  }

  async findLatest() {
    return this.prisma.capital.findFirst({
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.capital.findUnique({ 
      where: { id } 
    });
  }

  async update(id: number, data: UpdateCapitalDto) {
    return this.prisma.capital.update({ 
      where: { id }, 
      data 
    });
  }

  async remove(id: number) {
    return this.prisma.capital.delete({ 
      where: { id } 
    });
  }

  async getCapitalSummary() {
    const latest = await this.findLatest();
    const total = (latest?.cash || 0) + (latest?.bank || 0);
    
    return {
      cash: latest?.cash || 0,
      bank: latest?.bank || 0,
      total,
      lastUpdate: latest?.date || null,
    };
  }
}

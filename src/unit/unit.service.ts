// src/unit/unit.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateUnitDto) {
    return this.prisma.unit.create({ data });
  }

  findAll() {
    return this.prisma.unit.findMany();
  }

  findOne(id: number) {
    return this.prisma.unit.findUnique({ where: { id } });
  }

  update(id: number, data: UpdateUnitDto) {
    return this.prisma.unit.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.unit.delete({ where: { id } });
  }
}

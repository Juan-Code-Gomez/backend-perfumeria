// src/supplier/supplier.service.ts
import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { Supplier } from '@prisma/client'

@Injectable()
export class SupplierService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.prisma.supplier.create({ data })
  }

  findAll() {
    return this.prisma.supplier.findMany({ orderBy: { createdAt: 'desc' } })
  }

  findOne(id: number) {
    return this.prisma.supplier.findUnique({ where: { id } })
  }

  update(id: number, data: Partial<Supplier>) {
    return this.prisma.supplier.update({ where: { id }, data })
  }

  remove(id: number) {
    return this.prisma.supplier.delete({ where: { id } })
  }
}

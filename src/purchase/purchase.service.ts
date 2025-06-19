import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PurchaseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    supplierId: number;
    date?: Date; // opcional, si no se envía se usará el default de Prisma
    totalAmount: number;
    paidAmount: number;
    isPaid: boolean;
    details: {
      productId: number;
      quantity: number;
      unitCost: number;
    }[];
  }) {
    return this.prisma.purchase.create({
      data: {
        supplierId: data.supplierId,
        date: data.date ?? undefined, // usa el default si no se especifica
        totalAmount: data.totalAmount,
        paidAmount: data.paidAmount,
        isPaid: data.isPaid,
        details: {
          create: data.details.map((detail) => ({
            productId: detail.productId,
            quantity: detail.quantity,
            unitCost: detail.unitCost,
            totalCost: detail.quantity * detail.unitCost,
          })),
        },
      },
      include: {
        details: true,
        supplier: true,
      },
    });
  }

  async findAll() {
    return this.prisma.purchase.findMany({
      orderBy: { date: 'desc' },
      include: {
        details: true,
        supplier: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.purchase.findUnique({
      where: { id },
      include: {
        details: true,
        supplier: true,
      },
    });
  }

  async update(
    id: number,
    data: {
      supplierId: number;
      date?: Date;
      totalAmount: number;
      paidAmount: number;
      isPaid: boolean;
      details: {
        id?: number; // en caso de edición futura
        productId: number;
        quantity: number;
        unitCost: number;
      }[];
    },
  ) {
    // 1. Eliminar detalles anteriores
    await this.prisma.purchaseDetail.deleteMany({
      where: { purchaseId: id },
    });

    // 2. Actualizar la compra y recrear los detalles
    return this.prisma.purchase.update({
      where: { id },
      data: {
        supplierId: data.supplierId,
        date: data.date ?? undefined,
        totalAmount: data.totalAmount,
        paidAmount: data.paidAmount,
        isPaid: data.isPaid,
        details: {
          create: data.details.map((detail) => ({
            productId: detail.productId,
            quantity: detail.quantity,
            unitCost: detail.unitCost,
            totalCost: detail.quantity * detail.unitCost,
          })),
        },
      },
      include: {
        details: true,
        supplier: true,
      },
    });
  }
}

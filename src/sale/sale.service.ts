// src/sale/sale.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SaleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    customerName: string;
    totalAmount: number;
    paidAmount: number;
    isPaid: boolean;
    details: {
      productId: number;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }[];
  }) {
    const sale = await this.prisma.sale.create({
      data: {
        customerName: data.customerName,
        totalAmount: data.totalAmount,
        paidAmount: data.paidAmount,
        isPaid: data.isPaid,
        details: {
          create: data.details.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: {
        details: true,
      },
    });

    return sale;
  }

  async update(
    id: number,
    data: {
      customerName?: string;
      totalAmount?: number;
      paidAmount?: number;
      isPaid?: boolean;
      details?: {
        productId: number;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
      }[];
    },
  ) {
    const sale = await this.prisma.sale.update({
      where: { id },
      data: {
        customerName: data.customerName,
        totalAmount: data.totalAmount,
        paidAmount: data.paidAmount,
        isPaid: data.isPaid,
        details: {
          deleteMany: {}, // Clear existing details
          create:
            data.details?.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            })) || [],
        },
      },
      include: {
        details: true,
      },
    });
    return sale;
  }

  async findAll(query: {
    customerName?: string;
    startDate?: string;
    endDate?: string;
    isPaid?: boolean;
  }) {
    const { customerName, startDate, endDate, isPaid } = query;

    return this.prisma.sale.findMany({
      where: {
        customerName: customerName
          ? { contains: customerName, mode: 'insensitive' }
          : undefined,
        isPaid: isPaid !== undefined ? isPaid : undefined,
        date: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      },
      include: {
        details: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

async findOne(id: number) {
  return this.prisma.sale.findUnique({
    where: { id },
    include: {
      details: {
        include: {
          product: true,
        },
      },
    },
  });
}

  async remove(id: number) {
    return this.prisma.sale.delete({
      where: { id },
    });
  }
}

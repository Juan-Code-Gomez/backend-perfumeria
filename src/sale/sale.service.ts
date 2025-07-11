import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SaleService {
  constructor(private prisma: PrismaService) {}

async create(data: CreateSaleDto) {
  const isPaid = data.isPaid ?? (data.paidAmount >= data.totalAmount);

  return this.prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        date: data.date ? new Date(data.date) : new Date(),
        customerName: data.customerName,
        totalAmount: data.totalAmount,
        paidAmount: data.paidAmount,
        isPaid,
        details: {
          create: data.details.map((d) => ({
            productId: d.productId,
            quantity: Number(d.quantity),
            unitPrice: Number(d.unitPrice),
            totalPrice: Number(d.quantity) * Number(d.unitPrice),
          })),
        },
      },
      include: {
        details: { include: { product: true } },
      },
    });

    // Descontar el stock
    await Promise.all(
      data.details.map(async (d) => {
        await tx.product.update({
          where: { id: d.productId },
          data: { stock: { decrement: Number(d.quantity) } },
        });
      }),
    );

    return sale;
  });
}
  async findAll() {
    return this.prisma.sale.findMany({
      include: {
        details: { include: { product: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.sale.findUnique({
      where: { id },
      include: {
        details: { include: { product: true } },
      },
    });
  }
}

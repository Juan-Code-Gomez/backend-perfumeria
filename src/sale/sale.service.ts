import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SaleService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateSaleDto) {
    const isPaid = data.isPaid ?? data.paidAmount >= data.totalAmount;

    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          date: data.date ? new Date(data.date) : new Date(),
          customerName: data.customerName,
          totalAmount: data.totalAmount,
          paidAmount: data.paidAmount,
          isPaid,
          paymentMethod: data.paymentMethod,
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

  async findAll({ dateFrom, dateTo }: { dateFrom?: string; dateTo?: string }) {
    const where: any = {};

    if (dateFrom && dateTo) {
      // Filtra entre ambas fechas, todo el día (de 00:00 a 23:59)
      where.date = {
        gte: new Date(`${dateFrom}T00:00:00.000Z`),
        lte: new Date(`${dateTo}T23:59:59.999Z`),
      };
    } else {
      // Si no hay filtro, devuelve las ventas del día actual
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      const start = new Date(`${y}-${m}-${d}T00:00:00.000Z`);
      const end = new Date(`${y}-${m}-${d}T23:59:59.999Z`);
      where.date = { gte: start, lte: end };
    }

    return this.prisma.sale.findMany({
      where,
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

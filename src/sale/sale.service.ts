import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CreateSalePaymentDto } from './dto/create-sale-payment.dto';

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

  async addPayment(saleId: number, dto: CreateSalePaymentDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Crear el abono
      const payment = await tx.salePayment.create({
        data: {
          saleId,
          amount: dto.amount,
          date: dto.date ? new Date(dto.date) : new Date(),
          method: dto.method,
          note: dto.note,
        },
      });

      // 2. Recalcular abonos acumulados
      const payments = await tx.salePayment.findMany({
        where: { saleId },
        select: { amount: true },
      });
      const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

      // 3. Marcar como pagada si ya cubre el total
      const sale = await tx.sale.findUnique({ where: { id: saleId } });
      if (sale && !sale.isPaid && totalPaid >= sale.totalAmount) {
        await tx.sale.update({
          where: { id: saleId },
          data: {
            paidAmount: totalPaid,
            isPaid: true,
          },
        });
      } else {
        await tx.sale.update({
          where: { id: saleId },
          data: {
            paidAmount: totalPaid,
          },
        });
      }

      return payment;
    });
  }

  async getPayments(saleId: number) {
    return this.prisma.salePayment.findMany({
      where: { saleId },
      orderBy: { date: 'asc' }, // o 'desc' según prefieras
      select: {
        id: true,
        amount: true,
        date: true,
        method: true,
        note: true,
        createdAt: true,
      },
    });
  }

  async getPendingSales() {
    const sales = await this.prisma.sale.findMany({
      include: { payments: true },
      where: { isPaid: false },
      orderBy: { date: 'desc' },
    });
    // Opcional: calcula el saldo pendiente y devuélvelo en la respuesta
    return sales.map((sale) => {
      const sumAbonos = sale.payments.reduce((acc, p) => acc + p.amount, 0);
      const totalPaid = (sale.paidAmount || 0) + sumAbonos;
      const pending = sale.totalAmount - totalPaid;
      return { ...sale, totalPaid, pending };
    });
  }
}

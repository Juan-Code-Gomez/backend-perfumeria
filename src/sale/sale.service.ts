import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CreateSalePaymentDto } from './dto/create-sale-payment.dto';

@Injectable()
export class SaleService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateSaleDto) {
    let isPaid = data.isPaid ?? false;
    let paidAmount = Number(data.paidAmount) || 0;

    // Si la venta es de contado y está marcada como pagada, el paidAmount es el total
    if (isPaid) {
      paidAmount = data.totalAmount;
    }

    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          date: data.date ? new Date(data.date) : new Date(),
          customerName: data.customerName,
          clientId: data.clientId,
          totalAmount: data.totalAmount,
          paidAmount: paidAmount,
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
      where.date = {
        gte: new Date(`${dateFrom}T00:00:00.000Z`),
        lte: new Date(`${dateTo}T23:59:59.999Z`),
      };
    } else {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      const start = new Date(`${y}-${m}-${d}T00:00:00.000Z`);
      const end = new Date(`${y}-${m}-${d}T23:59:59.999Z`);
      where.date = { gte: start, lte: end };
    }

    const ventas = await this.prisma.sale.findMany({
      where,
      include: {
        details: { include: { product: true } },
        payments: true, // Incluye los abonos
        client: true,
      },
      orderBy: { date: 'desc' },
    });

    // Mapea cada venta y suma los abonos
    return ventas.map((v) => {
      // Si hay abonos, paidAmount = suma de abonos
      let paidAmount = v.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      // Si no hay abonos y la venta está pagada, el paidAmount es el totalAmount
      if ((!v.payments || v.payments.length === 0) && v.isPaid) {
        paidAmount = v.totalAmount;
      }
      // Si no hay abonos y no está pagada, el paidAmount es 0
      if ((!v.payments || v.payments.length === 0) && !v.isPaid) {
        paidAmount = 0;
      }
      const pending = Math.max(0, v.totalAmount - paidAmount);
      // isPaid se calcula: si tiene abonos suficientes o ya estaba marcada pagada
      const isPaid = v.isPaid || paidAmount >= v.totalAmount;

      const displayName = v.client?.name ?? v.customerName;

      return {
        ...v,
        paidAmount,
        pending,
        isPaid,
        customerName: displayName, // siempre usar displayName
        client: v.client,
      };
    });
  }

  async findOne(id: number) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        details: { include: { product: true } },
        payments: true,
        client: true,
      },
    });

    if (!sale) return null;

    let paidAmount = sale.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    if ((!sale.payments || sale.payments.length === 0) && sale.isPaid) {
      paidAmount = sale.totalAmount;
    }
    if ((!sale.payments || sale.payments.length === 0) && !sale.isPaid) {
      paidAmount = 0;
    }
    const pending = Math.max(0, sale.totalAmount - paidAmount);
    const isPaid = sale.isPaid || paidAmount >= sale.totalAmount;

    const displayName = sale.client?.name ?? sale.customerName;

    return {
      ...sale,
      paidAmount,
      pending,
      isPaid,
      customerName: displayName,
      client: sale.client,
    };
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

      // 2. Recalcular abonos acumulados sobre la venta
      const payments = await tx.salePayment.findMany({
        where: { saleId },
        select: { amount: true },
      });
      const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

      // 1) Busca la venta
      const saleRecord = await tx.sale.findUnique({
        where: { id: saleId },
      });

      // 2) Asegúrate de que exista
      if (!saleRecord) {
        throw new Error(`Venta con id ${saleId} no encontrada`);
      }

      // 3) Ahora usa saleRecord.totalAmount con seguridad
      const isPaidFlag = totalPaid >= saleRecord.totalAmount;

      await tx.sale.update({
        where: { id: saleId },
        data: {
          paidAmount: totalPaid,
          isPaid: isPaidFlag,
        },
      });

      // 4. **Registrar el ingreso en CashClosing** del día del abono
      const abonoDate = dto.date ? new Date(dto.date) : new Date();
      const dayStart = new Date(abonoDate);
      dayStart.setHours(0, 0, 0, 0);

      // Intenta actualizar un CashClosing ya existente
      const existingClosing = await tx.cashClosing.findUnique({
        where: { date: dayStart },
      });

      if (existingClosing) {
        // Suma al totalIncome
        await tx.cashClosing.update({
          where: { date: dayStart },
          data: { totalIncome: { increment: payment.amount } },
        });
      } else {
        // Si no existía, créalo con este abono como ingreso extra
        await tx.cashClosing.create({
          data: {
            date: dayStart,
            openingCash: 0,
            closingCash: 0,
            systemCash: 0,
            difference: 0,
            totalSales: 0,
            cashSales: 0,
            cardSales: 0,
            transferSales: 0,
            creditSales: 0,
            totalIncome: payment.amount,
            totalExpense: 0,
            totalPayments: 0,
            notes: 'Apertura automática por abono',
          },
        });
      }

      return payment;
    });
  }

  async getPayments(saleId: number) {
    return this.prisma.salePayment.findMany({
      where: { saleId },
      orderBy: { date: 'asc' },
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
      where: { isPaid: false },
      include: {
        payments: true,
        client: true, // ← incluimos relación cliente
      },
      orderBy: { date: 'desc' },
    });

    return sales.map((sale) => {
      // 1) calcula total de abonos
      let totalPaid = sale.payments.reduce((acc, p) => acc + p.amount, 0);
      // 2) pendiente
      const pending = sale.totalAmount - totalPaid;
      // 3) decide si ya está pagada
      const isPaid = totalPaid >= sale.totalAmount;

      // 4) nombre a mostrar: cliente registrado o texto libre
      const displayName = sale.client?.name ?? sale.customerName;

      return {
        ...sale,
        totalPaid,
        pending,
        isPaid,
        customerName: displayName, // actualizamos el campo
        // opcionalmente podrías omitir client si no lo usas en frontend
      };
    });
  }
}

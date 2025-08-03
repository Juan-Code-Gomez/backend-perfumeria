import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCashClosingDto } from './dto/create-cash-closing.dto';

@Injectable()
export class CashClosingService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCashClosingDto, userId?: number) {
    const date = data.date ? new Date(data.date) : new Date();

    // Calcula el rango del día
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Busca si ya existe cierre para ese día
    const exist = await this.prisma.cashClosing.findUnique({
      where: { date: startOfDay },
    });
    if (exist)
      throw new BadRequestException('Ya existe un cierre para este día.');

    // 1. Ventas del día
    const sales = await this.prisma.sale.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay } },
    });

    const totalSales = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const cashSales = sales
      .filter((s) => s.paymentMethod === 'Efectivo')
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const cardSales = sales
      .filter((s) => s.paymentMethod === 'Tarjeta')
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const transferSales = sales
      .filter((s) => s.paymentMethod === 'Transferencia')
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const creditSales = sales
      .filter((s) => s.paymentMethod === 'Crédito' || s.isPaid === false)
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

    // 2. Egresos del día
    const expenses = await this.prisma.expense.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay } },
    });
    const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // 3. Pagos a proveedores del día (compras pagadas)
    const payments = await this.prisma.purchase.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay }, isPaid: true },
    });
    const totalPayments = payments.reduce(
      (sum, p) => sum + (p.paidAmount || 0),
      0,
    );

    // 4. Ingresos extra del día (puedes mejorar esto según tu modelo)
    const totalIncome = 0; // Ajusta si tienes ingresos extra

    // 5. Calcula caja según sistema
    const systemCash =
      (data.openingCash || 0) +
      cashSales +
      totalIncome -
      totalExpense -
      totalPayments;

    // 6. Diferencia real vs sistema
    const difference = data.closingCash - systemCash;

    // Guarda el cierre
    return this.prisma.cashClosing.create({
      data: {
        date: startOfDay,
        openingCash: data.openingCash,
        closingCash: data.closingCash,
        systemCash,
        difference,
        totalSales,
        cashSales,
        cardSales,
        transferSales,
        creditSales,
        totalIncome,
        totalExpense,
        totalPayments,
        notes: data.notes,
        createdById: userId || null,
      },
    });
  }

  async findAll() {
    return this.prisma.cashClosing.findMany({
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.cashClosing.findUnique({ where: { id } });
  }

  async getSummary(date?: string) {
    const today = date ? new Date(date) : new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Ventas pagadas del día
    const sales = await this.prisma.sale.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        isPaid: true, // Solo ventas pagadas
      },
    });

    const totalSales = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const cashSales = sales
      .filter((s) => s.paymentMethod === 'Efectivo')
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const cardSales = sales
      .filter((s) => s.paymentMethod === 'Tarjeta')
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const transferSales = sales
      .filter((s) => s.paymentMethod === 'Transferencia')
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const creditSales = sales
      .filter((s) => s.paymentMethod === 'Crédito' || s.isPaid === false)
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

    // 2. Egresos/gastos del día
    const expenses = await this.prisma.expense.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay } },
    });
    const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // 3. Pagos a proveedores (compras pagadas)
    const payments = await this.prisma.purchase.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay }, isPaid: true },
    });
    const totalPayments = payments.reduce(
      (sum, p) => sum + (p.paidAmount || 0),
      0,
    );

    // 4. Ingresos extra
    const totalIncome = 0; // Si tienes modelo, ajusta aquí

    // Caja según sistema
    // Puedes pedir openingCash como parámetro opcional si lo necesitas aquí
    const systemCash = cashSales + totalIncome - totalExpense - totalPayments;

    return {
      fecha: startOfDay,
      totalSales,
      cashSales,
      cardSales,
      transferSales,
      creditSales,
      totalExpense,
      totalPayments,
      totalIncome,
      systemCash,
    };
  }
}

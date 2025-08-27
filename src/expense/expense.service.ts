import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CapitalAutoService } from '../services/capital-auto.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/create-expense.dto';
import { ExpenseCategory } from '@prisma/client';

interface FindAllOpts {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  paymentMethod?: string;
  search?: string;
  isRecurring?: boolean;
  page: number;
  pageSize: number;
}

interface SummaryOpts {
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class ExpenseService {
  constructor(
    private prisma: PrismaService,
    private capitalAutoService: CapitalAutoService,
  ) {}

  async create(dto: CreateExpenseDto) {
    // Crear fecha local sin interpretación UTC
    let date: Date;
    if (dto.date) {
      const dateStr = dto.date.toString();
      const parts = dateStr.split('-');
      date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else {
      date = new Date();
    }
    
    const expense = await this.prisma.expense.create({
      data: {
        date: date,
        amount: dto.amount,
        description: dto.description,
        category: dto.category as ExpenseCategory,
        paymentMethod: dto.paymentMethod,
        notes: dto.notes,
      },
    });

    // Registrar automáticamente en capital
    try {
      await this.capitalAutoService.processExpense(
        expense.id,
        expense.amount,
        expense.paymentMethod || 'EFECTIVO',
        expense.description
      );
    } catch (error) {
      console.error('Error registrando gasto en capital:', error);
      // No fallar la creación del gasto por error en capital
    }

    return expense;
  }

  async findAll(opts: FindAllOpts) {
    const where: any = { deletedAt: null };

    if (opts.dateFrom && opts.dateTo) {
      where.date = { gte: new Date(opts.dateFrom), lte: new Date(opts.dateTo) };
    }

    if (opts.category) where.category = opts.category;
    if (opts.paymentMethod) where.paymentMethod = opts.paymentMethod;
    
    if (opts.search) {
      where.description = { contains: opts.search, mode: 'insensitive' };
    }

    // GASTOS FIJOS vs VARIABLES
    if (opts.isRecurring === true) {
      // Solo los que vienen de plantilla
      where.recurringExpenseId = { not: null };
    } else if (opts.isRecurring === false) {
      // Solo los manuales (sin plantilla)
      where.recurringExpenseId = null;
    }

    const [items, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (opts.page - 1) * opts.pageSize,
        take: opts.pageSize,
      }),
      this.prisma.expense.count({ where }),
    ]);
    return { items, total };
  }

  async getSummary(opts: SummaryOpts) {
    const where: any = { deletedAt: null };
    if (opts.dateFrom && opts.dateTo) {
      where.date = { gte: new Date(opts.dateFrom), lte: new Date(opts.dateTo) };
    }
    
    // Total general
    const total = await this.prisma.expense.aggregate({
      _sum: { amount: true },
      where,
    });
    
    // Por categoría
    const byCat = await this.prisma.expense.groupBy({
      by: ['category'],
      _sum: { amount: true },
      where,
    });
    
    // Por método de pago
    const byPayment = await this.prisma.expense.groupBy({
      by: ['paymentMethod'],
      _sum: { amount: true },
      where,
    });
    
    // Promedio diario
    const expenses = await this.prisma.expense.findMany({ where });
    const dailyAverage = expenses.length > 0 ? (total._sum.amount || 0) / expenses.length : 0;
    
    // Mes anterior para comparación
    let previousMonthTotal = 0;
    if (opts.dateFrom && opts.dateTo) {
      const fromDate = new Date(opts.dateFrom);
      const toDate = new Date(opts.dateTo);
      const monthsDiff = (toDate.getFullYear() - fromDate.getFullYear()) * 12 + 
                        (toDate.getMonth() - fromDate.getMonth());
      
      if (monthsDiff === 0) { // Si es el mismo mes, comparar con mes anterior
        const prevMonthStart = new Date(fromDate);
        prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
        const prevMonthEnd = new Date(toDate);
        prevMonthEnd.setMonth(prevMonthEnd.getMonth() - 1);
        
        const prevTotal = await this.prisma.expense.aggregate({
          _sum: { amount: true },
          where: {
            deletedAt: null,
            date: { gte: prevMonthStart, lte: prevMonthEnd }
          },
        });
        previousMonthTotal = prevTotal._sum.amount || 0;
      }
    }
    
    return {
      total: total._sum.amount || 0,
      dailyAverage: Math.round(dailyAverage),
      previousMonthTotal,
      byCategory: Object.fromEntries(
        byCat.map((r) => [r.category, r._sum.amount || 0]),
      ),
      byPaymentMethod: Object.fromEntries(
        byPayment.map((r) => [r.paymentMethod, r._sum.amount || 0]),
      ),
    };
  }

  async findOne(id: number) {
    const exp = await this.prisma.expense.findUnique({
      where: { id },
    });
    if (!exp || exp.deletedAt) throw new NotFoundException('No existe gasto');
    return exp;
  }

  async update(id: number, dto: UpdateExpenseDto) {
    await this.findOne(id);
    
    let updateData: any = { ...dto };
    
    // Manejar la fecha si viene en el DTO
    if (dto.date) {
      const dateStr = dto.date.toString();
      const parts = dateStr.split('-');
      updateData.date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    
    return this.prisma.expense.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    // Soft delete:
    return this.prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

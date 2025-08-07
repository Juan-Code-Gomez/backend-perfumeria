import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/create-expense.dto';
import { ExpenseCategory } from '@prisma/client';

interface FindAllOpts {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
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
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: {
        date: new Date(dto.date),
        amount: dto.amount,
        description: dto.description,
        category: dto.category as ExpenseCategory,
        notes: dto.notes,
      },
    });
  }

  async findAll(opts: FindAllOpts) {
    const where: any = { deletedAt: null };

    if (opts.dateFrom && opts.dateTo) {
      where.date = { gte: new Date(opts.dateFrom), lte: new Date(opts.dateTo) };
    }

    if (opts.category) where.category = opts.category;

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
    // total general
    const total = await this.prisma.expense.aggregate({
      _sum: { amount: true },
      where,
    });
    // por categoría
    const byCat = await this.prisma.expense.groupBy({
      by: ['category'],
      _sum: { amount: true },
      where,
    });
    return {
      total: total._sum.amount || 0,
      byCategory: Object.fromEntries(
        byCat.map((r) => [r.category, r._sum.amount || 0]),
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
    return this.prisma.expense.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
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

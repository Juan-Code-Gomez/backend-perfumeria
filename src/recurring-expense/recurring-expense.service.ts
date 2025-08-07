import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateRecurringExpenseDto,
  UpdateRecurringExpenseDto,
} from './dto/create-recurring-expense.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class RecurringExpenseService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateRecurringExpenseDto) {
    return this.prisma.recurringExpense.create({ data: dto });
  }

  findAll() {
    return this.prisma.recurringExpense.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(id: number, dto: UpdateRecurringExpenseDto) {
    await this.findOne(id);
    return this.prisma.recurringExpense.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.recurringExpense.delete({ where: { id } });
  }

  async findOne(id: number) {
    const rec = await this.prisma.recurringExpense.findUnique({
      where: { id },
    });
    if (!rec) throw new NotFoundException('RecurringExpense not found');
    return rec;
  }

  /**
   * Cada día a medianoche revisamos qué plantillas aplican hoy
   * y generamos gastos en la tabla Expense.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyJob() {
    const today = new Date();
    const day = today.getDate();

    // 1) Plantillas que aplican hoy
    const recs = await this.prisma.recurringExpense.findMany({
      where: { daysOfMonth: { has: day } },
    });

    // 2) Crear un Expense por cada plantilla
    await Promise.all(
      recs.map((r) =>
        this.prisma.expense.create({
          data: {
            date: today,
            description: r.concept, // tu columna real en Expense
            amount: r.amount,
            category: r.category,
            paymentMethod: r.paymentMethod,
            notes: r.notes,

            // en vez de recurringExpenseId, usa la relación
            recurringExpense: { connect: { id: r.id } },
          },
        }),
      ),
    );
  }
}

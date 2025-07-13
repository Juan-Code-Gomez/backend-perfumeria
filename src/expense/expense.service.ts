import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpenseService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: {
        date: data.date ? new Date(data.date) : new Date(),
        amount: data.amount,
        description: data.description,
        category: data.category,
      },
    });
  }

  async findAll() {
    return this.prisma.expense.findMany({
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: number) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException('Egreso no encontrado');
    return expense;
  }

  async update(id: number, data: UpdateExpenseDto) {
    return this.prisma.expense.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.expense.delete({ where: { id } });
  }
}

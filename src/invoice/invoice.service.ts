// src/invoice/invoice.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto, UpdateInvoiceDto, PayInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateInvoiceDto) {
    const invoiceData = {
      ...data,
      invoiceDate: new Date(data.invoiceDate),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      paidAmount: data.paidAmount || 0,
      status: this.calculateStatus(data.amount, data.paidAmount || 0),
    };

    return this.prisma.invoice.create({ data: invoiceData });
  }

  async findAll(filters?: { status?: string; overdue?: boolean }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.overdue) {
      where.dueDate = {
        lt: new Date(),
      };
      where.status = {
        not: 'PAID',
      };
    }

    return this.prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.invoice.findUnique({ where: { id } });
  }

  async update(id: number, data: UpdateInvoiceDto) {
    const updateData: any = { ...data };
    
    if (data.invoiceDate) {
      updateData.invoiceDate = new Date(data.invoiceDate);
    }
    
    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate);
    }

    // Recalcular status si se actualiza amount o paidAmount
    if (data.amount !== undefined || data.paidAmount !== undefined) {
      const currentInvoice = await this.findOne(id);
      if (!currentInvoice) {
        throw new Error('Factura no encontrada');
      }
      const newAmount = data.amount ?? currentInvoice.amount;
      const newPaidAmount = data.paidAmount ?? currentInvoice.paidAmount;
      updateData.status = this.calculateStatus(newAmount, newPaidAmount);
    }

    return this.prisma.invoice.update({ where: { id }, data: updateData });
  }

  async payInvoice(id: number, paymentData: PayInvoiceDto) {
    const invoice = await this.findOne(id);
    if (!invoice) {
      throw new Error('Factura no encontrada');
    }

    const newPaidAmount = invoice.paidAmount + paymentData.amount;
    
    if (newPaidAmount > invoice.amount) {
      throw new Error('El monto del pago excede el saldo pendiente');
    }

    const newStatus = this.calculateStatus(invoice.amount, newPaidAmount);

    return this.prisma.invoice.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.invoice.delete({ where: { id } });
  }

  async getInvoiceSummary() {
    const [all, pending, overdue] = await Promise.all([
      this.prisma.invoice.aggregate({
        _sum: { amount: true, paidAmount: true },
        _count: true,
      }),
      this.prisma.invoice.aggregate({
        where: { status: { not: 'PAID' } },
        _sum: { amount: true, paidAmount: true },
        _count: true,
      }),
      this.prisma.invoice.aggregate({
        where: {
          status: { not: 'PAID' },
          dueDate: { lt: new Date() },
        },
        _sum: { amount: true, paidAmount: true },
        _count: true,
      }),
    ]);

    return {
      total: {
        count: all._count,
        amount: all._sum.amount || 0,
        paid: all._sum.paidAmount || 0,
        pending: (all._sum.amount || 0) - (all._sum.paidAmount || 0),
      },
      pending: {
        count: pending._count,
        amount: pending._sum.amount || 0,
        paid: pending._sum.paidAmount || 0,
        pending: (pending._sum.amount || 0) - (pending._sum.paidAmount || 0),
      },
      overdue: {
        count: overdue._count,
        amount: overdue._sum.amount || 0,
        paid: overdue._sum.paidAmount || 0,
        pending: (overdue._sum.amount || 0) - (overdue._sum.paidAmount || 0),
      },
    };
  }

  private calculateStatus(amount: number, paidAmount: number): string {
    if (paidAmount === 0) return 'PENDING';
    if (paidAmount >= amount) return 'PAID';
    return 'PARTIAL';
  }
}

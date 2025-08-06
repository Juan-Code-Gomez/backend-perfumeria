import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CreateSalePaymentDto } from './dto/create-sale-payment.dto';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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

  async createCreditNote(saleId: number, dto: CreateCreditNoteDto) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: { details: true }, // ← aquí añadimos el include
    });

    if (!sale) throw new NotFoundException('Venta no encontrada');

    // Calcula subtotal de la nota
    const details = dto.details.map((d) => {
      const prod = {
        unitPrice:
          sale.details.find((sd) => sd.productId === d.productId)?.unitPrice ||
          0,
      };
      const qty = d.quantity;
      return {
        ...d,
        unitPrice: prod.unitPrice,
        totalPrice: qty * prod.unitPrice,
      };
    });
    const totalNote = details.reduce((sum, d) => sum + d.totalPrice, 0);

    return this.prisma.$transaction(async (tx) => {
      // 1) Crear la nota de crédito
      const note = await tx.creditNote.create({
        data: {
          saleId,
          date: dto.date ? new Date(dto.date) : undefined,
          totalAmount: totalNote,
          details: {
            create: details.map((d) => ({
              productId: d.productId,
              quantity: d.quantity,
              unitPrice: d.unitPrice,
              totalPrice: d.totalPrice,
            })),
          },
        },
        include: { details: true },
      });

      // 2) Ajustar stock: sumar la cantidad devuelta
      await Promise.all(
        details.map((d) =>
          tx.product.update({
            where: { id: d.productId },
            data: { stock: { increment: d.quantity } },
          }),
        ),
      );

      // 3) Reducir totalAmount y recalcular pendiente en la venta
      const newTotal = sale.totalAmount - totalNote;
      await tx.sale.update({
        where: { id: saleId },
        data: {
          totalAmount: newTotal,
        },
      });

      return note;
    });
  }

  async generatePendingPdf(saleId: number, dueDays: number): Promise<Buffer> {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: { details: { include: { product: true } }, client: true },
    });
    if (!sale) throw new NotFoundException();

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers: Buffer[] = [];
      doc.on('data', (b: Buffer) => buffers.push(b));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // --- 1) Encabezado con logo y datos ---
      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 80 });
      }
      doc.fontSize(20).text('Perfumería Milan', 150, 50, { bold: true });
      doc
        .fontSize(10)
        .text('Dirección: Carrera 9 # 14 -03', 150, 75)
        .text('Teléfono: +57 3123050704', 150, 90)
        .text('Email: milancol@gmail.com', 150, 105);

      // Línea divisoria
      doc.moveTo(50, 130).lineTo(545, 130).stroke();

      // --- 2) Info cliente y fechas ---
      const clienteY = 140;
      doc
        .fontSize(12)
        .text(
          `Cliente: ${sale.client?.name ?? sale.customerName}`,
          50,
          clienteY,
        )
        .text(`Documento: ${sale.client?.document ?? '-'}`, 50, clienteY + 15)
        .text(
          `Fecha venta: ${sale.date.toISOString().slice(0, 10)}`,
          300,
          clienteY,
        )
        .text(
          `Vence: ${new Date(Date.now() + dueDays * 86400000)
            .toISOString()
            .slice(0, 10)}`,
          300,
          clienteY + 15,
        );

      // --- 3) Tabla de productos ---
      const tableTop = clienteY + 50;
      const itemX = {
        name: 50,
        qty: 300,
        unitPrice: 350,
        total: 450,
      };

      doc
        .fontSize(10)
        .text('Producto', itemX.name, tableTop, { bold: true })
        .text('Cant.', itemX.qty, tableTop)
        .text('P. Unit.', itemX.unitPrice, tableTop)
        .text('Total', itemX.total, tableTop);

      doc
        .moveTo(50, tableTop + 15)
        .lineTo(545, tableTop + 15)
        .stroke();

      sale.details.forEach((d, i) => {
        const y = tableTop + 25 + i * 20;
        doc
          .text(d.product.name, itemX.name, y, { width: 240 })
          .text(d.quantity.toString(), itemX.qty, y)
          .text(`$${d.unitPrice.toLocaleString()}`, itemX.unitPrice, y)
          .text(
            `$${(d.quantity * d.unitPrice).toLocaleString()}`,
            itemX.total,
            y,
          );
      });

      // --- 4) Totales al final ---
      const summaryY = tableTop + 40 + sale.details.length * 20;
      const totalAmount = sale.details.reduce(
        (s, d) => s + d.quantity * d.unitPrice,
        0,
      );
      const paid = sale.paidAmount;
      const pending = totalAmount - paid;

      doc
        .fontSize(12)
        .text(`Total venta: $${totalAmount.toLocaleString()}`, 50, summaryY)
        .text(`Pagado: $${paid.toLocaleString()}`, 50, summaryY + 15)
        .text(
          `Saldo pendiente: $${pending.toLocaleString()}`,
          50,
          summaryY + 30,
          { bold: true },
        );

      // --- 5) Pie de página ---
      doc
        .fontSize(8)
        .text('Gracias por su preferencia •', 50, 780, {
          align: 'center',
          width: 495,
        });

      // Finaliza el documento
      doc.end();
    });
  }
}

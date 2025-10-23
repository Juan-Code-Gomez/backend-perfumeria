import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { parseLocalDate } from '../common/utils/timezone.util';
import { ProductBatchService } from '../product-batch/product-batch.service';

@Injectable()
export class PurchaseService {
  constructor(
    private prisma: PrismaService,
    private batchService: ProductBatchService,
  ) {}

  async create(data: CreatePurchaseDto) {
    const purchaseDate = data.date ? parseLocalDate(data.date) : new Date();
    const invoiceDate = data.invoiceDate ? parseLocalDate(data.invoiceDate) : null;
    const dueDate = data.dueDate ? parseLocalDate(data.dueDate) : null;

    // Calcular subtotal (suma de todos los detalles)
    const subtotal = data.details.reduce((sum, d) => sum + (d.quantity * d.unitCost), 0);
    
    // Calcular total aplicando descuento
    const discount = data.discount || 0;
    const totalAmount = subtotal - discount;
    
    // Determinar si está pagada
    const isPaid = data.isPaid ?? (data.paidAmount >= totalAmount);

    // Usamos una transacción para que todo ocurra en bloque
    return this.prisma.$transaction(async (tx) => {
      // 1. Crear la compra con sus detalles y datos de factura
      const purchase = await tx.purchase.create({
        data: {
          supplierId: data.supplierId,
          date: purchaseDate,
          subtotal,
          discount,
          totalAmount,
          paidAmount: data.paidAmount,
          isPaid,
          invoiceNumber: data.invoiceNumber,
          invoiceDate,
          dueDate,
          notes: data.notes,
          details: {
            create: data.details.map((d) => ({
              productId: d.productId,
              quantity: d.quantity,
              unitCost: d.unitCost,
              totalCost: d.quantity * d.unitCost,
            })),
          },
        },
        include: {
          supplier: true,
          details: {
            include: { product: true },
          },
        },
      });

      // 2. Crear lotes para cada detalle de compra (Sistema FIFO)
      await Promise.all(
        data.details.map(async (d) => {
          await tx.productBatch.create({
            data: {
              productId: d.productId,
              purchaseId: purchase.id,
              quantity: d.quantity,
              remainingQty: d.quantity,
              unitCost: d.unitCost,
              purchaseDate: purchaseDate,
            },
          });
          console.log(`📦 Lote creado: Producto ${d.productId}, Cantidad: ${d.quantity}, Costo: $${d.unitCost}`);
        }),
      );

      // 3. Sumar el stock a cada producto
      await Promise.all(
        data.details.map(async (d) => {
          await tx.product.update({
            where: { id: d.productId },
            data: {
              stock: { increment: d.quantity },
            },
          });
        }),
      );

      // Log resumen de la compra
      console.log(`✅ Compra #${purchase.id} procesada:`);
      console.log(`   Subtotal: $${subtotal.toLocaleString()}`);
      if (discount > 0) console.log(`   Descuento: -$${discount.toLocaleString()}`);
      console.log(`   Total: $${totalAmount.toLocaleString()}`);
      if (data.invoiceNumber) console.log(`   Factura: ${data.invoiceNumber}`);
      console.log(`   ${data.details.length} lotes creados`);

      return purchase;
    });
  }

  async findAll() {
    return this.prisma.purchase.findMany({
      include: {
        supplier: true,
        details: { include: { product: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        details: { include: { product: true } },
      },
    });
  }

  async update(id: number, data: any) {
    return this.prisma.purchase.update({
      where: { id },
      data,
      include: {
        supplier: true,
        details: { include: { product: true } },
      },
    });
  }

  async delete(id: number) {
    return this.prisma.purchase.delete({
      where: { id },
    });
  }
}

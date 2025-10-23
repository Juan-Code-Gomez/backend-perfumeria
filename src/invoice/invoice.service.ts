// src/invoice/invoice.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto, UpdateInvoiceDto, PayInvoiceDto } from './dto/create-invoice.dto';
import { ProductBatchService } from '../product-batch/product-batch.service';
import { parseLocalDate } from '../common/utils/timezone.util';

@Injectable()
export class InvoiceService {
  constructor(
    private prisma: PrismaService,
    private batchService: ProductBatchService,
  ) {}


  /**
   * Crea una factura y opcionalmente procesa el inventario
   * Si processInventory = true:
   * 1. Crea la factura con items
   * 2. Crea una compra automática
   * 3. Crea lotes FIFO para cada producto
   * 4. Actualiza el stock de productos
   */
  async create(data: CreateInvoiceDto) {
    const invoiceDate = parseLocalDate(data.invoiceDate);
    const dueDate = data.dueDate ? parseLocalDate(data.dueDate) : null;

    // Validar que el proveedor exista
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: data.supplierId },
    });

    if (!supplier) {
      throw new NotFoundException(`Proveedor con ID ${data.supplierId} no encontrado`);
    }

    // Validar que todos los productos existan
    const productIds = data.items.map(item => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Uno o más productos no existen');
    }

    // Calcular subtotal y total
    const subtotal = data.items.reduce((sum, item) => 
      sum + (item.quantity * item.unitCost), 0
    );
    const discount = data.discount || 0;
    const totalAmount = subtotal - discount;
    const paidAmount = data.paidAmount || 0;
    const status = this.calculateStatus(totalAmount, paidAmount);

    // Usar transacción para crear todo en bloque
    return this.prisma.$transaction(async (tx) => {
      // 1. Crear la factura principal
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: data.invoiceNumber,
          supplierName: supplier.name,
          supplierId: data.supplierId,
          amount: totalAmount,
          paidAmount,
          status,
          description: data.description,
          notes: data.notes,
          invoiceDate,
          dueDate,
          inventoryProcessed: data.processInventory ?? true,
        },
      });

      console.log(`📄 Factura #${invoice.id} creada: ${invoice.invoiceNumber}`);

      // 2. Crear los items de la factura
      const invoiceItems = await Promise.all(
        data.items.map(async (item) => {
          return tx.invoiceItem.create({
            data: {
              invoiceId: invoice.id,
              productId: item.productId,
              description: item.description || products.find(p => p.id === item.productId)?.name || '',
              quantity: item.quantity,
              unitPrice: item.unitCost,
              totalPrice: item.quantity * item.unitCost,
              affectInventory: true,
            },
          });
        })
      );

      console.log(`📦 ${invoiceItems.length} items agregados a la factura`);

      // 3. Si debe procesar inventario, crear compra y lotes
      if (data.processInventory !== false) {
        // Crear compra automática
        const purchase = await tx.purchase.create({
          data: {
            supplierId: data.supplierId,
            date: invoiceDate,
            subtotal,
            discount,
            totalAmount,
            paidAmount,
            isPaid: paidAmount >= totalAmount,
            invoiceNumber: data.invoiceNumber,
            invoiceDate,
            dueDate,
            notes: data.notes,
            details: {
              create: data.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitCost: item.unitCost,
                totalCost: item.quantity * item.unitCost,
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

        console.log(`🛒 Compra #${purchase.id} creada automáticamente`);

        // Crear lotes FIFO para cada item
        await Promise.all(
          data.items.map(async (item) => {
            await tx.productBatch.create({
              data: {
                productId: item.productId,
                purchaseId: purchase.id,
                quantity: item.quantity,
                remainingQty: item.quantity,
                unitCost: item.unitCost,
                purchaseDate: invoiceDate,
                expiryDate: item.expiryDate ? parseLocalDate(item.expiryDate) : null,
                batchNumber: item.batchNumber,
              },
            });
            console.log(`📦 Lote creado: Producto ${item.productId}, Cantidad: ${item.quantity}, Costo: $${item.unitCost}`);
          })
        );

        // Actualizar stock de productos
        await Promise.all(
          data.items.map(async (item) => {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.quantity },
              },
            });
          })
        );

        console.log(`✅ Stock actualizado para ${data.items.length} productos`);
      }

      // Log final
      console.log(`✅ Factura ${invoice.invoiceNumber} procesada exitosamente:`);
      console.log(`   Subtotal: $${subtotal.toLocaleString()}`);
      if (discount > 0) console.log(`   Descuento: -$${discount.toLocaleString()}`);
      console.log(`   Total: $${totalAmount.toLocaleString()}`);
      console.log(`   Estado: ${status}`);
      if (data.processInventory !== false) {
        console.log(`   ${data.items.length} lotes FIFO creados`);
      }

      // Retornar factura con relaciones
      return tx.invoice.findUnique({
        where: { id: invoice.id },
        include: {
          Supplier: true,
          InvoiceItem: {
            include: {
              Product: true,
            },
          },
        },
      });
    });
  }


  async findAll(filters?: { status?: string; overdue?: boolean; supplierId?: number }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.supplierId) {
      where.supplierId = filters.supplierId;
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
      include: {
        Supplier: true,
        InvoiceItem: {
          include: {
            Product: true,
          },
        },
      },
      orderBy: { invoiceDate: 'desc' },
    });
  }

  async findOne(id: number) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        Supplier: true,
        InvoiceItem: {
          include: {
            Product: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Factura con ID ${id} no encontrada`);
    }

    return invoice;
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

  // 🔍 MÉTODOS DE DEBUG TEMPORALES
  async testDatabaseConnection() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'success', message: 'Database connection OK' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  async getSimpleCount() {
    try {
      const count = await this.prisma.invoice.count();
      return { status: 'success', count };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  async getFirstInvoiceBasic() {
    try {
      const invoice = await this.prisma.invoice.findFirst({
        orderBy: { id: 'asc' }
      });
      return { status: 'success', invoice };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  async getFirstInvoiceWithRelations() {
    try {
      const invoice = await this.prisma.invoice.findFirst({
        include: {
          Supplier: true,
          InvoiceItem: true
        },
        orderBy: { id: 'asc' }
      });
      return { status: 'success', invoice };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}

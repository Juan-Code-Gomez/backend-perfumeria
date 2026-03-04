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
      // Obtener configuración de la empresa para saber si se usa FIFO
      const companyConfig = await tx.companyConfig.findFirst();
      const useFifo = companyConfig?.useFifoInventory ?? true;

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

      if (useFifo) {
        // MODO FIFO: Crear lotes para cada detalle de compra
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
            console.log(`📦 Lote FIFO creado: Producto ${d.productId}, Cantidad: ${d.quantity}, Costo: $${d.unitCost}`);
          }),
        );
      } else {
        // MODO NO-FIFO: Actualizar precio de compra del producto
        await Promise.all(
          data.details.map(async (d) => {
            const currentProduct = await tx.product.findUnique({
              where: { id: d.productId },
              select: { purchasePrice: true, name: true },
            });

            // Actualizar el precio de compra del producto
            await tx.product.update({
              where: { id: d.productId },
              data: {
                purchasePrice: d.unitCost,
              },
            });

            // Registrar en historial de precios
            await tx.productPrice.create({
              data: {
                productId: d.productId,
                purchasePrice: d.unitCost,
                supplierId: data.supplierId,
                effectiveDate: purchaseDate,
                isActive: true,
                notes: `Actualizado por factura ${data.invoiceNumber || `#${purchase.id}`}`,
              },
            });

            if (currentProduct) {
              const priceChange = d.unitCost - currentProduct.purchasePrice;
              const changePercent = currentProduct.purchasePrice > 0 
                ? ((priceChange / currentProduct.purchasePrice) * 100).toFixed(1)
                : '100';
              
              console.log(
                `💰 Precio actualizado: ${currentProduct.name} | ` +
                `Antes: $${currentProduct.purchasePrice.toLocaleString()} | ` +
                `Ahora: $${d.unitCost.toLocaleString()} | ` +
                `Cambio: ${priceChange >= 0 ? '+' : ''}$${priceChange.toLocaleString()} (${changePercent}%)`
              );
            }
          }),
        );
      }

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
      console.log(`✅ Compra #${purchase.id} procesada (Modo: ${useFifo ? 'FIFO' : 'Precio Último'}):`);
      console.log(`   Subtotal: $${subtotal.toLocaleString()}`);
      if (discount > 0) console.log(`   Descuento: -$${discount.toLocaleString()}`);
      console.log(`   Total: $${totalAmount.toLocaleString()}`);
      if (data.invoiceNumber) console.log(`   Factura: ${data.invoiceNumber}`);
      console.log(`   ${data.details.length} productos procesados`);

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

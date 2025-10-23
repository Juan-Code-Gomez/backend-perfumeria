// src/product-batch/product-batch.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductBatchService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crea un nuevo lote de producto (se llama automáticamente al hacer compras)
   */
  async createBatch(data: {
    productId: number;
    purchaseId?: number;
    quantity: number;
    unitCost: number;
    purchaseDate: Date;
    expiryDate?: Date;
    batchNumber?: string;
    notes?: string;
  }) {
    return this.prisma.productBatch.create({
      data: {
        productId: data.productId,
        purchaseId: data.purchaseId,
        quantity: data.quantity,
        remainingQty: data.quantity, // Inicialmente todo está disponible
        unitCost: data.unitCost,
        purchaseDate: data.purchaseDate,
        expiryDate: data.expiryDate,
        batchNumber: data.batchNumber,
        notes: data.notes,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
    });
  }

  /**
   * Descuenta cantidad de los lotes usando FIFO (First In, First Out)
   * Retorna el costo real de la cantidad vendida
   */
  async consumeBatchesFIFO(productId: number, quantity: number): Promise<{
    totalCost: number;
    averageCost: number;
    batchesUsed: Array<{ batchId: number; quantityUsed: number; unitCost: number }>;
  }> {
    let remainingQty = quantity;
    let totalCost = 0;
    const batchesUsed: Array<{ batchId: number; quantityUsed: number; unitCost: number }> = [];

    // Buscar lotes con stock disponible, ordenados por fecha (FIFO)
    const availableBatches = await this.prisma.productBatch.findMany({
      where: {
        productId,
        remainingQty: { gt: 0 },
      },
      orderBy: {
        purchaseDate: 'asc', // FIFO: más antiguo primero
      },
    });

    if (availableBatches.length === 0) {
      throw new BadRequestException(
        `No hay lotes disponibles para el producto ID ${productId}`
      );
    }

    // Calcular stock total disponible
    const totalAvailable = availableBatches.reduce(
      (sum, batch) => sum + batch.remainingQty,
      0
    );

    if (totalAvailable < quantity) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${totalAvailable}, Requerido: ${quantity}`
      );
    }

    // Consumir de los lotes más antiguos primero
    for (const batch of availableBatches) {
      if (remainingQty <= 0) break;

      const qtyToConsume = Math.min(remainingQty, batch.remainingQty);
      const cost = qtyToConsume * batch.unitCost;

      // Actualizar el lote
      await this.prisma.productBatch.update({
        where: { id: batch.id },
        data: {
          remainingQty: batch.remainingQty - qtyToConsume,
        },
      });

      totalCost += cost;
      remainingQty -= qtyToConsume;

      batchesUsed.push({
        batchId: batch.id,
        quantityUsed: qtyToConsume,
        unitCost: batch.unitCost,
      });

      console.log(`📦 Lote #${batch.id}: Consumidas ${qtyToConsume} unidades a $${batch.unitCost} = $${cost}`);
    }

    const averageCost = totalCost / quantity;

    console.log(`✅ FIFO Completado - Total: $${totalCost}, Promedio: $${averageCost}`);

    return {
      totalCost,
      averageCost,
      batchesUsed,
    };
  }

  /**
   * Obtiene todos los lotes de un producto
   */
  async getBatchesByProduct(productId: number) {
    const batches = await this.prisma.productBatch.findMany({
      where: { productId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            salePrice: true,
          },
        },
        purchase: {
          select: {
            id: true,
            date: true,
            supplier: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        purchaseDate: 'asc',
      },
    });

    // Calcular estadísticas
    const totalQuantity = batches.reduce((sum, b) => sum + b.quantity, 0);
    const totalRemaining = batches.reduce((sum, b) => sum + b.remainingQty, 0);
    const totalValue = batches.reduce((sum, b) => sum + (b.remainingQty * b.unitCost), 0);
    const averageCost = totalRemaining > 0 ? totalValue / totalRemaining : 0;

    return {
      batches,
      summary: {
        totalBatches: batches.length,
        totalQuantity,
        totalRemaining,
        totalValue,
        averageCost,
      },
    };
  }

  /**
   * Obtiene la valorización total del inventario
   */
  async getInventoryValuation() {
    const batches = await this.prisma.productBatch.findMany({
      where: {
        remainingQty: { gt: 0 },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            categoryId: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Agrupar por producto
    const productValuation = batches.reduce((acc, batch) => {
      const productId = batch.productId;
      if (!acc[productId]) {
        acc[productId] = {
          product: batch.product,
          totalQty: 0,
          totalValue: 0,
          batches: [],
        };
      }
      const value = batch.remainingQty * batch.unitCost;
      acc[productId].totalQty += batch.remainingQty;
      acc[productId].totalValue += value;
      acc[productId].batches.push({
        batchId: batch.id,
        quantity: batch.remainingQty,
        unitCost: batch.unitCost,
        value,
        purchaseDate: batch.purchaseDate,
      });
      return acc;
    }, {});

    const products = Object.values(productValuation);
    const totalValue = products.reduce((sum: number, p: any) => sum + p.totalValue, 0);

    return {
      products,
      summary: {
        totalProducts: products.length,
        totalValue,
      },
    };
  }

  /**
   * Obtiene lotes próximos a vencer
   */
  async getExpiringBatches(daysThreshold: number = 30) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const batches = await this.prisma.productBatch.findMany({
      where: {
        remainingQty: { gt: 0 },
        expiryDate: {
          lte: thresholdDate,
          gte: new Date(), // Solo futuros, no vencidos
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            salePrice: true,
          },
        },
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });

    return batches.map(batch => ({
      ...batch,
      daysUntilExpiry: Math.ceil(
        (batch.expiryDate!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      ),
      potentialLoss: batch.remainingQty * batch.unitCost,
    }));
  }

  /**
   * Obtiene lotes vencidos
   */
  async getExpiredBatches() {
    const batches = await this.prisma.productBatch.findMany({
      where: {
        remainingQty: { gt: 0 },
        expiryDate: {
          lt: new Date(),
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
      orderBy: {
        expiryDate: 'desc',
      },
    });

    return batches.map(batch => ({
      ...batch,
      daysExpired: Math.ceil(
        (new Date().getTime() - batch.expiryDate!.getTime()) / (1000 * 60 * 60 * 24)
      ),
      loss: batch.remainingQty * batch.unitCost,
    }));
  }
}

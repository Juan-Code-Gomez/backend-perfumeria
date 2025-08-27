// src/services/product-movement.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateMovementData {
  productId: number;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  reason: string;
  referenceType?: 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'COMBO';
  referenceId?: number;
}

@Injectable()
export class ProductMovementService {
  constructor(private prisma: PrismaService) {}

  async createMovement(data: CreateMovementData) {
    return this.prisma.productMovement.create({
      data: {
        productId: data.productId,
        type: data.type,
        quantity: data.quantity,
        reason: data.reason,
        notes: `${data.referenceType || 'MANUAL'}: ${data.referenceId || 'N/A'}`,
      },
    });
  }

  async getMovementsByProduct(productId: number, limit = 50) {
    return this.prisma.productMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        product: {
          select: { name: true }
        }
      }
    });
  }

  async getMovementsByDateRange(from: Date, to: Date) {
    return this.prisma.productMovement.findMany({
      where: {
        createdAt: {
          gte: from,
          lte: to,
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { name: true }
        }
      }
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { parseLocalDate } from '../common/utils/timezone.util';

@Injectable()
export class PurchaseService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreatePurchaseDto) {
    const isPaid = data.isPaid ?? data.paidAmount >= data.totalAmount;

    // Usamos una transacción para que todo ocurra en bloque
    return this.prisma.$transaction(async (tx) => {
      // 1. Crear la compra con sus detalles
      const purchase = await tx.purchase.create({
        data: {
          supplierId: data.supplierId,
          date: data.date ? parseLocalDate(data.date) : new Date(),
          totalAmount: data.totalAmount,
          paidAmount: data.paidAmount,
          isPaid,
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

      // 2. Sumar el stock a cada producto
      await Promise.all(
        data.details.map(async (d) => {
          const updated = await tx.product.update({
            where: { id: d.productId },
            data: {
              stock: { increment: d.quantity },
            },
          });
        }),
      );

      // 3. Retornar la compra creada con detalles y proveedor
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
    // Solo permite actualizar algunos campos (ejemplo: pagos)
    return this.prisma.purchase.update({
      where: { id },
      data: {
        paidAmount: data.paidAmount,
        isPaid: data.isPaid,
        // Puedes permitir editar otros campos según tus reglas de negocio
      },
    });
  }

  async remove(id: number) {
    return this.prisma.purchase.delete({ where: { id } });
  }
}

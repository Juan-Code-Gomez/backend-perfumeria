import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    const totalPrice = data.stock * data.pricePerUnit;

    return this.prisma.product
      .create({
        data: {
          name: data.name,
          description: data.description,
          cost: data.cost,
          price: data.price,
          pricePerUnit: data.pricePerUnit,
          stock: data.stock,
          unit: data.unit,
          category: {
            connect: { id: data.categoryId },
          },
        },
      })
      .then((product) => ({
        ...product,
        totalPrice,
      }));
  }

  async findAll(filters: {
    name?: string;
    categoryId?: number;
    stockMin?: number;
  }) {
    const { name, categoryId, stockMin } = filters;
    return this.prisma.product.findMany({
      where: {
        name: name ? { contains: name, mode: 'insensitive' } : undefined,
        categoryId: categoryId ?? undefined,
        stock: stockMin != null ? { gte: stockMin } : undefined,
      },
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  update(id: number, data: any) {
    const totalPrice = data.stock * data.pricePerUnit;

    return this.prisma.product
      .update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          cost: data.cost,
          price: data.price,
          pricePerUnit: data.pricePerUnit,
          stock: data.stock,
          unit: data.unit,
          category: {
            connect: { id: data.categoryId },
          },
        },
      })
      .then((product) => ({
        ...product,
        totalPrice,
      }));
  }

  remove(id: number) {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}

// src/products/products.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductMovementDto } from './dto/create-product-movement.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findLowStock() {
    const products = await this.prisma.product.findMany({
      where: {
        minStock: { not: null },
      },
      include: { category: true, unit: true },
      orderBy: { stock: 'asc' },
    });
    // Ahora filtras en memoria:
    return products.filter((p) => p.stock <= (p.minStock ?? 0));
  }

  async findMovements(productId: number) {
    return this.prisma.productMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMovement(productId: number, data: CreateProductMovementDto) {
    // Validar existencia del producto
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new Error('Producto no encontrado');

    // Calcular nuevo stock según el tipo de movimiento
    let newStock = product.stock;
    if (data.type === 'IN') newStock += data.quantity;
    else if (data.type === 'OUT') newStock -= data.quantity;
    else if (data.type === 'ADJUST') newStock += data.quantity; // Puede ser positivo o negativo

    // Actualizar stock y registrar movimiento en una transacción
    return this.prisma.$transaction([
      this.prisma.product.update({
        where: { id: productId },
        data: { stock: newStock },
      }),
      this.prisma.productMovement.create({
        data: {
          productId,
          type: data.type,
          quantity: data.quantity,
          price: data.price,
          note: data.note,
        },
      }),
    ]);
  }

  // Crear producto
  create(data: any) {
    return this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        purchasePrice: data.purchasePrice,
        salePrice: data.salePrice,
        stock: data.stock,
        minStock: data.minStock,
        imageUrl: data.imageUrl,
        unit: {
          connect: { id: data.unitId },
        },
        category: {
          connect: { id: data.categoryId },
        },
      },
      include: {
        category: true,
        unit: true,
      },
    });
  }

  // Listar productos con filtros opcionales
  async findAll(filters: {
    name?: string;
    categoryId?: number;
    stockMin?: number;
  }) {
    const { name, categoryId, stockMin } = filters;
    const products = await this.prisma.product.findMany({
      where: {
        name: name ? { contains: name, mode: 'insensitive' } : undefined,
        categoryId: categoryId ?? undefined,
        stock: stockMin != null ? { gte: stockMin } : undefined,
      },
      include: { category: true, unit: true },
      orderBy: { name: 'asc' },
    });

    // Calcula utilidad y margen para cada producto
    return products.map((p) => {
      const utilidad = p.salePrice - p.purchasePrice;
      const margen = p.purchasePrice
        ? (utilidad / p.purchasePrice) * 100
        : null;
      return {
        ...p,
        utilidad,
        margen,
      };
    });
  }

  // Obtener un producto por ID
  async findOne(id: number) {
    const p = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, unit: true },
    });
    if (!p) return null;

    const utilidad = p.salePrice - p.purchasePrice;
    const margen = p.purchasePrice ? (utilidad / p.purchasePrice) * 100 : null;
    return {
      ...p,
      utilidad,
      margen,
    };
  }

  // Actualizar producto
  update(id: number, data: any) {
    return this.prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        purchasePrice: data.purchasePrice,
        salePrice: data.salePrice,
        stock: data.stock,
        minStock: data.minStock,
        imageUrl: data.imageUrl,
        unit: {
          connect: { id: data.unitId },
        },
        category: {
          connect: { id: data.categoryId },
        },
      },
      include: {
        category: true,
        unit: true,
      },
    });
  }

  // Eliminar producto
  remove(id: number) {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}

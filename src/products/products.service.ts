// src/products/products.service.ts

import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductMovementDto } from './dto/create-product-movement.dto';
import { CreateProductDto, UpdateProductDto } from './dto/enhanced-product.dto';
import * as XLSX from 'xlsx';

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
          reason: data.reason,
          notes: data.notes,
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
  // ...añade estos parámetros al destructuring:
  async findAll(filters: {
    name?: string;
    categoryId?: number | string;
    unitId?: number | string;
    onlyLowStock?: boolean | string;
    salePriceMin?: number | string;
    salePriceMax?: number | string;
    page?: number | string;
    pageSize?: number | string;
  }) {
    let {
      name,
      categoryId,
      unitId,
      onlyLowStock,
      salePriceMin,
      salePriceMax,
      page = 1,
      pageSize = 10,
    } = filters;

    page = Number(page) || 1;
    pageSize = Number(pageSize) || 10;

    // Convierte a número si es string
    if (categoryId !== undefined) categoryId = Number(categoryId);
    if (unitId !== undefined) unitId = Number(unitId);
    if (salePriceMin !== undefined) salePriceMin = Number(salePriceMin);
    if (salePriceMax !== undefined) salePriceMax = Number(salePriceMax);

    // Filtros base
    const where: any = {
      name: name ? { contains: name, mode: 'insensitive' } : undefined,
      categoryId: categoryId ?? undefined,
      unitId: unitId ?? undefined,
      salePrice: {
        gte: salePriceMin ?? undefined,
        lte: salePriceMax ?? undefined,
      },
    };

    // Consulta el total antes de paginar
    const total = await this.prisma.product.count({ where });

    // Trae los productos paginados
    let products = await this.prisma.product.findMany({
      where,
      include: { category: true, unit: true },
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Stock bajo (filtrado en memoria)
    if (onlyLowStock) {
      products = products.filter((p) => p.stock <= (p.minStock ?? 0));
    }

    // Calcula utilidad/margen en cada producto
    const items = products.map((p) => ({
      ...p,
      utilidad: p.salePrice - p.purchasePrice,
      margen: p.purchasePrice
        ? ((p.salePrice - p.purchasePrice) / p.purchasePrice) * 100
        : null,
    }));

    return {
      items,
      total,
      page,
      pageSize,
    };
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

  async bulkUploadProducts(file: Express.Multer.File) {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    const errores: any[] = [];
    let productosCreados = 0,
      productosActualizados = 0,
      comprasCreadas = 0;

    // Agrupar productos por proveedor como ya lo tienes
    const comprasPorProveedor: Record<string, any[]> = {};
    rows.forEach((row, i) => {
      if (!row['Proveedor']) {
        errores.push({ fila: i + 2, error: 'Falta proveedor' });
        return;
      }
      if (!comprasPorProveedor[row['Proveedor']])
        comprasPorProveedor[row['Proveedor']] = [];
      comprasPorProveedor[row['Proveedor']].push({ ...row, _fila: i + 2 });
    });

    for (const proveedorNombre in comprasPorProveedor) {
      const proveedorDB = await this.prisma.supplier.findFirst({
        where: { name: proveedorNombre },
      });
      if (!proveedorDB) {
        errores.push({
          proveedor: proveedorNombre,
          error: `Proveedor no existe`,
        });
        continue;
      }

      const detalles: any[] = [];

      for (const row of comprasPorProveedor[proveedorNombre]) {
        // Validar campos obligatorios
        if (!row['Nombre producto'] || !row['Categoría'] || !row['Unidad']) {
          errores.push({
            fila: row._fila,
            error:
              'Faltan campos obligatorios (Nombre producto, Categoría o Unidad)',
          });
          continue;
        }

        // Buscar categoría
        const categoria = await this.prisma.category.findFirst({
          where: { name: row['Categoría'] },
        });
        if (!categoria) {
          errores.push({
            fila: row._fila,
            error: `Categoría no existe: ${row['Categoría']}`,
          });
          continue;
        }

        // Buscar unidad
        const unidad = await this.prisma.unit.findFirst({
          where: { name: row['Unidad'] },
        });
        if (!unidad) {
          errores.push({
            fila: row._fila,
            error: `Unidad no existe: ${row['Unidad']}`,
          });
          continue;
        }

        // *** VALIDACIONES PARA ESENCIAS ***
        if (categoria.name.toLowerCase().includes('esencia')) {
          // Solo permitir unidad gramos (puedes personalizarlo si usas "gramo" o "g" también)
          if (!unidad.name.toLowerCase().includes('gram')) {
            errores.push({
              fila: row._fila,
              error: `Para productos de categoría "Esencias" solo se permite la unidad "gramos".`,
            });
            continue;
          }
        }

        // Validar precios y stock
        const stockToAdd = Number(row['Stock inicial']);
        const precioCompra = Number(row['Precio compra']);
        const precioVenta = Number(row['Precio venta']);

        if (
          isNaN(stockToAdd) ||
          stockToAdd < 0 ||
          isNaN(precioCompra) ||
          precioCompra <= 0 ||
          isNaN(precioVenta) ||
          precioVenta <= 0
        ) {
          errores.push({
            fila: row._fila,
            error:
              'Stock inicial, precio de compra y precio de venta deben ser números positivos',
          });
          continue;
        }

        // Buscar producto por nombre + categoría + unidad
        const producto = await this.prisma.product.findFirst({
          where: {
            name: row['Nombre producto'],
            categoryId: categoria.id,
            unitId: unidad.id,
          },
        });

        let productoId: number;

        if (producto) {
          // Si existe, solo actualiza el stock
          await this.prisma.product.update({
            where: { id: producto.id },
            data: { stock: { increment: stockToAdd } },
          });
          productoId = producto.id;
          productosActualizados++;
        } else {
          // Crear producto
          const nuevo = await this.prisma.product.create({
            data: {
              name: row['Nombre producto'],
              description: row['Descripción'] || '',
              purchasePrice: precioCompra,
              salePrice: precioVenta,
              stock: stockToAdd,
              minStock: Number(row['Stock mínimo']) || null,
              imageUrl: row['Imagen URL'] || null,
              unit: { connect: { id: unidad.id } },
              category: { connect: { id: categoria.id } },
            },
          });
          productoId = nuevo.id;
          productosCreados++;
        }

        // Prepara detalle de compra (si hay stock > 0)
        if (stockToAdd > 0) {
          detalles.push({
            productId: productoId,
            quantity: stockToAdd,
            unitCost: precioCompra,
            totalCost: stockToAdd * precioCompra,
          });
        }
      }

      // Crea compra asociada si hay productos con stock > 0
      if (detalles.length > 0) {
        await this.prisma.purchase.create({
          data: {
            supplierId: proveedorDB.id,
            date: new Date(),
            totalAmount: detalles.reduce((sum, d) => sum + d.totalCost, 0),
            paidAmount: 0,
            isPaid: false,
            details: { create: detalles },
          },
        });
        comprasCreadas++;
      }
    }

    return {
      mensaje: 'Carga finalizada',
      productosCreados,
      productosActualizados,
      comprasCreadas,
      errores,
    };
  }
}

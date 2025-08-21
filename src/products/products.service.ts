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
    try {
      const products = await this.prisma.product.findMany({
        where: {
          minStock: { not: null },
        },
        include: { category: true, unit: true },
        orderBy: { stock: 'asc' },
      });
      
      // Filtrar productos con stock bajo
      const lowStockProducts = products.filter((p) => p.stock <= (p.minStock ?? 0));
      
      return {
        success: true,
        data: lowStockProducts
      };
    } catch (error) {
      return {
        success: false,
        error: 'Error al obtener productos con stock bajo'
      };
    }
  }

  async getStatistics() {
    try {
      // Estadísticas básicas
      const totalProducts = await this.prisma.product.count();
      const activeProducts = await this.prisma.product.count({
        // where: { isActive: true } // Si tienes campo de productos activos
      });

      // Productos con stock bajo
      const allProducts = await this.prisma.product.findMany({
        where: { minStock: { not: null } },
        select: { id: true, name: true, stock: true, minStock: true }
      });
      const lowStockCount = allProducts.filter(p => p.stock <= (p.minStock ?? 0)).length;

      // Valor total del inventario
      const productsWithStock = await this.prisma.product.findMany({
        select: { stock: true, purchasePrice: true, salePrice: true }
      });
      
      const inventoryValue = productsWithStock.reduce((total, product) => {
        return total + (product.stock * product.purchasePrice);
      }, 0);

      const potentialRevenue = productsWithStock.reduce((total, product) => {
        return total + (product.stock * product.salePrice);
      }, 0);

      // Productos más vendidos (necesitarías tabla de ventas)
      // Por ahora retornamos productos recientes
      const recentProducts = await this.prisma.product.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { category: true, unit: true }
      });

      // Productos con mayor margen
      const topMarginProducts = await this.prisma.product.findMany({
        take: 5,
        include: { category: true, unit: true },
        orderBy: { salePrice: 'desc' }
      }).then(products => 
        products
          .map(p => ({
            ...p,
            margin: p.purchasePrice > 0 ? ((p.salePrice - p.purchasePrice) / p.purchasePrice) * 100 : 0
          }))
          .sort((a, b) => b.margin - a.margin)
      );

      return {
        success: true,
        data: {
          totalProducts,
          activeProducts,
          lowStockCount,
          inventoryValue: Math.round(inventoryValue * 100) / 100,
          potentialRevenue: Math.round(potentialRevenue * 100) / 100,
          potentialProfit: Math.round((potentialRevenue - inventoryValue) * 100) / 100,
          recentProducts,
          topMarginProducts
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Error al obtener estadísticas de productos'
      };
    }
  }

  async findMovements(productId: number) {
    try {
      const movements = await this.prisma.productMovement.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        data: movements
      };
    } catch (error) {
      return {
        success: false,
        error: 'Error al obtener movimientos del producto'
      };
    }
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
  async create(data: any) {
    try {
      const product = await this.prisma.product.create({
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

      return {
        success: true,
        data: product
      };
    } catch (error) {
      return {
        success: false,
        error: 'Error al crear el producto'
      };
    }
  }

  // Listar productos con filtros opcionales y paginación
  async findAll(filters: {
    name?: string;
    search?: string;
    categoryId?: number;
    unitId?: number;
    supplierId?: number;
    stockMin?: number;
    stockMax?: number;
    includeInactive?: boolean;
    lowStock?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const {
      name,
      search,
      categoryId,
      unitId,
      supplierId,
      stockMin,
      stockMax,
      includeInactive = false,
      lowStock,
      page = 1,
      pageSize = 10,
    } = filters;

    // Construir filtros para Prisma
    const where: any = {};

    // Filtro de texto (name o search general)
    if (name || search) {
      const searchText = name || search;
      where.OR = [
        { name: { contains: searchText, mode: 'insensitive' } },
        { description: { contains: searchText, mode: 'insensitive' } },
      ];
    }

    // Filtros por relaciones
    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (unitId) {
      where.unitId = unitId;
    }

    if (supplierId) {
      // Nota: Necesitarías agregar relación con supplier en el modelo Product
      where.supplierId = supplierId;
    }

    // Filtros de stock
    if (stockMin !== undefined || stockMax !== undefined) {
      where.stock = {};
      if (stockMin !== undefined) where.stock.gte = stockMin;
      if (stockMax !== undefined) where.stock.lte = stockMax;
    }

    // Filtro de productos activos/inactivos (si tienes un campo isActive)
    if (!includeInactive) {
      // Asumiendo que tienes un campo isActive, ajusta según tu modelo
      // where.isActive = true;
    }

    // Calcular offset para paginación
    const skip = (page - 1) * pageSize;

    // Obtener total de registros
    const total = await this.prisma.product.count({ where });

    // Obtener productos paginados
    let products = await this.prisma.product.findMany({
      where,
      include: { 
        category: true, 
        unit: true,
        // supplier: true, // Si tienes relación con supplier
      },
      orderBy: { name: 'asc' },
      skip,
      take: pageSize,
    });

    // Filtro de stock bajo (aplicado después de la consulta)
    if (lowStock === true) {
      products = products.filter((p) => p.stock <= (p.minStock ?? 0));
    }

    // Calcular métricas para cada producto
    const items = products.map((product) => ({
      ...product,
      utilidad: product.salePrice - product.purchasePrice,
      margen: product.purchasePrice > 0
        ? ((product.salePrice - product.purchasePrice) / product.purchasePrice) * 100
        : null,
    }));

    // Recalcular total si se aplicó filtro de stock bajo
    const finalTotal = lowStock === true ? items.length : total;

    return {
      success: true,
      data: {
        items,
        total: finalTotal,
        page,
        pageSize,
        totalPages: Math.ceil(finalTotal / pageSize),
      },
    };
  }

  // Obtener un producto por ID
  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, unit: true },
    });
    
    if (!product) {
      return {
        success: false,
        error: 'Producto no encontrado'
      };
    }

    const utilidad = product.salePrice - product.purchasePrice;
    const margen = product.purchasePrice > 0 ? (utilidad / product.purchasePrice) * 100 : null;
    
    return {
      success: true,
      data: {
        ...product,
        utilidad,
        margen,
      }
    };
  }

  // Actualizar producto
  async update(id: number, data: any) {
    try {
      const product = await this.prisma.product.update({
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

      return {
        success: true,
        data: product
      };
    } catch (error) {
      return {
        success: false,
        error: 'Error al actualizar el producto'
      };
    }
  }

  // Eliminar producto
  async remove(id: number) {
    try {
      await this.prisma.product.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Producto eliminado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Error al eliminar el producto'
      };
    }
  }

  // Exportar productos a Excel
  async exportProducts() {
    try {
      const products = await this.prisma.product.findMany({
        include: {
          category: true,
          unit: true,
        },
        orderBy: { name: 'asc' },
      });

      // Preparar datos para el Excel con columnas adicionales
      const exportData = products.map((product) => {
        const ventaMayorista = product.purchasePrice * 1.35; // 35% de margen para mayorista
        const utilidad = product.salePrice - product.purchasePrice;
        const margenDetalle = product.purchasePrice > 0 
          ? ((product.salePrice - product.purchasePrice) / product.purchasePrice) * 100 
          : 0;
        const margenMayorista = product.purchasePrice > 0 
          ? ((ventaMayorista - product.purchasePrice) / product.purchasePrice) * 100 
          : 0;

        return {
          'ID': product.id,
          'Nombre Producto': product.name,
          'Descripción': product.description || '',
          'Categoría': product.category.name,
          'Unidad': product.unit.name,
          'Precio Compra': product.purchasePrice,
          'Precio Venta Detalle': product.salePrice,
          'Precio Venta Mayorista': Math.round(ventaMayorista * 100) / 100,
          'Stock Actual': product.stock,
          'Stock Mínimo': product.minStock || 0,
          'Utilidad Detalle': Math.round(utilidad * 100) / 100,
          'Margen Detalle (%)': Math.round(margenDetalle * 100) / 100,
          'Margen Mayorista (%)': Math.round(margenMayorista * 100) / 100,
          'Valor Inventario': Math.round((product.stock * product.purchasePrice) * 100) / 100,
          'Fecha Creación': product.createdAt.toLocaleDateString('es-ES'),
        };
      });

      // Crear workbook de Excel
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Configurar anchos de columnas
      const colWidths = [
        { wpx: 50 },   // ID
        { wpx: 200 },  // Nombre Producto
        { wpx: 150 },  // Descripción
        { wpx: 120 },  // Categoría
        { wpx: 80 },   // Unidad
        { wpx: 100 },  // Precio Compra
        { wpx: 120 },  // Precio Venta Detalle
        { wpx: 140 },  // Precio Venta Mayorista
        { wpx: 80 },   // Stock Actual
        { wpx: 100 },  // Stock Mínimo
        { wpx: 100 },  // Utilidad Detalle
        { wpx: 110 },  // Margen Detalle
        { wpx: 120 },  // Margen Mayorista
        { wpx: 120 },  // Valor Inventario
        { wpx: 100 },  // Fecha Creación
      ];
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');

      // Generar buffer del archivo
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return {
        success: true,
        data: {
          buffer,
          filename: `productos_exportacion_${new Date().toISOString().split('T')[0]}.xlsx`,
          totalProducts: products.length,
        }
      };
    } catch (error) {
      console.error('Error al exportar productos:', error);
      return {
        success: false,
        error: 'Error al exportar productos'
      };
    }
  }

  async bulkUploadProducts(file: Express.Multer.File, withSupplier: boolean = false) {
    console.log('bulkUploadProducts - withSupplier:', withSupplier);
    
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    const errores: any[] = [];
    let productosCreados = 0,
      productosActualizados = 0,
      comprasCreadas = 0;

    if (withSupplier) {
      console.log('Usando lógica CON proveedor');
      // Lógica original con proveedor
      return this.bulkUploadWithSupplier(rows, errores, productosCreados, productosActualizados, comprasCreadas);
    } else {
      console.log('Usando lógica SIN proveedor');
      // Nueva lógica sin proveedor
      return this.bulkUploadWithoutSupplier(rows, errores, productosCreados, productosActualizados);
    }
  }

  private async bulkUploadWithSupplier(rows: any[], errores: any[], productosCreados: number, productosActualizados: number, comprasCreadas: number) {
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
        let precioVenta = Number(row['Precio venta']) || 0;

        // *** CÁLCULO AUTOMÁTICO DE PRECIO DE VENTA ***
        if (precioVenta <= 0 && precioCompra > 0) {
          // Si es categoría "Perfumes 1.1", aplicar 80% de rentabilidad
          if (categoria.name.toLowerCase().includes('perfumes 1.1')) {
            precioVenta = precioCompra * 1.80; // 80% de rentabilidad
            console.log(`📊 Precio calculado automáticamente para "${row['Nombre producto']}": Compra $${precioCompra} -> Venta $${precioVenta.toFixed(2)} (80% rentabilidad)`);
          } else {
            // Para otras categorías, aplicar un margen del 60%
            precioVenta = precioCompra * 1.60;
            console.log(`📊 Precio calculado automáticamente para "${row['Nombre producto']}": Compra $${precioCompra} -> Venta $${precioVenta.toFixed(2)} (60% rentabilidad)`);
          }
        }

        // Si aún no tenemos precio de venta, usar precio de compra como base mínima
        if (precioVenta <= 0) {
          precioVenta = precioCompra;
          console.log(`⚠️ Usando precio de compra como precio de venta para "${row['Nombre producto']}"`);
        }

        if (
          isNaN(stockToAdd) ||
          stockToAdd < 0 ||
          isNaN(precioCompra) ||
          precioCompra <= 0
        ) {
          errores.push({
            fila: row._fila,
            error:
              'Stock inicial y precio de compra deben ser números positivos.',
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

  private async bulkUploadWithoutSupplier(rows: any[], errores: any[], productosCreados: number, productosActualizados: number) {
    console.log('🚫 MODO SIN PROVEEDOR - Se ignorará cualquier columna "Proveedor" en el Excel');
    
    for (const row of rows) {
      const fila = rows.indexOf(row) + 2; // +2 porque Excel empieza en 1 y tiene header

      console.log(`Procesando fila ${fila}: ${row['Nombre producto']}`);
      
      // Validar campos obligatorios (sin proveedor)
      if (!row['Nombre producto'] || !row['Categoría'] || !row['Unidad']) {
        errores.push({
          fila,
          error: 'Faltan campos obligatorios (Nombre producto, Categoría o Unidad)',
        });
        continue;
      }

      // Buscar categoría
      const categoria = await this.prisma.category.findFirst({
        where: { name: row['Categoría'] },
      });
      if (!categoria) {
        errores.push({
          fila,
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
          fila,
          error: `Unidad no existe: ${row['Unidad']}`,
        });
        continue;
      }

      // *** VALIDACIONES PARA ESENCIAS ***
      if (categoria.name.toLowerCase().includes('esencia')) {
        // Solo permitir unidad gramos
        if (!unidad.name.toLowerCase().includes('gram')) {
          errores.push({
            fila,
            error: `Para productos de categoría "Esencias" solo se permite la unidad "gramos".`,
          });
          continue;
        }
      }

      // Validar precios y stock
      const stockToAdd = Number(row['Stock inicial']) || 0;
      const precioCompra = Number(row['Precio compra']) || 0;
      let precioVenta = Number(row['Precio venta']) || 0;

      // *** CÁLCULO AUTOMÁTICO DE PRECIO DE VENTA ***
      if (precioVenta <= 0 && precioCompra > 0) {
        // Si es categoría "Perfumes 1.1", aplicar 80% de rentabilidad
        if (categoria.name.toLowerCase().includes('perfumes 1.1')) {
          precioVenta = precioCompra * 1.80; // 80% de rentabilidad
          console.log(`📊 Precio calculado automáticamente para "${row['Nombre producto']}": Compra $${precioCompra} -> Venta $${precioVenta.toFixed(2)} (80% rentabilidad)`);
        } else {
          // Para otras categorías, aplicar un margen del 60%
          precioVenta = precioCompra * 1.60;
          console.log(`📊 Precio calculado automáticamente para "${row['Nombre producto']}": Compra $${precioCompra} -> Venta $${precioVenta.toFixed(2)} (60% rentabilidad)`);
        }
      }

      // Validar que tengamos al menos precio de compra
      if (precioCompra <= 0) {
        errores.push({
          fila,
          error: 'Se requiere precio de compra para crear el producto',
        });
        continue;
      }

      // Si aún no tenemos precio de venta, usar precio de compra como base mínima
      if (precioVenta <= 0) {
        precioVenta = precioCompra;
        console.log(`⚠️ Usando precio de compra como precio de venta para "${row['Nombre producto']}"`);
      }

      // Buscar producto por nombre + categoría + unidad
      const producto = await this.prisma.product.findFirst({
        where: {
          name: row['Nombre producto'],
          categoryId: categoria.id,
          unitId: unidad.id,
        },
      });

      if (producto) {
        // Si existe, actualiza el producto y el stock
        await this.prisma.product.update({
          where: { id: producto.id },
          data: { 
            stock: { increment: stockToAdd },
            purchasePrice: precioCompra > 0 ? precioCompra : producto.purchasePrice,
            salePrice: precioVenta,
            description: row['Descripción'] || producto.description,
            minStock: Number(row['Stock mínimo']) || producto.minStock,
            imageUrl: row['Imagen URL'] || producto.imageUrl,
          },
        });
        productosActualizados++;
      } else {
        // Crear producto sin proveedor
        await this.prisma.product.create({
          data: {
            name: row['Nombre producto'],
            description: row['Descripción'] || '',
            purchasePrice: precioCompra > 0 ? precioCompra : 0, // Usar 0 en lugar de null
            salePrice: precioVenta,
            stock: stockToAdd,
            minStock: Number(row['Stock mínimo']) || null,
            imageUrl: row['Imagen URL'] || null,
            unit: { connect: { id: unidad.id } },
            category: { connect: { id: categoria.id } },
            // supplierId queda como null automáticamente
          },
        });
        productosCreados++;
      }
    }

    return {
      mensaje: 'Carga finalizada (sin proveedores)',
      productosCreados,
      productosActualizados,
      comprasCreadas: 0, // No se crean compras sin proveedor
      errores,
    };
  }
}

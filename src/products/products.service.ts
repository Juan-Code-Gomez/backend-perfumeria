// src/products/products.service.ts

import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductMovementDto } from './dto/create-product-movement.dto';
import { CreateProductDto, UpdateProductDto } from './dto/enhanced-product.dto';
import { ExportInventoryResponse } from './interfaces/export-inventory-response.interface';
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
          salesType: data.salesType || 'VENTA',
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
          salesType: data.salesType,
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

  async exportInventory(options: any = {}): Promise<ExportInventoryResponse> {
    try {
      console.log('📋 Exportando inventario con opciones:', options);
      
      // Construir filtros
      const where: any = {};
      
      // Filtro por categorías
      if (options.categories && options.categories.length > 0) {
        where.categoryId = { in: options.categories };
      }
      
      // Filtro por nivel de stock
      if (options.stockLevel === 'low') {
        // Solo productos con stock bajo
        where.stock = { lte: 5 }; // O usar minStock si está definido
      } else if (options.stockLevel === 'out') {
        where.stock = { lte: 0 };
      } else if (options.stockLevel === 'positive') {
        where.stock = { gt: 0 };
      }
      
      // Filtro por rango de precios
      if (options.minPrice || options.maxPrice) {
        where.salePrice = {};
        if (options.minPrice) where.salePrice.gte = options.minPrice;
        if (options.maxPrice) where.salePrice.lte = options.maxPrice;
      }

      // Obtener productos
      const products = await this.prisma.product.findMany({
        where,
        include: {
          category: true,
          unit: true,
        },
        orderBy: this.getSortOrder(options.sortBy),
      });

      console.log(`📊 Productos encontrados: ${products.length}`);

      // Generar según formato
      switch (options.format) {
        case 'pdf':
          return this.generateInventoryPDF(products, options);
        case 'csv':
          return this.generateInventoryCSV(products, options);
        default:
          return this.generateInventoryExcel(products, options);
      }
    } catch (error) {
      console.error('Error al exportar inventario:', error);
      return {
        success: false,
        error: 'Error al generar exportación de inventario'
      };
    }
  }

  private getSortOrder(sortBy: string): Record<string, any> {
    switch (sortBy) {
      case 'stock':
        return { stock: 'desc' as const };
      case 'category':
        return { category: { name: 'asc' as const } };
      case 'value':
        return { salePrice: 'desc' as const };
      case 'code':
        return { id: 'asc' as const };
      default:
        return { name: 'asc' as const };
    }
  }



  private async generateInventoryExcel(products: any[], options: any) {
    const { 
      includeImages = false, 
      includeStockValue = true, 
      includePhysicalCountColumns = true,
      title = 'Inventario Físico',
      notes = '',
      groupBy = 'none'
    } = options;

    // Agrupar productos si es necesario
    const groupedProducts = this.groupProducts(products, groupBy);
    
    const workbook = XLSX.utils.book_new();
    
    // Crear datos para cada grupo
    for (const [groupName, groupProducts] of Object.entries(groupedProducts)) {
      const exportData = (groupProducts as any[]).map((product, index) => {
        const inventoryValue = product.stock * product.purchasePrice;
        const potentialValue = product.stock * product.salePrice;
        
        const row: any = {
          'N°': index + 1,
          'Código': `P${product.id.toString().padStart(4, '0')}`,
          'Nombre del Producto': product.name,
          'Categoría': product.category.name,
          'Unidad': product.unit.symbol || product.unit.name,
          'Stock Sistema': product.stock,
        };

        // Columnas para inventariado físico
        if (includePhysicalCountColumns) {
          row['Stock Físico'] = ''; // Para que escriban manualmente
          row['Diferencia'] = ''; // Para calcular después
          row['Observaciones'] = ''; // Para notas del conteo
        }

        // Información adicional
        if (includeStockValue) {
          row['Precio Unitario'] = product.salePrice;
          row['Valor en Sistema'] = Math.round(inventoryValue * 100) / 100;
          row['Valor Potencial'] = Math.round(potentialValue * 100) / 100;
        }

        row['Stock Mínimo'] = product.minStock || 0;
        row['Última Actualización'] = product.updatedAt.toLocaleDateString('es-ES');

        if (includeImages && product.imageUrl) {
          row['URL Imagen'] = product.imageUrl;
        }

        return row;
      });

      // Agregar información de encabezado
      const headerData = [
        { 'N°': title },
        { 'N°': `Fecha: ${new Date().toLocaleDateString('es-ES')}` },
        { 'N°': `Grupo: ${groupName}` },
        { 'N°': `Total productos: ${groupProducts.length}` },
        ...(notes ? [{ 'N°': `Notas: ${notes}` }] : []),
        { 'N°': '' }, // Fila vacía
      ];

      const fullData = [...headerData, ...exportData];
      
      const worksheet = XLSX.utils.json_to_sheet(fullData);

      // Configurar anchos de columnas
      const baseColWidths = [
        { wpx: 40 },   // N°
        { wpx: 80 },   // Código
        { wpx: 250 },  // Nombre del Producto
        { wpx: 120 },  // Categoría
        { wpx: 80 },   // Unidad
        { wpx: 100 },  // Stock Sistema
      ];

      if (includePhysicalCountColumns) {
        baseColWidths.push(
          { wpx: 100 },  // Stock Físico
          { wpx: 100 },  // Diferencia
          { wpx: 200 },  // Observaciones
        );
      }

      if (includeStockValue) {
        baseColWidths.push(
          { wpx: 100 },  // Precio Unitario
          { wpx: 120 },  // Valor en Sistema
          { wpx: 120 },  // Valor Potencial
        );
      }

      baseColWidths.push(
        { wpx: 100 },  // Stock Mínimo
        { wpx: 120 },  // Última Actualización
      );

      if (includeImages) {
        baseColWidths.push({ wpx: 200 }); // URL Imagen
      }

      worksheet['!cols'] = baseColWidths;

      // Agregar fórmulas para calcular diferencias automáticamente
      if (includePhysicalCountColumns && exportData.length > 0) {
        // Agregar fórmulas en las columnas de diferencia
        // (esto requiere más lógica específica de Excel)
      }

      const sheetName = groupName === 'Todos' ? 'Inventario' : groupName.substring(0, 31);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }

    // Generar buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + (p.stock * p.purchasePrice), 0);

    return {
      success: true,
      data: {
        buffer,
        filename: `inventario_fisico_${new Date().toISOString().split('T')[0]}.xlsx`,
        totalProducts,
        totalValue: Math.round(totalValue * 100) / 100,
        format: 'excel',
        groupBy,
      }
    };
  }

  private async generateInventoryPDF(products: any[], options: any) {
    try {
      console.log('🔄 Iniciando generación de PDF...');
      const puppeteer = require('puppeteer');
      const { 
        includePhysicalCountColumns = false, 
        includeStockValue = false, 
        includeImages = false,
        groupBy = 'none' 
      } = options;

      console.log('📊 Agrupando productos...');
      // Agrupar productos si es necesario
      const groupedData = this.groupProducts(products, groupBy);

      // Generar HTML para el PDF
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Inventario Físico</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              font-size: 10px; 
              margin: 20px;
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
            }
            .header h1 { 
              margin: 0; 
              font-size: 24px; 
              color: #2c3e50;
            }
            .header .subtitle { 
              margin: 5px 0 0 0; 
              font-size: 14px; 
              color: #7f8c8d;
            }
            .summary { 
              background: #f8f9fa; 
              padding: 15px; 
              margin-bottom: 20px; 
              border-radius: 5px;
              border-left: 4px solid #3498db;
            }
            .group-header { 
              background: #3498db; 
              color: white; 
              padding: 8px 12px; 
              margin: 20px 0 10px 0; 
              font-weight: bold; 
              font-size: 12px;
              border-radius: 3px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            }
            th { 
              background: #34495e; 
              color: white; 
              padding: 8px 4px; 
              text-align: left; 
              font-size: 9px;
              font-weight: bold;
            }
            td { 
              padding: 6px 4px; 
              border-bottom: 1px solid #bdc3c7;
              font-size: 9px;
            }
            tr:nth-child(even) { 
              background: #ecf0f1; 
            }
            .code { 
              font-family: monospace; 
              font-weight: bold;
              color: #2980b9;
            }
            .stock-low { 
              color: #e74c3c; 
              font-weight: bold; 
            }
            .stock-good { 
              color: #27ae60; 
            }
            .physical-count { 
              border: 1px solid #95a5a6; 
              min-height: 20px; 
              background: #fff;
            }
            .footer { 
              margin-top: 30px; 
              text-align: center; 
              font-size: 8px; 
              color: #7f8c8d;
              border-top: 1px solid #bdc3c7;
              padding-top: 10px;
            }
            .page-break { 
              page-break-before: always; 
            }
            @media print {
              body { margin: 10px; }
              .page-break { page-break-before: always; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📋 Inventario Físico</h1>
            <div class="subtitle">Generado el ${new Date().toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</div>
          </div>

          <div class="summary">
            <strong>Resumen:</strong> ${products.length} productos para inventariar
            ${groupBy !== 'none' ? ` | Agrupado por ${groupBy === 'category' ? 'categoría' : 'proveedor'}` : ''}
            ${includePhysicalCountColumns ? ' | Incluye columnas para conteo físico' : ''}
          </div>
      `;

      // Procesar cada grupo
      Object.entries(groupedData).forEach(([groupName, groupProducts]: [string, any]) => {
        if (groupName !== 'Todos' && groupBy !== 'none') {
          htmlContent += `<div class="group-header">${groupName}</div>`;
        }

        htmlContent += `
          <table>
            <thead>
              <tr>
                <th style="width: 30px;">N°</th>
                <th style="width: 60px;">Código</th>
                <th style="width: 200px;">Producto</th>
                <th style="width: 80px;">Categoría</th>
                <th style="width: 40px;">Unidad</th>
                <th style="width: 50px;">Stock Sistema</th>
        `;

        if (includePhysicalCountColumns) {
          htmlContent += `
                <th style="width: 50px;">Stock Físico</th>
                <th style="width: 50px;">Diferencia</th>
                <th style="width: 100px;">Observaciones</th>
          `;
        }

        if (includeStockValue) {
          htmlContent += `
                <th style="width: 60px;">Precio Unit.</th>
                <th style="width: 70px;">Valor Total</th>
          `;
        }

        htmlContent += `
              </tr>
            </thead>
            <tbody>
        `;

        groupProducts.forEach((product: any, index: number) => {
          const stockClass = product.stock <= (product.stockMin || 5) ? 'stock-low' : 'stock-good';
          const inventoryValue = product.stock * product.purchasePrice;

          htmlContent += `
            <tr>
              <td>${index + 1}</td>
              <td class="code">P${product.id.toString().padStart(4, '0')}</td>
              <td><strong>${product.name}</strong></td>
              <td>${product.category.name}</td>
              <td>${product.unit.symbol || product.unit.name}</td>
              <td class="${stockClass}">${product.stock}</td>
          `;

          if (includePhysicalCountColumns) {
            htmlContent += `
              <td class="physical-count"></td>
              <td class="physical-count"></td>
              <td class="physical-count"></td>
            `;
          }

          if (includeStockValue) {
            htmlContent += `
              <td>$${product.salePrice.toLocaleString()}</td>
              <td>$${Math.round(inventoryValue * 100) / 100}</td>
            `;
          }

          htmlContent += `</tr>`;
        });

        htmlContent += `
            </tbody>
          </table>
        `;
      });

      // Agregar pie de página
      htmlContent += `
          <div class="footer">
            <p><strong>Instrucciones:</strong></p>
            <p>1. Contar físicamente cada producto listado</p>
            <p>2. Anotar el stock físico en la columna correspondiente</p>
            <p>3. Calcular diferencias (Stock Físico - Stock Sistema)</p>
            <p>4. Anotar observaciones sobre productos dañados, vencidos, etc.</p>
            <br>
            <p>Documento generado automáticamente el ${new Date().toLocaleString('es-ES')}</p>
          </div>
        </body>
        </html>
      `;

      console.log('🌐 Iniciando Puppeteer...');
      // Generar PDF con Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      
      console.log('📄 Creando página y generando PDF...');
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' }); // Cambiar a domcontentloaded para ser más rápido
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
        printBackground: true,
        preferCSSPageSize: true,
      });

      console.log('🔒 Cerrando browser...');
      await browser.close();
      console.log('✅ PDF generado exitosamente');

      const totalProducts = products.length;
      const totalValue = products.reduce((sum, p) => sum + (p.stock * p.purchasePrice), 0);

      return {
        success: true,
        data: {
          buffer: pdfBuffer,
          filename: `inventario_fisico_${new Date().toISOString().split('T')[0]}.pdf`,
          totalProducts,
          totalValue: Math.round(totalValue * 100) / 100,
          format: 'pdf',
          groupBy,
        }
      };

    } catch (error) {
      console.error('Error generando PDF:', error);
      return {
        success: false,
        error: 'Error al generar PDF: ' + error.message
      };
    }
  }

  private async generateInventoryCSV(products: any[], options: any) {
    const csvData = products.map((product, index) => ({
      'N°': index + 1,
      'Código': `P${product.id.toString().padStart(4, '0')}`,
      'Nombre': product.name,
      'Categoría': product.category.name,
      'Stock Sistema': product.stock,
      'Stock Físico': '',
      'Diferencia': '',
      'Precio': product.salePrice,
      'Valor': product.stock * product.purchasePrice,
    }));

    // Convertir a CSV
    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');

    const buffer = Buffer.from(csvContent, 'utf-8');

    return {
      success: true,
      data: {
        buffer,
        filename: `inventario_fisico_${new Date().toISOString().split('T')[0]}.csv`,
        totalProducts: products.length,
        format: 'csv',
      }
    };
  }

  private groupProducts(products: any[], groupBy: string) {
    if (groupBy === 'none' || !groupBy) {
      return { 'Todos': products };
    }

    const grouped: { [key: string]: any[] } = {};

    products.forEach(product => {
      let key = 'Sin Grupo';
      
      switch (groupBy) {
        case 'category':
          key = product.category?.name || 'Sin Categoría';
          break;
        case 'supplier':
          key = product.supplier?.name || 'Sin Proveedor';
          break;
        case 'location':
          key = product.location || 'Sin Ubicación';
          break;
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(product);
    });

    return grouped;
  }

  async bulkUploadProducts(file: Express.Multer.File, withSupplier: boolean = false) {
    try {
      console.log('🚀 Iniciando carga masiva de productos...');
      console.log('- Modo con proveedor:', withSupplier);
      console.log('- Archivo:', file.originalname);
      console.log('- Tamaño:', file.size, 'bytes');
      
      if (!file || !file.buffer) {
        throw new Error('Archivo no válido o vacío');
      }

      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      console.log('- Hojas disponibles:', workbook.SheetNames);
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('El archivo Excel no contiene hojas de cálculo');
      }

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);
      
      console.log('- Filas encontradas:', rows.length);
      
      if (rows.length === 0) {
        throw new Error('El archivo Excel está vacío o no tiene datos');
      }

      // Mostrar las primeras columnas para debug
      const firstRow = rows[0];
      console.log('- Columnas detectadas:', Object.keys(firstRow));
      console.log('- Primera fila ejemplo:', JSON.stringify(firstRow, null, 2));
      
      // Validar si realmente tiene datos en proveedor
      const tieneProveedorConDatos = rows.some(row => row['Proveedor'] && row['Proveedor'].toString().trim() !== '');
      const tieneColumnaProveedor = 'Proveedor' in firstRow;
      console.log('- Tiene columna Proveedor:', tieneColumnaProveedor);
      console.log('- Tiene proveedores con datos:', tieneProveedorConDatos);
      console.log('- Modo withSupplier:', withSupplier);
      
      if (withSupplier && !tieneProveedorConDatos) {
        console.log('⚠️ ADVERTENCIA: Se seleccionó modo con proveedor pero ninguna fila tiene proveedor');
        if (tieneColumnaProveedor) {
          throw new Error('Se seleccionó modo "con proveedor" pero todas las filas tienen la columna "Proveedor" vacía. Use el modo "sin proveedor" o complete los proveedores.');
        }
      }
      
      // Si NO se seleccionó withSupplier pero SÍ hay columna proveedor, advertir
      if (!withSupplier && tieneColumnaProveedor) {
        console.log('ℹ️ INFORMACIÓN: El Excel tiene columna "Proveedor" pero se usará modo "sin proveedor" - la columna será ignorada');
      }

      const errores: any[] = [];
      let productosCreados = 0,
        productosActualizados = 0,
        comprasCreadas = 0;

      // Validar que tenemos las columnas mínimas requeridas
      const columnasRequeridas = ['Nombre producto', 'Categoría', 'Unidad', 'Precio compra'];
      const columnasFaltantes = columnasRequeridas.filter(col => !(col in firstRow));
      
      if (columnasFaltantes.length > 0) {
        throw new Error(`Faltan columnas obligatorias en el Excel: ${columnasFaltantes.join(', ')}`);
      }

      if (withSupplier) {
        // Validar columna proveedor si es requerida
        if (!('Proveedor' in firstRow)) {
          throw new Error('Se seleccionó modo "con proveedor" pero falta la columna "Proveedor" en el Excel');
        }
        console.log('✅ Usando lógica CON proveedor');
        return this.bulkUploadWithSupplier(rows, errores, productosCreados, productosActualizados, comprasCreadas);
      } else {
        console.log('✅ Usando lógica SIN proveedor');
        return this.bulkUploadWithoutSupplier(rows, errores, productosCreados, productosActualizados);
      }
    } catch (error) {
      console.error('❌ Error en bulkUploadProducts:', error);
      throw new Error(`Error procesando el archivo: ${error.message}`);
    }
  }

  private async bulkUploadWithSupplier(rows: any[], errores: any[], productosCreados: number, productosActualizados: number, comprasCreadas: number) {
    console.log('📦 Iniciando carga masiva CON proveedor...');
    
    // Agrupar productos por proveedor como ya lo tienes
    const comprasPorProveedor: Record<string, any[]> = {};
    rows.forEach((row, i) => {
      const fila = i + 2; // +2 porque Excel empieza en 1 y tiene header
      
      // Validación mejorada de proveedor
      if (!row['Proveedor'] || row['Proveedor'].toString().trim() === '') {
        errores.push({ 
          fila, 
          producto: row['Nombre producto'] || 'Sin nombre',
          error: 'Falta el nombre del proveedor',
          detalle: 'Se seleccionó modo "con proveedor" pero la columna "Proveedor" está vacía',
          solucion: 'Complete el nombre del proveedor o use el modo "sin proveedor"'
        });
        return;
      }
      
      const proveedorNombre = row['Proveedor'].toString().trim();
      if (!comprasPorProveedor[proveedorNombre])
        comprasPorProveedor[proveedorNombre] = [];
      comprasPorProveedor[proveedorNombre].push({ ...row, _fila: fila });
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
        
        // *** MANEJO INTELIGENTE DEL PRECIO DE VENTA ***
        let precioVenta = 0;
        const precioVentaExcel = row['Precio venta'];
        
        // Verificar si el Excel tiene un precio de venta específico
        if (precioVentaExcel !== undefined && precioVentaExcel !== null && precioVentaExcel !== '') {
          const precioVentaNumerico = Number(precioVentaExcel);
          if (!isNaN(precioVentaNumerico) && precioVentaNumerico > 0) {
            // Usar el precio de venta del Excel
            precioVenta = precioVentaNumerico;
            console.log(`💰 Usando precio de venta del Excel para "${row['Nombre producto']}": $${precioVenta}`);
          }
        }
        
        // Si no hay precio de venta en el Excel o es inválido, calcular automáticamente
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

    console.log('🎉 Carga masiva (con proveedor) completada:');
    console.log(`- Productos creados: ${productosCreados}`);
    console.log(`- Productos actualizados: ${productosActualizados}`);
    console.log(`- Compras creadas: ${comprasCreadas}`);
    console.log(`- Errores encontrados: ${errores.length}`);

    return {
      success: errores.length === 0,
      mensaje: errores.length === 0 ? 
        'Carga completada exitosamente (con proveedores)' : 
        `Carga completada con errores (${errores.length} problemas encontrados)`,
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
      
      // Validar campos obligatorios específicos (sin proveedor)
      const camposFaltantes: string[] = [];
      if (!row['Nombre producto'] || row['Nombre producto'].toString().trim() === '') {
        camposFaltantes.push('Nombre producto');
      }
      if (!row['Categoría'] || row['Categoría'].toString().trim() === '') {
        camposFaltantes.push('Categoría');
      }
      if (!row['Unidad'] || row['Unidad'].toString().trim() === '') {
        camposFaltantes.push('Unidad');
      }
      
      if (camposFaltantes.length > 0) {
        errores.push({
          fila,
          producto: row['Nombre producto'] || 'Sin nombre',
          error: `Campos obligatorios faltantes: ${camposFaltantes.join(', ')}`,
          detalle: 'Estos campos son requeridos para crear o actualizar un producto'
        });
        continue;
      }

      // Buscar categoría
      console.log(`Buscando categoría: "${row['Categoría']}"`);
      const categoria = await this.prisma.category.findFirst({
        where: { name: row['Categoría'] },
      });
      if (!categoria) {
        // Obtener categorías disponibles para sugerir
        const categoriasDisponibles = await this.prisma.category.findMany({
          where: { isActive: true },
          select: { name: true }
        });
        
        errores.push({
          fila,
          producto: row['Nombre producto'],
          error: `Categoría "${row['Categoría']}" no existe en el sistema`,
          detalle: 'Categorías disponibles: ' + categoriasDisponibles.map(c => c.name).join(', '),
          solucion: 'Debe usar una categoría existente o crear la categoría en el sistema primero'
        });
        continue;
      }

      // Buscar unidad
      console.log(`Buscando unidad: "${row['Unidad']}"`);
      const unidad = await this.prisma.unit.findFirst({
        where: { name: row['Unidad'] },
      });
      if (!unidad) {
        // Obtener unidades disponibles para sugerir
        const unidadesDisponibles = await this.prisma.unit.findMany({
          where: { isActive: true },
          select: { name: true }
        });
        
        errores.push({
          fila,
          producto: row['Nombre producto'],
          error: `Unidad "${row['Unidad']}" no existe en el sistema`,
          detalle: 'Unidades disponibles: ' + unidadesDisponibles.map(u => u.name).join(', '),
          solucion: 'Debe usar una unidad existente o crear la unidad en el sistema primero'
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
      
      // *** MANEJO INTELIGENTE DEL PRECIO DE VENTA ***
      let precioVenta = 0;
      const precioVentaExcel = row['Precio venta'];
      
      // Verificar si el Excel tiene un precio de venta específico
      if (precioVentaExcel !== undefined && precioVentaExcel !== null && precioVentaExcel !== '') {
        const precioVentaNumerico = Number(precioVentaExcel);
        if (!isNaN(precioVentaNumerico) && precioVentaNumerico > 0) {
          // Usar el precio de venta del Excel
          precioVenta = precioVentaNumerico;
          console.log(`💰 Usando precio de venta del Excel para "${row['Nombre producto']}": $${precioVenta}`);
        }
      }
      
      // Si no hay precio de venta en el Excel o es inválido, calcular automáticamente
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
          producto: row['Nombre producto'],
          error: 'Precio de compra inválido o faltante',
          detalle: `Valor recibido: "${row['Precio compra']}" - Se requiere un número mayor a 0`,
          solucion: 'Ingrese un precio de compra válido (mayor a 0) en la columna "Precio compra"'
        });
        continue;
      }

      // Validar stock si se proporciona
      if (row['Stock inicial'] !== undefined && row['Stock inicial'] !== null && row['Stock inicial'] !== '') {
        if (isNaN(stockToAdd) || stockToAdd < 0) {
          errores.push({
            fila,
            producto: row['Nombre producto'],
            error: 'Stock inicial inválido',
            detalle: `Valor recibido: "${row['Stock inicial']}" - Debe ser un número mayor o igual a 0`,
            solucion: 'Ingrese un stock inicial válido (número entero >= 0) o deje vacío'
          });
          continue;
        }
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

    console.log('🎉 Carga masiva completada:');
    console.log(`- Productos creados: ${productosCreados}`);
    console.log(`- Productos actualizados: ${productosActualizados}`);
    console.log(`- Errores encontrados: ${errores.length}`);
    
    if (errores.length > 0) {
      console.log('⚠️ Errores detallados:');
      errores.forEach(error => {
        console.log(`  Fila ${error.fila}: ${error.error}`);
      });
    }

    return {
      success: errores.length === 0,
      mensaje: errores.length === 0 ? 
        'Carga completada exitosamente (sin proveedores)' : 
        `Carga completada con errores (${errores.length} filas fallaron)`,
      productosCreados,
      productosActualizados,
      comprasCreadas: 0, // No se crean compras sin proveedor
      totalFilasProcesadas: rows.length,
      errores,
    };
  }

  async getBulkUploadInfo() {
    const categorias = await this.prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' }
    });

    const unidades = await this.prisma.unit.findMany({
      where: { isActive: true },
      select: { id: true, name: true, symbol: true, description: true },
      orderBy: { name: 'asc' }
    });

    return {
      mensaje: 'Información para carga masiva de productos',
      columnasRequeridas: {
        obligatorias: ['Nombre producto', 'Categoría', 'Unidad', 'Precio compra'],
        opcionales: ['Descripción', 'Precio venta', 'Stock inicial', 'Stock mínimo', 'Imagen URL'],
        conProveedor: ['Proveedor'] // Solo requerida si withSupplier=true
      },
      categorias: categorias.map(c => ({
        nombre: c.name,
        descripcion: c.description
      })),
      unidades: unidades.map(u => ({
        nombre: u.name,
        simbolo: u.symbol,
        descripcion: u.description
      })),
      ejemploExcel: {
        'Nombre producto': 'Mont Blanc Starwalker',
        'Descripción': 'Perfume premium masculino',
        'Categoría': 'Premium ZB',
        'Unidad': 'Unidad',
        'Precio compra': 28000,
        'Precio venta': 90000,
        'Stock inicial': 5,
        'Stock mínimo': 2,
        'Imagen URL': 'https://ejemplo.com/imagen.jpg'
      },
      notas: [
        'Las categorías y unidades deben existir previamente en el sistema',
        'Si no se especifica precio de venta, se calculará automáticamente',
        'Para esencias, solo se permite la unidad "gramos"',
        'El stock inicial debe ser un número >= 0',
        'El precio de compra es obligatorio y debe ser > 0'
      ]
    };
  }

  async testBulkUpload(file: Express.Multer.File, withSupplier: boolean = false) {
    try {
      console.log('🧪 TEST - Analizando archivo de carga masiva...');
      console.log('- Archivo:', file.originalname);
      console.log('- Tamaño:', file.size, 'bytes');
      console.log('- MIME type:', file.mimetype);
      console.log('- withSupplier:', withSupplier);

      if (!file || !file.buffer) {
        throw new Error('Archivo no válido o vacío');
      }

      // Leer el archivo
      let rows: any[];
      if (file.mimetype === 'text/csv') {
        // Para CSV, convertir a JSON manualmente
        const csvText = file.buffer.toString('utf8');
        const lines = csvText.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        
        rows = lines.slice(1).map(line => {
          const values = line.split(',');
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index]?.trim() || '';
          });
          return obj;
        });
      } else {
        // Para Excel
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet);
      }

      console.log('- Filas encontradas:', rows.length);
      
      if (rows.length === 0) {
        return {
          success: false,
          error: 'El archivo está vacío o no tiene datos',
          data: null
        };
      }

      const firstRow = rows[0];
      const columnas = Object.keys(firstRow);
      
      // Análisis de columnas
      const columnasRequeridas = ['Nombre producto', 'Categoría', 'Unidad', 'Precio compra'];
      const columnasFaltantes = columnasRequeridas.filter(col => !columnas.includes(col));
      const tieneColumnaProveedor = columnas.includes('Proveedor');
      const tieneProveedorConDatos = rows.some(row => row['Proveedor'] && row['Proveedor'].toString().trim() !== '');

      // Análisis de datos
      const filasConProblemas: any[] = [];
      const categorias = new Set<string>();
      const unidades = new Set<string>();

      rows.forEach((row, index) => {
        const fila = index + 2;
        const problemas: string[] = [];

        // Validar campos obligatorios
        columnasRequeridas.forEach(campo => {
          if (!row[campo] || row[campo].toString().trim() === '') {
            problemas.push(`Falta ${campo}`);
          }
        });

        // Validar proveedor si es necesario
        if (withSupplier && (!row['Proveedor'] || row['Proveedor'].toString().trim() === '')) {
          problemas.push('Falta Proveedor');
        }

        if (problemas.length > 0) {
          filasConProblemas.push({
            fila,
            producto: row['Nombre producto'] || 'Sin nombre',
            problemas
          });
        }

        // Recopilar categorías y unidades
        if (row['Categoría']) categorias.add(row['Categoría']);
        if (row['Unidad']) unidades.add(row['Unidad']);
      });

      return {
        success: columnasFaltantes.length === 0 && filasConProblemas.length === 0,
        archivo: {
          nombre: file.originalname,
          tamaño: file.size,
          tipo: file.mimetype,
        },
        configuracion: {
          withSupplier,
          tieneColumnaProveedor,
          tieneProveedorConDatos
        },
        analisis: {
          totalFilas: rows.length,
          columnasDetectadas: columnas,
          columnasRequeridas,
          columnasFaltantes,
          categorias: Array.from(categorias),
          unidades: Array.from(unidades),
          filasConProblemas: filasConProblemas.slice(0, 10), // Solo las primeras 10
          totalFilasConProblemas: filasConProblemas.length
        },
        primerasFila: rows.slice(0, 3), // Primeras 3 filas como ejemplo
        recomendaciones: [
          columnasFaltantes.length > 0 ? `Agregar columnas faltantes: ${columnasFaltantes.join(', ')}` : null,
          withSupplier && !tieneProveedorConDatos ? 'Llenar la columna Proveedor o cambiar a modo sin proveedor' : null,
          !withSupplier && tieneProveedorConDatos ? 'Los datos de proveedor serán ignorados en modo sin proveedor' : null
        ].filter(Boolean)
      };

    } catch (error) {
      console.error('❌ Error en testBulkUpload:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  // Métodos para códigos de barras
  async findByBarcode(barcode: string) {
    try {
      console.log('🔍 Buscando producto con código:', barcode);
      
      const product = await this.prisma.product.findFirst({
        where: {
          barcode: barcode,
          isActive: true
        },
        include: {
          category: true,
          unit: true,
          supplier: true,
        },
      });

      if (!product) {
        console.log('❌ Producto no encontrado con código:', barcode);
        return null;
      }

      console.log('✅ Producto encontrado:', product.name);
      return product;
    } catch (error) {
      console.error('Error buscando producto por código de barras:', error);
      throw error;
    }
  }

  async generateBarcode(productId: number) {
    try {
      console.log('🏷️ Generando código de barras para producto ID:', productId);
      
      // Verificar que el producto existe
      const existingProduct = await this.prisma.product.findUnique({
        where: { id: productId },
      });

      if (!existingProduct) {
        throw new Error('Producto no encontrado');
      }

      // Si ya tiene código de barras, retornarlo
      if (existingProduct.barcode) {
        console.log('📋 Producto ya tiene código de barras:', existingProduct.barcode);
        return existingProduct;
      }

      // Generar nuevo código de barras usando el ID del producto
      // Formato: Prefijo (77) + ID del producto (5 dígitos) + dígito de verificación
      const prefix = '77'; // Prefijo personalizado para la perfumería
      const productIdStr = productId.toString().padStart(5, '0');
      
      // Calcular dígito de verificación simple
      const digits = (prefix + productIdStr).split('').map(Number);
      const checksum = digits.reduce((sum, digit, index) => {
        return sum + digit * (index % 2 === 0 ? 1 : 3);
      }, 0);
      const checkDigit = (10 - (checksum % 10)) % 10;
      
      const newBarcode = prefix + productIdStr + checkDigit;

      // Verificar que no exista ese código
      const existingBarcode = await this.prisma.product.findFirst({
        where: { barcode: newBarcode },
      });

      if (existingBarcode) {
        throw new Error('Código de barras ya existe, intente regenerar');
      }

      // Actualizar el producto con el nuevo código
      const updatedProduct = await this.prisma.product.update({
        where: { id: productId },
        data: { barcode: newBarcode },
        include: {
          category: true,
          unit: true,
          supplier: true,
        },
      });

      console.log('✅ Código de barras generado:', newBarcode);
      return updatedProduct;
    } catch (error) {
      console.error('Error generando código de barras:', error);
      throw error;
    }
  }

  async generateBarcodeForAllProducts() {
    try {
      console.log('🏷️ Generando códigos de barras para todos los productos sin código...');
      
      const productsWithoutBarcode = await this.prisma.product.findMany({
        where: {
          barcode: null,
          isActive: true
        },
      });

      console.log(`📊 Productos sin código de barras: ${productsWithoutBarcode.length}`);

      const results: Array<{
        success: boolean;
        productId: number;
        productName: string;
        barcode?: string | null;
        error?: string;
      }> = [];
      
      for (const product of productsWithoutBarcode) {
        try {
          const updatedProduct = await this.generateBarcode(product.id);
          results.push({
            success: true,
            productId: product.id,
            productName: product.name,
            barcode: updatedProduct.barcode
          });
        } catch (error) {
          results.push({
            success: false,
            productId: product.id,
            productName: product.name,
            error: error.message
          });
        }
      }

      return {
        success: true,
        processed: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      };
    } catch (error) {
      console.error('Error generando códigos masivos:', error);
      throw error;
    }
  }
}

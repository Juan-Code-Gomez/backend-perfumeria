import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateProductDto, 
  UpdateProductDto, 
  ProductFiltersDto, 
  BulkCreateProductDto,
  ProductType,
  VariantType 
} from './dto/enhanced-product.dto';
import { CreateProductPriceDto, UpdateProductPriceDto } from './dto/product-price.dto';
import { CreateProductMovementDto } from './dto/create-product-movement.dto';
import * as XLSX from 'xlsx';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // ===============================
  // GESTIÓN BÁSICA DE PRODUCTOS
  // ===============================

  async create(createProductDto: CreateProductDto) {
    const { components, ...productData } = createProductDto;

    // Validar que no existe un producto con el mismo SKU
    if (productData.sku) {
      const existingProduct = await this.prisma.product.findFirst({
        where: { sku: productData.sku, isActive: true }
      });
      if (existingProduct) {
        throw new BadRequestException(`Ya existe un producto con el SKU: ${productData.sku}`);
      }
    }

    // Validar categoría y unidad
    await this.validateCategoryAndUnit(productData.categoryId, productData.unitId);

    // Validar proveedor si se especifica
    if (productData.supplierId) {
      await this.validateSupplier(productData.supplierId);
    }

    // Crear el producto en una transacción
    return this.prisma.$transaction(async (tx) => {
      // Crear el producto
      const product = await tx.product.create({
        data: productData,
        include: {
          category: true,
          unit: true,
          supplier: true,
          parentProduct: true,
          variants: true
        }
      });

      // Si es un producto compuesto, agregar los componentes
      if (productData.isComposite && components && components.length > 0) {
        await tx.productComponent.createMany({
          data: components.map(comp => ({
            productId: product.id,
            componentProductId: comp.componentProductId,
            quantity: comp.quantity,
            isOptional: comp.isOptional || false,
            notes: comp.notes
          }))
        });
      }

      // Crear entrada en historial de precios
      await tx.productPrice.create({
        data: {
          productId: product.id,
          purchasePrice: productData.purchasePrice,
          salePrice: productData.salePrice,
          suggestedPrice: productData.suggestedPrice,
          supplierId: productData.supplierId,
          effectiveDate: new Date(),
          isActive: true,
          notes: 'Precio inicial al crear producto'
        }
      });

      return this.findOne(product.id);
    });
  }

  async findAll(filters: ProductFiltersDto = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};

    // Aplicar filtros
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
        { fragranceName: { contains: filters.search, mode: 'insensitive' } },
        { brand: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.supplierId) where.supplierId = filters.supplierId;
    if (filters.productType) where.productType = filters.productType;
    if (filters.variantType) where.variantType = filters.variantType;
    if (filters.fragranceName) where.fragranceName = { contains: filters.fragranceName, mode: 'insensitive' };
    if (filters.brand) where.brand = { contains: filters.brand, mode: 'insensitive' };
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    // Filtro especial para productos con stock bajo
    if (filters.lowStock) {
      where.AND = [
        { minStock: { not: null } },
        { stock: { lte: { minStock: true } } }  // Esto necesita ser manejado diferente
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, color: true, icon: true } },
          unit: { select: { id: true, name: true, symbol: true } },
          supplier: { select: { id: true, name: true, supplierType: true } },
          parentProduct: { select: { id: true, name: true, fragranceName: true } },
          variants: { 
            select: { id: true, name: true, variantType: true, stock: true, salePrice: true },
            where: { isActive: true }
          },
          components: {
            include: {
              componentProduct: {
                select: { id: true, name: true, unit: true, stock: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.product.count({ where })
    ]);

    return {
      data: products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        unit: true,
        supplier: true,
        parentProduct: true,
        variants: {
          where: { isActive: true },
          include: {
            unit: true,
            category: true
          }
        },
        components: {
          include: {
            componentProduct: {
              include: {
                unit: true,
                category: true
              }
            }
          }
        },
        usedInProducts: {
          include: {
            product: {
              select: { id: true, name: true }
            }
          }
        },
        priceHistory: {
          where: { isActive: true },
          orderBy: { effectiveDate: 'desc' },
          take: 5,
          include: {
            supplier: { select: { id: true, name: true } }
          }
        }
      }
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const { components, ...productData } = updateProductDto;

    // Verificar que el producto existe
    const existingProduct = await this.findOne(id);

    // Validar SKU único si se está actualizando
    if (productData.sku && productData.sku !== existingProduct.sku) {
      const duplicateProduct = await this.prisma.product.findFirst({
        where: { 
          sku: productData.sku, 
          isActive: true,
          id: { not: id }
        }
      });
      if (duplicateProduct) {
        throw new BadRequestException(`Ya existe un producto con el SKU: ${productData.sku}`);
      }
    }

    // Validar categoría y unidad si se están actualizando
    if (productData.categoryId) {
      await this.validateCategoryAndUnit(productData.categoryId, productData.unitId || existingProduct.unitId);
    }
    if (productData.unitId) {
      await this.validateCategoryAndUnit(productData.categoryId || existingProduct.categoryId, productData.unitId);
    }

    // Validar proveedor si se especifica
    if (productData.supplierId) {
      await this.validateSupplier(productData.supplierId);
    }

    return this.prisma.$transaction(async (tx) => {
      // Actualizar el producto
      const updatedProduct = await tx.product.update({
        where: { id },
        data: productData,
      });

      // Si se actualizan los componentes y es un producto compuesto
      if (productData.isComposite !== false && components !== undefined) {
        // Eliminar componentes existentes
        await tx.productComponent.deleteMany({
          where: { productId: id }
        });

        // Agregar nuevos componentes
        if (components.length > 0) {
          await tx.productComponent.createMany({
            data: components.map(comp => ({
              productId: id,
              componentProductId: comp.componentProductId,
              quantity: comp.quantity,
              isOptional: comp.isOptional || false,
              notes: comp.notes
            }))
          });
        }
      }

      // Si hay cambios en precios, crear nueva entrada en historial
      const priceChanged = productData.purchasePrice !== undefined || 
                          productData.salePrice !== undefined || 
                          productData.suggestedPrice !== undefined;

      if (priceChanged) {
        await tx.productPrice.create({
          data: {
            productId: id,
            purchasePrice: productData.purchasePrice,
            salePrice: productData.salePrice,
            suggestedPrice: productData.suggestedPrice,
            supplierId: productData.supplierId,
            effectiveDate: new Date(),
            isActive: true,
            notes: 'Actualización de precios'
          }
        });
      }

      return this.findOne(id);
    });
  }

  async remove(id: number) {
    const product = await this.findOne(id);
    
    // Soft delete
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async toggleActive(id: number) {
    const product = await this.findOne(id);
    
    return this.prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive }
    });
  }

  // ===============================
  // GESTIÓN DE FRAGANCIAS Y VARIANTES
  // ===============================

  async findByFragrance(fragranceName: string) {
    return this.prisma.product.findMany({
      where: {
        fragranceName: { contains: fragranceName, mode: 'insensitive' },
        isActive: true
      },
      include: {
        category: true,
        unit: true,
        supplier: true
      },
      orderBy: [
        { variantType: 'asc' },
        { name: 'asc' }
      ]
    });
  }

  async createFragranceVariant(parentId: number, variantData: CreateProductDto) {
    const parentProduct = await this.findOne(parentId);
    
    // Heredar información del producto padre
    const variantProductData = {
      ...variantData,
      parentProductId: parentId,
      fragranceName: parentProduct.fragranceName || undefined,
      brand: variantData.brand || parentProduct.brand || undefined,
      productType: ProductType.VARIANT,
      hasVariants: false
    };

    // Marcar el producto padre como que tiene variantes
    await this.prisma.product.update({
      where: { id: parentId },
      data: { hasVariants: true }
    });

    return this.create(variantProductData);
  }

  // ===============================
  // PRODUCTOS COMPUESTOS
  // ===============================

  async calculateCompositePrice(productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        components: {
          include: {
            componentProduct: true
          }
        }
      }
    });

    if (!product || !product.isComposite) {
      throw new BadRequestException('El producto no es compuesto');
    }

    let totalPurchasePrice = 0;
    let totalSalePrice = 0;

    for (const component of product.components) {
      totalPurchasePrice += component.componentProduct.purchasePrice * component.quantity;
      totalSalePrice += component.componentProduct.salePrice * component.quantity;
    }

    return {
      purchasePrice: totalPurchasePrice,
      salePrice: totalSalePrice,
      suggestedPrice: totalSalePrice * 1.3 // 30% de margen sugerido
    };
  }

  async updateCompositeStock(productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        components: {
          include: {
            componentProduct: true
          }
        }
      }
    });

    if (!product || !product.isComposite) {
      throw new BadRequestException('El producto no es compuesto');
    }

    // Calcular stock disponible basado en componentes
    let maxPossibleStock = Infinity;

    for (const component of product.components) {
      if (!component.isOptional) {
        const possibleFromComponent = Math.floor(component.componentProduct.stock / component.quantity);
        maxPossibleStock = Math.min(maxPossibleStock, possibleFromComponent);
      }
    }

    const availableStock = maxPossibleStock === Infinity ? 0 : maxPossibleStock;

    await this.prisma.product.update({
      where: { id: productId },
      data: { stock: availableStock }
    });

    return availableStock;
  }

  // ===============================
  // GESTIÓN DE STOCK Y MOVIMIENTOS
  // ===============================

  async findLowStock() {
    // Buscar productos con stock por debajo del mínimo
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        minStock: { not: null }
      },
      include: { 
        category: true, 
        unit: true,
        supplier: true 
      },
      orderBy: { stock: 'asc' }
    });

    // Filtrar en memoria los que tienen stock bajo
    return products.filter(product => product.stock <= (product.minStock || 0));
  }

  async getStockStatistics() {
    const [
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalStockValue
    ] = await Promise.all([
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.product.count({
        where: {
          isActive: true,
          minStock: { not: null },
          stock: { lte: this.prisma.product.fields.minStock }
        }
      }),
      this.prisma.product.count({
        where: {
          isActive: true,
          stock: { lte: 0 }
        }
      }),
      this.prisma.product.aggregate({
        where: { isActive: true },
        _sum: {
          stock: true
        }
      })
    ]);

    return {
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalStockUnits: totalStockValue._sum.stock || 0
    };
  }

  async findMovements(productId: number) {
    return this.prisma.productMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  async createMovement(productId: number, data: CreateProductMovementDto) {
    const product = await this.findOne(productId);

    // Calcular nuevo stock
    let newStock = product.stock;
    if (data.type === 'IN') newStock += data.quantity;
    else if (data.type === 'OUT') newStock -= data.quantity;
    else if (data.type === 'ADJUST') newStock += data.quantity;

    if (newStock < 0) {
      throw new BadRequestException('El stock no puede ser negativo');
    }

    // Actualizar stock y registrar movimiento
    return this.prisma.$transaction([
      this.prisma.product.update({
        where: { id: productId },
        data: { stock: newStock }
      }),
      this.prisma.productMovement.create({
        data: {
          productId,
          type: data.type,
          quantity: data.quantity,
          reason: data.reason,
          notes: data.notes
        }
      })
    ]);
  }

  // ===============================
  // GESTIÓN DE PRECIOS
  // ===============================

  async createPriceHistory(createPriceDto: CreateProductPriceDto) {
    // Desactivar precios anteriores
    await this.prisma.productPrice.updateMany({
      where: { 
        productId: createPriceDto.productId,
        isActive: true 
      },
      data: { isActive: false }
    });

    // Crear nuevo precio
    const newPrice = await this.prisma.productPrice.create({
      data: {
        ...createPriceDto,
        effectiveDate: createPriceDto.effectiveDate ? new Date(createPriceDto.effectiveDate) : new Date(),
        isActive: true
      },
      include: {
        product: true,
        supplier: true
      }
    });

    // Actualizar precios en el producto principal
    const updateData: any = {};
    if (createPriceDto.purchasePrice) updateData.purchasePrice = createPriceDto.purchasePrice;
    if (createPriceDto.salePrice) updateData.salePrice = createPriceDto.salePrice;
    if (createPriceDto.suggestedPrice) updateData.suggestedPrice = createPriceDto.suggestedPrice;

    if (Object.keys(updateData).length > 0) {
      await this.prisma.product.update({
        where: { id: createPriceDto.productId },
        data: updateData
      });
    }

    return newPrice;
  }

  async getPriceHistory(productId: number) {
    return this.prisma.productPrice.findMany({
      where: { productId },
      include: {
        supplier: { select: { id: true, name: true } }
      },
      orderBy: { effectiveDate: 'desc' }
    });
  }

  // ===============================
  // BÚSQUEDAS Y FILTROS AVANZADOS
  // ===============================

  async searchProducts(query: string) {
    return this.prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { barcode: { contains: query, mode: 'insensitive' } },
          { fragranceName: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
          { tags: { hasSome: [query] } }
        ]
      },
      include: {
        category: true,
        unit: true,
        supplier: true
      },
      take: 20
    });
  }

  async getProductsBySupplier(supplierId: number) {
    return this.prisma.product.findMany({
      where: {
        supplierId,
        isActive: true
      },
      include: {
        category: true,
        unit: true
      },
      orderBy: { name: 'asc' }
    });
  }

  async getFragranceGroups() {
    const result = await this.prisma.product.groupBy({
      by: ['fragranceName'],
      where: {
        fragranceName: { not: null },
        isActive: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    return result.map(group => ({
      fragranceName: group.fragranceName,
      productCount: group._count.id
    }));
  }

  // ===============================
  // CARGA MASIVA
  // ===============================

  async bulkCreate(bulkCreateDto: BulkCreateProductDto) {
    const results = {
      created: 0,
      errors: [] as any[],
      skipped: 0
    };

    for (const [index, productData] of bulkCreateDto.products.entries()) {
      try {
        // Verificar si ya existe por SKU
        if (productData.sku) {
          const existing = await this.prisma.product.findFirst({
            where: { sku: productData.sku, isActive: true }
          });
          if (existing) {
            results.skipped++;
            continue;
          }
        }

        await this.create(productData);
        results.created++;
      } catch (error) {
        results.errors.push({
          index,
          product: productData.name,
          error: error.message
        });
      }
    }

    return results;
  }

  async processExcelFile(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const products: CreateProductDto[] = [];

    for (const row of data as any[]) {
      try {
        const product: CreateProductDto = {
          name: row['Nombre'] || row['name'],
          description: row['Descripción'] || row['description'],
          sku: row['SKU'] || row['sku'],
          barcode: row['Código de Barras'] || row['barcode'],
          fragranceName: row['Fragancia'] || row['fragranceName'],
          categoryId: parseInt(row['Categoría ID'] || row['categoryId']),
          unitId: parseInt(row['Unidad ID'] || row['unitId']),
          stock: parseFloat(row['Stock'] || row['stock']),
          purchasePrice: parseFloat(row['Precio Compra'] || row['purchasePrice']),
          salePrice: parseFloat(row['Precio Venta'] || row['salePrice']),
          suggestedPrice: parseFloat(row['Precio Sugerido'] || row['suggestedPrice']),
          minStock: parseFloat(row['Stock Mínimo'] || row['minStock']),
          brand: row['Marca'] || row['brand'],
          size: row['Tamaño'] || row['size'],
          supplierId: parseInt(row['Proveedor ID'] || row['supplierId']) || undefined,
          notes: row['Notas'] || row['notes'],
          tags: row['Tags'] ? row['Tags'].split(',').map((t: string) => t.trim()) : []
        };

        products.push(product);
      } catch (error) {
        console.error('Error procesando fila:', row, error);
      }
    }

    return this.bulkCreate({ products });
  }

  // ===============================
  // ESTADÍSTICAS FINANCIERAS (TEMPORALMENTE COMENTADO - ARREGLAR DESPUÉS)
  // ===============================

  async getFinancialStatistics() {
    // Versión simplificada temporalmente
    const products = await this.prisma.product.findMany({
      where: { stock: { gt: 0 } },
      include: {
        category: { select: { name: true } }
      }
    });

    let totalInvestment = 0;
    let totalSaleValue = 0;
    let totalUnits = 0;

    products.forEach(product => {
      const investment = product.stock * product.purchasePrice;
      const saleValue = product.stock * product.salePrice;
      totalInvestment += investment;
      totalSaleValue += saleValue;
      totalUnits += product.stock;
    });

    return {
      summary: {
        totalProducts: products.length,
        totalUnits,
        totalInvestment: Math.round(totalInvestment),
        totalSaleValue: Math.round(totalSaleValue),
        potentialProfit: Math.round(totalSaleValue - totalInvestment),
        overallProfitMargin: totalInvestment > 0 ? 
          Math.round(((totalSaleValue - totalInvestment) / totalInvestment * 100) * 100) / 100 : 0
      },
      lastCalculated: new Date()
    };
  }

  async getInventoryValue() {
    const stats = await this.getFinancialStatistics();
    return {
      currentInvestment: stats.summary.totalInvestment,
      potentialSaleValue: stats.summary.totalSaleValue,
      potentialProfit: stats.summary.potentialProfit,
      profitMargin: stats.summary.overallProfitMargin,
      totalProducts: stats.summary.totalProducts,
      totalUnits: stats.summary.totalUnits,
      lastCalculated: new Date()
    };
  }

  // ===============================
  // UTILIDADES PRIVADAS
  // ===============================

  private async validateCategoryAndUnit(categoryId: number, unitId: number) {
    const [category, unit] = await Promise.all([
      this.prisma.category.findUnique({ where: { id: categoryId, isActive: true } }),
      this.prisma.unit.findUnique({ where: { id: unitId, isActive: true } })
    ]);

    if (!category) {
      throw new BadRequestException(`Categoría con ID ${categoryId} no encontrada o inactiva`);
    }
    if (!unit) {
      throw new BadRequestException(`Unidad con ID ${unitId} no encontrada o inactiva`);
    }
  }

  private async validateSupplier(supplierId: number) {
    const supplier = await this.prisma.supplier.findUnique({ 
      where: { id: supplierId, isActive: true } 
    });
    if (!supplier) {
      throw new BadRequestException(`Proveedor con ID ${supplierId} no encontrado o inactivo`);
    }
  }
}

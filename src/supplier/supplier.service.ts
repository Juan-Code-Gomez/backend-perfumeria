import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto';

interface FindAllOptions {
  includeInactive?: boolean;
  search?: string;
  supplierType?: string;
  paymentTerms?: string;
  isPreferred?: boolean;
  withDebt?: boolean;
}

@Injectable()
export class SupplierService {
  constructor(private prisma: PrismaService) {}

  async create(createSupplierDto: CreateSupplierDto) {
    try {
      const supplier = await this.prisma.supplier.create({
        data: {
          name: createSupplierDto.name,
          nit: createSupplierDto.nit,
          phone: createSupplierDto.phone,
          email: createSupplierDto.email,
          address: createSupplierDto.address,
          contactPerson: createSupplierDto.contactPerson,
          website: createSupplierDto.website,
          paymentTerms: createSupplierDto.paymentTerms,
          creditLimit: createSupplierDto.creditLimit,
          supplierType: createSupplierDto.supplierType,
          specializedCategories: createSupplierDto.specializedCategories || [],
          isActive: createSupplierDto.isActive ?? true,
          isPreferred: createSupplierDto.isPreferred ?? false,
          minOrderAmount: createSupplierDto.minOrderAmount,
          leadTimeDays: createSupplierDto.leadTimeDays,
          rating: createSupplierDto.rating,
          notes: createSupplierDto.notes,
        },
        include: {
          _count: {
            select: {
              purchases: true,
            },
          },
        },
      });

      return supplier;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe un proveedor con este NIT');
      }
      throw error;
    }
  }

  async findAll(options: FindAllOptions = {}) {
    const { 
      includeInactive = false, 
      search, 
      supplierType, 
      paymentTerms, 
      isPreferred, 
      withDebt 
    } = options;

    const whereConditions: any = {};

    if (!includeInactive) {
      whereConditions.isActive = true;
    }

    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nit: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (supplierType) {
      whereConditions.supplierType = supplierType;
    }

    if (paymentTerms) {
      whereConditions.paymentTerms = paymentTerms;
    }

    if (isPreferred !== undefined) {
      whereConditions.isPreferred = isPreferred;
    }

    if (withDebt) {
      whereConditions.currentDebt = { gt: 0 };
    }

    const suppliers = await this.prisma.supplier.findMany({
      where: whereConditions,
      include: {
        _count: {
          select: {
            purchases: true,
          },
        },
      },
      orderBy: [
        { isPreferred: 'desc' }, // Preferidos primero
        { isActive: 'desc' }, // Activos primero
        { name: 'asc' },
      ],
    });

    return suppliers;
  }

  async findOne(id: number) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        purchases: {
          select: {
            id: true,
            date: true,
            totalAmount: true,
            paidAmount: true,
            isPaid: true,
          },
          orderBy: {
            date: 'desc',
          },
          take: 10, // Últimas 10 compras
        },
        _count: {
          select: {
            purchases: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    // Calcular estadísticas adicionales
    const totalPurchases = await this.prisma.purchase.aggregate({
      where: { supplierId: id },
      _sum: { totalAmount: true },
      _count: true,
    });

    const pendingPurchases = await this.prisma.purchase.aggregate({
      where: { 
        supplierId: id,
        isPaid: false,
      },
      _sum: { 
        totalAmount: true,
        paidAmount: true,
      },
      _count: true,
    });

    return {
      ...supplier,
      statistics: {
        totalPurchaseAmount: totalPurchases._sum.totalAmount || 0,
        totalPurchaseCount: totalPurchases._count,
        pendingAmount: (pendingPurchases._sum.totalAmount || 0) - (pendingPurchases._sum.paidAmount || 0),
        pendingPurchaseCount: pendingPurchases._count,
        creditAvailable: supplier.creditLimit ? supplier.creditLimit - supplier.currentDebt : null,
      },
    };
  }

  async update(id: number, updateSupplierDto: UpdateSupplierDto) {
    const existingSupplier = await this.prisma.supplier.findUnique({
      where: { id },
    });

    if (!existingSupplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    try {
      const updatedSupplier = await this.prisma.supplier.update({
        where: { id },
        data: {
          name: updateSupplierDto.name,
          nit: updateSupplierDto.nit,
          phone: updateSupplierDto.phone,
          email: updateSupplierDto.email,
          address: updateSupplierDto.address,
          contactPerson: updateSupplierDto.contactPerson,
          website: updateSupplierDto.website,
          paymentTerms: updateSupplierDto.paymentTerms,
          creditLimit: updateSupplierDto.creditLimit,
          currentDebt: updateSupplierDto.currentDebt,
          supplierType: updateSupplierDto.supplierType,
          specializedCategories: updateSupplierDto.specializedCategories,
          isActive: updateSupplierDto.isActive,
          isPreferred: updateSupplierDto.isPreferred,
          minOrderAmount: updateSupplierDto.minOrderAmount,
          leadTimeDays: updateSupplierDto.leadTimeDays,
          rating: updateSupplierDto.rating,
          notes: updateSupplierDto.notes,
          updatedAt: new Date(),
        },
        include: {
          _count: {
            select: {
              purchases: true,
            },
          },
        },
      });

      return updatedSupplier;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe un proveedor con este NIT');
      }
      throw error;
    }
  }

  async remove(id: number) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            purchases: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    if (supplier._count.purchases > 0) {
      throw new ConflictException(
        'No se puede eliminar el proveedor porque tiene compras asociadas. Desactívelo en su lugar.',
      );
    }

    await this.prisma.supplier.delete({
      where: { id },
    });

    return {
      message: 'Proveedor eliminado exitosamente',
    };
  }

  async toggleStatus(id: number) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    const updatedSupplier = await this.prisma.supplier.update({
      where: { id },
      data: {
        isActive: !supplier.isActive,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            purchases: true,
          },
        },
      },
    });

    return updatedSupplier;
  }

  async togglePreferred(id: number) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    const updatedSupplier = await this.prisma.supplier.update({
      where: { id },
      data: {
        isPreferred: !supplier.isPreferred,
        updatedAt: new Date(),
      },
    });

    return updatedSupplier;
  }

  // Método para obtener estadísticas de proveedores
  async getStatistics() {
    const [totalSuppliers, activeSuppliers, preferredSuppliers, suppliersWithDebt] = await Promise.all([
      this.prisma.supplier.count(),
      this.prisma.supplier.count({ where: { isActive: true } }),
      this.prisma.supplier.count({ where: { isPreferred: true } }),
      this.prisma.supplier.count({ where: { currentDebt: { gt: 0 } } }),
    ]);

    // Estadísticas por tipo de proveedor
    const suppliersByType = await this.prisma.supplier.groupBy({
      by: ['supplierType'],
      _count: {
        id: true,
      },
      where: {
        isActive: true,
      },
    });

    // Top proveedores por monto de compras
    const topSuppliers = await this.prisma.supplier.findMany({
      include: {
        _count: {
          select: {
            purchases: true,
          },
        },
        purchases: {
          select: {
            totalAmount: true,
          },
        },
      },
      where: {
        isActive: true,
      },
      take: 5,
    });

    const topSuppliersWithTotals = topSuppliers.map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      supplierType: supplier.supplierType,
      purchaseCount: supplier._count.purchases,
      totalPurchaseAmount: supplier.purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0),
    })).sort((a, b) => b.totalPurchaseAmount - a.totalPurchaseAmount);

    // Deuda total
    const totalDebt = await this.prisma.supplier.aggregate({
      _sum: {
        currentDebt: true,
      },
      where: {
        isActive: true,
      },
    });

    return {
      totalSuppliers,
      activeSuppliers,
      inactiveSuppliers: totalSuppliers - activeSuppliers,
      preferredSuppliers,
      suppliersWithDebt,
      suppliersWithoutDebt: activeSuppliers - suppliersWithDebt,
      totalDebt: totalDebt._sum.currentDebt || 0,
      suppliersByType: suppliersByType.map(item => ({
        type: item.supplierType || 'Sin tipo',
        count: item._count.id,
      })),
      topSuppliers: topSuppliersWithTotals,
    };
  }

  // Método para obtener proveedores por tipo
  async getSuppliersByType(type: string) {
    const suppliers = await this.prisma.supplier.findMany({
      where: {
        supplierType: type,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            purchases: true,
          },
        },
      },
      orderBy: [
        { isPreferred: 'desc' },
        { name: 'asc' },
      ],
    });

    return suppliers;
  }

  // Método para obtener proveedores con deudas
  async getSuppliersWithDebt() {
    const suppliers = await this.prisma.supplier.findMany({
      where: {
        currentDebt: { gt: 0 },
        isActive: true,
      },
      include: {
        _count: {
          select: {
            purchases: true,
          },
        },
      },
      orderBy: {
        currentDebt: 'desc',
      },
    });

    return suppliers;
  }

  // Método para actualizar deuda de un proveedor
  async updateDebt(id: number, amount: number, operation: 'ADD' | 'SUBTRACT') {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    const newDebt = operation === 'ADD' 
      ? supplier.currentDebt + amount 
      : Math.max(0, supplier.currentDebt - amount);

    const updatedSupplier = await this.prisma.supplier.update({
      where: { id },
      data: {
        currentDebt: newDebt,
        updatedAt: new Date(),
      },
    });

    return updatedSupplier;
  }

  // Método para obtener resumen financiero de proveedores
  async getFinancialSummary() {
    const result = await this.prisma.supplier.aggregate({
      where: {
        isActive: true,
      },
      _sum: {
        currentDebt: true,
        creditLimit: true,
      },
      _count: {
        id: true,
      },
    });

    const suppliersWithDebt = await this.prisma.supplier.count({
      where: {
        currentDebt: { gt: 0 },
        isActive: true,
      },
    });

    const topDebtors = await this.prisma.supplier.findMany({
      where: {
        currentDebt: { gt: 0 },
        isActive: true,
      },
      orderBy: {
        currentDebt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        name: true,
        currentDebt: true,
        creditLimit: true,
      },
    });

    return {
      totalSuppliers: result._count.id,
      totalDebt: result._sum.currentDebt || 0,
      totalCreditLimit: result._sum.creditLimit || 0,
      suppliersWithDebt,
      topDebtors,
      creditUtilization: (result._sum.creditLimit || 0) > 0 
        ? ((result._sum.currentDebt || 0) / (result._sum.creditLimit || 0)) * 100 
        : 0,
    };
  }

  // Método para registrar pago a proveedor
  async registerPayment(supplierId: number, amount: number, paymentMethod: string, description?: string) {
    const supplier = await this.findOne(supplierId);
    
    if (amount <= 0) {
      throw new Error('El monto del pago debe ser mayor a 0');
    }

    if (amount > supplier.currentDebt) {
      throw new Error('El pago no puede ser mayor a la deuda actual');
    }

    return this.prisma.$transaction(async (tx) => {
      // Actualizar deuda del proveedor
      const updatedSupplier = await tx.supplier.update({
        where: { id: supplierId },
        data: {
          currentDebt: { decrement: amount },
          updatedAt: new Date(),
        },
      });

      // Registrar el movimiento de capital (salida)
      await tx.capitalMovement.create({
        data: {
          type: 'EGRESO',
          amount: amount,
          description: description || `Pago a proveedor ${supplier.name}`,
          category: 'PROVEEDOR',
          paymentMethod: paymentMethod,
          date: new Date(),
        },
      });

      return {
        supplier: updatedSupplier,
        payment: {
          amount,
          paymentMethod,
          description,
          date: new Date(),
        },
      };
    });
  }
}

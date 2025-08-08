import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnitDto, UpdateUnitDto } from './dto';

interface FindAllOptions {
  includeInactive?: boolean;
  search?: string;
  unitType?: string;
}

@Injectable()
export class UnitService {
  constructor(private prisma: PrismaService) {}

  async create(createUnitDto: CreateUnitDto) {
    try {
      const unit = await this.prisma.unit.create({
        data: {
          name: createUnitDto.name,
          symbol: createUnitDto.symbol,
          description: createUnitDto.description,
          unitType: createUnitDto.unitType,
          isActive: createUnitDto.isActive ?? true,
          isDecimal: createUnitDto.isDecimal ?? true,
        },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

      return unit;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe una unidad con este nombre');
      }
      throw error;
    }
  }

  async findAll(options: FindAllOptions = {}) {
    const { includeInactive = false, search, unitType } = options;

    const whereConditions: any = {};

    if (!includeInactive) {
      whereConditions.isActive = true;
    }

    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { symbol: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (unitType) {
      whereConditions.unitType = unitType;
    }

    const units = await this.prisma.unit.findMany({
      where: whereConditions,
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: [
        { isActive: 'desc' }, // Activas primero
        { name: 'asc' },
      ],
    });

    return units;
  }

  async findOne(id: number) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            stock: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          where: {
            isActive: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException('Unidad no encontrada');
    }

    return unit;
  }

  async update(id: number, updateUnitDto: UpdateUnitDto) {
    const existingUnit = await this.prisma.unit.findUnique({
      where: { id },
    });

    if (!existingUnit) {
      throw new NotFoundException('Unidad no encontrada');
    }

    try {
      const updatedUnit = await this.prisma.unit.update({
        where: { id },
        data: {
          name: updateUnitDto.name,
          symbol: updateUnitDto.symbol,
          description: updateUnitDto.description,
          unitType: updateUnitDto.unitType,
          isActive: updateUnitDto.isActive,
          isDecimal: updateUnitDto.isDecimal,
          updatedAt: new Date(),
        },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

      return updatedUnit;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe una unidad con este nombre');
      }
      throw error;
    }
  }

  async remove(id: number) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException('Unidad no encontrada');
    }

    if (unit._count.products > 0) {
      throw new ConflictException(
        'No se puede eliminar la unidad porque tiene productos asociados. Desactívela en su lugar.',
      );
    }

    await this.prisma.unit.delete({
      where: { id },
    });

    return {
      message: 'Unidad eliminada exitosamente',
    };
  }

  async toggleStatus(id: number) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
    });

    if (!unit) {
      throw new NotFoundException('Unidad no encontrada');
    }

    const updatedUnit = await this.prisma.unit.update({
      where: { id },
      data: {
        isActive: !unit.isActive,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return updatedUnit;
  }

  // Método para obtener estadísticas de unidades
  async getStatistics() {
    const [totalUnits, activeUnits, unitsWithProducts] = await Promise.all([
      this.prisma.unit.count(),
      this.prisma.unit.count({ where: { isActive: true } }),
      this.prisma.unit.count({
        where: {
          products: {
            some: {},
          },
        },
      }),
    ]);

    // Estadísticas por tipo de unidad
    const unitsByType = await this.prisma.unit.groupBy({
      by: ['unitType'],
      _count: {
        id: true,
      },
      where: {
        isActive: true,
      },
    });

    // Top unidades por cantidad de productos
    const topUnits = await this.prisma.unit.findMany({
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        products: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    return {
      totalUnits,
      activeUnits,
      inactiveUnits: totalUnits - activeUnits,
      unitsWithProducts,
      unitsWithoutProducts: totalUnits - unitsWithProducts,
      unitsByType: unitsByType.map(item => ({
        type: item.unitType || 'Sin tipo',
        count: item._count.id,
      })),
      topUnits: topUnits.map(unit => ({
        id: unit.id,
        name: unit.name,
        symbol: unit.symbol,
        productCount: unit._count.products,
      })),
    };
  }

  // Método para obtener unidades por tipo
  async getUnitsByType(type: string) {
    const units = await this.prisma.unit.findMany({
      where: {
        unitType: type,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return units;
  }
}

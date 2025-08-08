import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

interface FindAllOptions {
  includeInactive?: boolean;
  search?: string;
}

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    try {
      const category = await this.prisma.category.create({
        data: {
          name: createCategoryDto.name,
          description: createCategoryDto.description,
          isActive: createCategoryDto.isActive ?? true,
          color: createCategoryDto.color,
          icon: createCategoryDto.icon,
        },
      });

      return {
        success: true,
        data: category,
        message: 'Categoría creada exitosamente',
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe una categoría con este nombre');
      }
      throw error;
    }
  }

  async findAll(options: FindAllOptions = {}) {
    const { includeInactive = false, search } = options;

    const whereConditions: any = {};

    if (!includeInactive) {
      whereConditions.isActive = true;
    }

    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const categories = await this.prisma.category.findMany({
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

    return {
      success: true,
      data: categories,
    };
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            stock: true,
            salePrice: true,
            isActive: true,
          },
          where: {
            // Solo mostrar productos activos por defecto
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return {
      success: true,
      data: category,
    };
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException('Categoría no encontrada');
    }

    try {
      const updatedCategory = await this.prisma.category.update({
        where: { id },
        data: {
          name: updateCategoryDto.name,
          description: updateCategoryDto.description,
          isActive: updateCategoryDto.isActive,
          color: updateCategoryDto.color,
          icon: updateCategoryDto.icon,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        data: updatedCategory,
        message: 'Categoría actualizada exitosamente',
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe una categoría con este nombre');
      }
      throw error;
    }
  }

  async remove(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    if (category._count.products > 0) {
      throw new ConflictException(
        'No se puede eliminar la categoría porque tiene productos asociados. Desactívela en su lugar.',
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Categoría eliminada exitosamente',
    };
  }

  async toggleStatus(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: {
        isActive: !category.isActive,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: updatedCategory,
      message: `Categoría ${updatedCategory.isActive ? 'activada' : 'desactivada'} exitosamente`,
    };
  }

  // Método para obtener estadísticas de categorías
  async getStatistics() {
    const [totalCategories, activeCategories, categoriesWithProducts] = await Promise.all([
      this.prisma.category.count(),
      this.prisma.category.count({ where: { isActive: true } }),
      this.prisma.category.count({
        where: {
          products: {
            some: {},
          },
        },
      }),
    ]);

    const mostUsedCategories = await this.prisma.category.findMany({
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

    const recentCategories = await this.prisma.category.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    return {
      success: true,
      data: {
        totalCategories,
        activeCategories,
        inactiveCategories: totalCategories - activeCategories,
        categoriesWithProducts,
        mostUsedCategories: mostUsedCategories.map(cat => ({
          id: cat.id,
          name: cat.name,
          productCount: cat._count.products,
        })),
        recentCategories,
      },
    };
  }
}

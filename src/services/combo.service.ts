// src/services/combo.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ComboReceta {
  alcohol: { cantidad: number; unidad: string };
  fijador: { cantidad: number; unidad: string };
}

@Injectable()
export class ComboService {
  constructor(
    private prisma: PrismaService,
  ) {}

  /**
   * Procesa la venta de un combo, descontando automáticamente los ingredientes del inventario
   */
  async processComboSale(comboProductId: number, quantity: number, saleId: number) {
    // Obtener información del combo
    const combo = await this.prisma.product.findUnique({
      where: { id: comboProductId },
      include: { category: true }
    });

    if (!combo || combo.salesType !== 'COMBO') {
      throw new BadRequestException('El producto no es un combo válido');
    }

    // Extraer la receta del combo desde las notas
    let receta: ComboReceta | null = null;
    try {
      const parsedNotes = JSON.parse(combo.notes || '{}');
      receta = parsedNotes.receta;
    } catch (error) {
      throw new BadRequestException('Error al procesar la receta del combo');
    }

    if (!receta || !receta.alcohol || !receta.fijador) {
      throw new BadRequestException('El combo no tiene una receta válida definida');
    }

    // Buscar los productos de alcohol y fijador en el inventario
    const alcoholProduct = await this.findInsumoProduct('alcohol');
    const fijadorProduct = await this.findInsumoProduct('fijador');

    if (!alcoholProduct || !fijadorProduct) {
      throw new BadRequestException('No se encontraron los productos de alcohol o fijador en el inventario');
    }

    // Calcular las cantidades totales a descontar
    const alcoholToDiscount = receta.alcohol.cantidad * quantity;
    const fijadorToDiscount = receta.fijador.cantidad * quantity;

    // Verificar que hay suficiente stock
    if (alcoholProduct.stock < alcoholToDiscount) {
      throw new BadRequestException(
        `Stock insuficiente de alcohol. Necesario: ${alcoholToDiscount}ml, Disponible: ${alcoholProduct.stock}ml`
      );
    }

    if (fijadorProduct.stock < fijadorToDiscount) {
      throw new BadRequestException(
        `Stock insuficiente de fijador. Necesario: ${fijadorToDiscount}g, Disponible: ${fijadorProduct.stock}g`
      );
    }

    // Realizar los descuentos de inventario en una transacción
    const result = await this.prisma.$transaction(async (tx) => {
      // Descontar alcohol
      await tx.product.update({
        where: { id: alcoholProduct.id },
        data: { stock: { decrement: alcoholToDiscount } }
      });

      // Descontar fijador
      await tx.product.update({
        where: { id: fijadorProduct.id },
        data: { stock: { decrement: fijadorToDiscount } }
      });

      // Registrar movimientos de inventario (comentado temporalmente)
      // await this.productMovementService.createMovement({
      //   productId: alcoholProduct.id,
      //   type: 'OUT',
      //   quantity: alcoholToDiscount,
      //   reason: `Venta combo ${combo.name} (Venta #${saleId})`,
      //   referenceType: 'SALE',
      //   referenceId: saleId,
      // });

      // await this.productMovementService.createMovement({
      //   productId: fijadorProduct.id,
      //   type: 'OUT',
      //   quantity: fijadorToDiscount,
      //   reason: `Venta combo ${combo.name} (Venta #${saleId})`,
      //   referenceType: 'SALE',
      //   referenceId: saleId,
      // });

      console.log(`✅ Combo ${combo.name}: Descontado ${alcoholToDiscount}ml alcohol y ${fijadorToDiscount}g fijador`);

      return {
        comboId: combo.id,
        comboName: combo.name,
        quantity,
        alcoholDiscount: alcoholToDiscount,
        fijadorDiscount: fijadorToDiscount,
        alcoholProductId: alcoholProduct.id,
        fijadorProductId: fijadorProduct.id,
      };
    });

    return result;
  }

  /**
   * Busca un producto insumo por nombre (alcohol o fijador)
   */
  private async findInsumoProduct(name: string) {
    return await this.prisma.product.findFirst({
      where: {
        salesType: 'INSUMO',
        name: {
          contains: name,
          mode: 'insensitive'
        },
        isActive: true
      }
    });
  }

  /**
   * Obtiene la información de la receta de un combo
   */
  async getComboRecipe(comboId: number) {
    const combo = await this.prisma.product.findUnique({
      where: { id: comboId }
    });

    if (!combo || combo.salesType !== 'COMBO') {
      return null;
    }

    try {
      const parsedNotes = JSON.parse(combo.notes || '{}');
      const receta: ComboReceta = parsedNotes.receta;
      return {
        comboId: combo.id,
        comboName: combo.name,
        receta
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Lista todos los combos disponibles
   */
  async getAllCombos() {
    const combos = await this.prisma.product.findMany({
      where: {
        salesType: 'COMBO',
        isActive: true
      },
      include: {
        category: true,
        unit: true
      }
    });

    return combos.map(combo => {
      let receta: ComboReceta | null = null;
      try {
        const parsedNotes = JSON.parse(combo.notes || '{}');
        receta = parsedNotes.receta;
      } catch (error) {
        receta = null;
      }

      return {
        ...combo,
        receta
      };
    });
  }
}

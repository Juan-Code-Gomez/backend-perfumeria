// src/services/simple-capital.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SimpleCapitalService {
  constructor(private prisma: PrismaService) {}

  /**
   * Registra una venta en capital automáticamente
   */
  async processSale(saleId: number, amount: number, paymentMethod: string) {
    try {
      // Obtener capital actual o crear uno inicial
      let capital = await this.prisma.capital.findFirst({
        orderBy: { date: 'desc' },
      });

      if (!capital) {
        capital = await this.prisma.capital.create({
          data: {
            cash: 0,
            bank: 0,
            description: 'Capital inicial',
          },
        });
      }

      // Actualizar capital según método de pago
      let newCash = capital.cash;
      let newBank = capital.bank;

      if (paymentMethod.toUpperCase() === 'EFECTIVO') {
        newCash += amount;
      } else {
        newBank += amount;
      }

      // Actualizar capital
      const updatedCapital = await this.prisma.capital.update({
        where: { id: capital.id },
        data: {
          cash: newCash,
          bank: newBank,
          description: `Venta #${saleId} - ${paymentMethod}`,
          date: new Date(),
        },
      });

      console.log(`✅ Capital actualizado por venta #${saleId}: +$${amount} (${paymentMethod})`);
      return updatedCapital;
    } catch (error) {
      console.error('Error actualizando capital:', error);
      throw error;
    }
  }

  /**
   * Obtiene el capital actual
   */
  async getCurrentCapital() {
    let capital = await this.prisma.capital.findFirst({
      orderBy: { date: 'desc' },
    });

    if (!capital) {
      capital = await this.prisma.capital.create({
        data: {
          cash: 0,
          bank: 0,
          description: 'Capital inicial',
        },
      });
    }

    return capital;
  }
}

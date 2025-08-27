// src/services/capital-auto.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CapitalAutoService {
  constructor(private prisma: PrismaService) {}

  /**
   * Registra un movimiento de capital automáticamente
   */
  async registerMovement(data: {
    type: 'INGRESO' | 'EGRESO';
    amount: number;
    description: string;
    category: 'VENTA' | 'PROVEEDOR' | 'GASTO' | 'OTRO';
    paymentMethod: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA';
    saleId?: number;
    invoiceId?: number;
    expenseId?: number;
  }) {
    // Obtener el capital actual
    const currentCapital = await this.getCurrentCapital();
    
    let newCash = currentCapital.cash;
    let newBank = currentCapital.bank;

    // Actualizar capital según el método de pago
    if (data.type === 'INGRESO') {
      if (data.paymentMethod === 'EFECTIVO') {
        newCash += data.amount;
      } else {
        newBank += data.amount;
      }
    } else { // EGRESO
      if (data.paymentMethod === 'EFECTIVO') {
        newCash = Math.max(0, newCash - data.amount);
      } else {
        newBank = Math.max(0, newBank - data.amount);
      }
    }

    // Ejecutar en transacción
    return this.prisma.$transaction(async (tx) => {
      // Registrar el movimiento
      const movement = await tx.capitalMovement.create({
        data: {
          type: data.type,
          amount: data.amount,
          description: data.description,
          category: data.category,
          paymentMethod: data.paymentMethod,
          cashBefore: currentCapital.cash,
          bankBefore: currentCapital.bank,
          cashAfter: newCash,
          bankAfter: newBank,
          saleId: data.saleId,
          invoiceId: data.invoiceId,
          expenseId: data.expenseId,
        },
      });

      // Actualizar el capital actual
      const updatedCapital = await tx.capital.update({
        where: { id: currentCapital.id },
        data: {
          cash: newCash,
          bank: newBank,
          description: `Actualización automática: ${data.description}`,
          date: new Date(),
        },
      });

      return {
        movement,
        capital: updatedCapital,
      };
    });
  }

  /**
   * Obtiene el capital actual, creándolo si no existe
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

  /**
   * Procesa una venta y actualiza el capital automáticamente
   */
  async processSale(saleId: number, amount: number, paymentMethod: string) {
    const capitalPaymentMethod = this.mapPaymentMethod(paymentMethod);
    
    return this.registerMovement({
      type: 'INGRESO',
      amount,
      description: `Venta #${saleId}`,
      category: 'VENTA',
      paymentMethod: capitalPaymentMethod,
      saleId,
    });
  }

  /**
   * Procesa un pago de factura y actualiza el capital automáticamente
   */
  async processInvoicePayment(invoiceId: number, amount: number, paymentMethod: string, supplierName: string) {
    const capitalPaymentMethod = this.mapPaymentMethod(paymentMethod);
    
    return this.registerMovement({
      type: 'EGRESO',
      amount,
      description: `Pago a ${supplierName} - Factura #${invoiceId}`,
      category: 'PROVEEDOR',
      paymentMethod: capitalPaymentMethod,
      invoiceId,
    });
  }

  /**
   * Procesa un gasto y actualiza el capital automáticamente
   */
  async processExpense(expenseId: number, amount: number, paymentMethod: string, description: string) {
    const capitalPaymentMethod = this.mapPaymentMethod(paymentMethod);
    
    return this.registerMovement({
      type: 'EGRESO',
      amount,
      description: `Gasto: ${description}`,
      category: 'GASTO',
      paymentMethod: capitalPaymentMethod,
      expenseId,
    });
  }

  /**
   * Genera un resumen diario del capital
   */
  async generateDailySummary(date?: Date) {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Obtener movimientos del día
    const movements = await this.prisma.capitalMovement.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Calcular resumen
    const summary = movements.reduce(
      (acc, movement) => {
        if (movement.type === 'INGRESO') {
          acc.ingresos += movement.amount;
          if (movement.paymentMethod === 'EFECTIVO') {
            acc.ingresosCash += movement.amount;
          } else {
            acc.ingresosBank += movement.amount;
          }
        } else {
          acc.egresos += movement.amount;
          if (movement.paymentMethod === 'EFECTIVO') {
            acc.egresosCash += movement.amount;
          } else {
            acc.egresosBank += movement.amount;
          }
        }
        return acc;
      },
      {
        ingresos: 0,
        egresos: 0,
        ingresosCash: 0,
        ingresosBank: 0,
        egresosCash: 0,
        egresosBank: 0,
      }
    );

    const netFlow = summary.ingresos - summary.egresos;
    const currentCapital = await this.getCurrentCapital();

    return {
      date: targetDate,
      summary,
      netFlow,
      currentCapital: {
        cash: currentCapital.cash,
        bank: currentCapital.bank,
        total: currentCapital.cash + currentCapital.bank,
      },
      movements,
    };
  }

  /**
   * Obtiene el historial de capital por rango de fechas
   */
  async getCapitalHistory(from: Date, to: Date) {
    return this.prisma.capitalMovement.findMany({
      where: {
        date: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Mapea métodos de pago a formato de capital
   */
  private mapPaymentMethod(paymentMethod: string): 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' {
    const method = paymentMethod.toUpperCase();
    if (method === 'EFECTIVO' || method === 'CASH') return 'EFECTIVO';
    if (method === 'TRANSFERENCIA' || method === 'TRANSFER') return 'TRANSFERENCIA';
    if (method === 'TARJETA' || method === 'CARD' || method === 'CREDITO') return 'TARJETA';
    return 'EFECTIVO'; // Default
  }
}

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCashClosingDto } from './dto/create-cash-closing.dto';

@Injectable()
export class CashClosingService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCashClosingDto, userId?: number) {
    let date: Date;
    
    try {
      console.log(`📥 Received cash closing data:`, {
        date: data.date,
        openingCash: data.openingCash,
        closingCash: data.closingCash
      });

      if (data.date) {
        // Crear fecha local sin interpretación UTC
        const dateStr = data.date.toString();
        console.log(`📅 Processing date string: ${dateStr}`);
        const parts = dateStr.split('-');
        date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        date = new Date();
      }

      console.log(`🎯 Parsed date object: ${date.toISOString()}`);

      // Calcula el rango del día
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      console.log(`🕐 Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

      console.log(`🔍 Processing cash closing for date: ${startOfDay.toISOString()}`);

      // Busca si ya existe cierre para ese día (usando rango de fechas)
      const exist = await this.prisma.cashClosing.findFirst({
        where: { 
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
      });
      if (exist) {
        console.log(`⚠️ Found existing cash closing: ${exist.date.toISOString()}`);
        throw new BadRequestException('Ya existe un cierre para este día.');
      }

      // 1. Ventas del día
      const sales = await this.prisma.sale.findMany({
        where: { 
          date: { gte: startOfDay, lte: endOfDay },
          // Excluir ventas anuladas si existe ese campo
        },
      });

      console.log(`📊 Found ${sales.length} sales for the day`);

      const totalSales = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      const cashSales = sales
        .filter((s) => s.paymentMethod === 'Efectivo')
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      const cardSales = sales
        .filter((s) => s.paymentMethod === 'Tarjeta')
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      const transferSales = sales
        .filter((s) => s.paymentMethod === 'Transferencia')
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      const creditSales = sales
        .filter((s) => s.paymentMethod === 'Crédito' || s.isPaid === false)
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

      // 2. Egresos del día
      const expenses = await this.prisma.expense.findMany({
        where: { 
          date: { gte: startOfDay, lte: endOfDay },
          deletedAt: null // Solo gastos no eliminados
        },
      });
      const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      console.log(`💸 Found ${expenses.length} expenses totaling: $${totalExpense}`);

      // 3. Pagos a proveedores del día (compras pagadas)
      const payments = await this.prisma.purchase.findMany({
        where: { 
          date: { gte: startOfDay, lte: endOfDay }, 
          isPaid: true 
        },
      });
      const totalPayments = payments.reduce(
        (sum, p) => sum + (p.paidAmount || 0),
        0,
      );

      console.log(`🏪 Found ${payments.length} supplier payments totaling: $${totalPayments}`);

      // 4. Ingresos extra del día (desde el DTO o 0)
      const totalIncome = data.totalIncome || 0;

      // 5. Calcula caja según sistema
      const systemCash =
        (data.openingCash || 0) +
        cashSales +
        totalIncome -
        totalExpense -
        totalPayments;

      // 6. Diferencia real vs sistema
      const difference = data.closingCash - systemCash;

      console.log(`💰 Cash calculation:
        Opening: $${data.openingCash}
        Cash Sales: $${cashSales}
        Extra Income: $${totalIncome}
        Expenses: $${totalExpense}
        Payments: $${totalPayments}
        System Cash: $${systemCash}
        Actual Cash: $${data.closingCash}
        Difference: $${difference}
      `);

      // Validaciones adicionales
      if (Math.abs(difference) > 50000) { // Diferencia mayor a $50,000
        console.warn(`⚠️ Large cash difference detected: $${difference}`);
      }

      // Guarda el cierre
      const cashClosing = await this.prisma.cashClosing.create({
        data: {
          date: startOfDay,
          openingCash: data.openingCash || 0,
          closingCash: data.closingCash || 0,
          systemCash: Number(systemCash.toFixed(2)),
          difference: Number(difference.toFixed(2)),
          totalSales: Number(totalSales.toFixed(2)),
          cashSales: Number(cashSales.toFixed(2)),
          cardSales: Number(cardSales.toFixed(2)),
          transferSales: Number(transferSales.toFixed(2)),
          creditSales: Number(creditSales.toFixed(2)),
          totalIncome: Number(totalIncome.toFixed(2)),
          totalExpense: Number(totalExpense.toFixed(2)),
          totalPayments: Number(totalPayments.toFixed(2)),
          notes: data.notes || null,
          createdById: userId || null,
        },
      });

      console.log(`✅ Cash closing created successfully with ID: ${cashClosing.id}`);
      return cashClosing;

    } catch (error) {
      console.error('❌ Error creating cash closing:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error al crear cierre de caja: ${error.message}`);
    }
  }

  async findAll(dateFrom?: string, dateTo?: string) {
    const where: any = {};
    
    if (dateFrom || dateTo) {
      where.date = {};
      
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        where.date.gte = fromDate;
      }
      
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        where.date.lte = toDate;
      }
    }

    return this.prisma.cashClosing.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.cashClosing.findUnique({ where: { id } });
  }

  async getSummary(date?: string) {
    let today: Date;
    
    if (date) {
      // Crear fecha local sin interpretación UTC
      const parts = date.split('-');
      today = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else {
      today = new Date();
    }
    
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('getSummary called with date:', date);
    console.log('Date range:', { startOfDay, endOfDay });
    console.log('Searching for expenses between:', startOfDay.toISOString(), 'and', endOfDay.toISOString());

    // 1. Todas las ventas del día (incluyendo las no pagadas para mostrar el resumen completo)
    const sales = await this.prisma.sale.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    console.log('Sales found:', sales.length);

    const totalSales = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const cashSales = sales
      .filter((s) => s.paymentMethod === 'Efectivo' && s.isPaid)
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const cardSales = sales
      .filter((s) => s.paymentMethod === 'Tarjeta' && s.isPaid)
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const transferSales = sales
      .filter((s) => s.paymentMethod === 'Transferencia' && s.isPaid)
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const creditSales = sales
      .filter((s) => s.paymentMethod === 'Crédito' || !s.isPaid)
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

    // 2. Egresos/gastos del día
    const expenses = await this.prisma.expense.findMany({
      where: { 
        date: { gte: startOfDay, lte: endOfDay },
        deletedAt: null // Solo gastos no eliminados
      },
    });
    
    console.log('Expenses found:', expenses.length);
    console.log('Expenses data:', expenses);
    const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // 3. Pagos a proveedores (compras pagadas)
    const payments = await this.prisma.purchase.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay }, isPaid: true },
    });
    const totalPayments = payments.reduce(
      (sum, p) => sum + (p.paidAmount || 0),
      0,
    );

    // 4. Ingresos extra
    const totalIncome = 0; // Si tienes modelo, ajusta aquí

    // Caja según sistema (solo efectivo que efectivamente ingresó)
    const systemCash = cashSales + totalIncome - totalExpense - totalPayments;

    const result = {
      fecha: startOfDay,
      totalSales,
      cashSales,
      cardSales,
      transferSales,
      creditSales,
      totalExpense,
      totalPayments,
      totalIncome,
      systemCash,
    };

    console.log('Summary result:', result);
    
    return result;
  }

  async getAnalytics(days: number = 30) {
    try {
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      const closings = await this.prisma.cashClosing.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: 'desc' },
      });

      if (closings.length === 0) {
        return {
          totalClosings: 0,
          perfectClosings: 0,
          accuracyRate: 0,
          avgDifference: 0,
          maxDifference: 0,
          totalShortage: 0,
          totalSurplus: 0,
          recentTrend: 'neutral',
        };
      }

      const totalClosings = closings.length;
      const perfectClosings = closings.filter(c => c.difference === 0).length;
      const accuracyRate = (perfectClosings / totalClosings) * 100;
      
      const avgDifference = closings.reduce((sum, c) => sum + Math.abs(c.difference), 0) / totalClosings;
      const maxDifference = Math.max(...closings.map(c => Math.abs(c.difference)));
      
      const shortages = closings.filter(c => c.difference < 0);
      const surpluses = closings.filter(c => c.difference > 0);
      
      const totalShortage = shortages.reduce((sum, c) => sum + Math.abs(c.difference), 0);
      const totalSurplus = surpluses.reduce((sum, c) => sum + c.difference, 0);

      // Análisis de tendencia (últimos 7 vs anteriores)
      const recent = closings.slice(0, Math.min(7, closings.length));
      const older = closings.slice(7);
      
      let recentTrend = 'neutral';
      if (older.length > 0) {
        const recentAccuracy = recent.filter(c => c.difference === 0).length / recent.length * 100;
        const olderAccuracy = older.filter(c => c.difference === 0).length / older.length * 100;
        
        if (recentAccuracy > olderAccuracy + 5) recentTrend = 'improving';
        else if (recentAccuracy < olderAccuracy - 5) recentTrend = 'declining';
      }

      return {
        totalClosings,
        perfectClosings,
        accuracyRate: Number(accuracyRate.toFixed(2)),
        avgDifference: Number(avgDifference.toFixed(2)),
        maxDifference: Number(maxDifference.toFixed(2)),
        totalShortage: Number(totalShortage.toFixed(2)),
        totalSurplus: Number(totalSurplus.toFixed(2)),
        recentTrend,
        period: `${days} días`,
        closings: closings.map(c => ({
          date: c.date.toISOString().split('T')[0],
          difference: c.difference,
          systemCash: c.systemCash,
          closingCash: c.closingCash,
        })),
      };
    } catch (error) {
      console.error('❌ Error getting analytics:', error);
      throw new BadRequestException(`Error al obtener analíticas: ${error.message}`);
    }
  }

  async getAlerts() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Obtener el último cierre
      const lastClosing = await this.prisma.cashClosing.findFirst({
        orderBy: { date: 'desc' },
      });

      // Obtener ventas de hoy
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);
      
      const todaySales = await this.prisma.sale.findMany({
        where: {
          date: {
            gte: today,
            lte: todayEnd,
          },
        },
      });

      const totalSalesToday = todaySales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

      const alerts: any[] = [];

      // Verificar cierre faltante de ayer
      if (!lastClosing || lastClosing.date < yesterday) {
        alerts.push({
          type: 'missing_closing',
          severity: 'error',
          message: 'Falta registrar cierre de caja de ayer',
          data: { missingDate: yesterday.toISOString().split('T')[0] },
        });
      }

      // Verificar diferencia significativa en último cierre
      if (lastClosing && Math.abs(lastClosing.difference) > 10000) {
        alerts.push({
          type: 'large_difference',
          severity: 'warning',
          message: `Diferencia significativa en último cierre: $${lastClosing.difference.toLocaleString()}`,
          data: { 
            difference: lastClosing.difference, 
            date: lastClosing.date.toISOString().split('T')[0] 
          },
        });
      }

      // Recordatorio de cierre diario (después de las 6 PM)
      const currentHour = new Date().getHours();
      if (currentHour >= 18 && totalSalesToday > 0 && (!lastClosing || lastClosing.date < today)) {
        alerts.push({
          type: 'daily_reminder',
          severity: 'info',
          message: `Hora de cerrar caja. Ventas del día: $${totalSalesToday.toLocaleString()}`,
          data: { sales: totalSalesToday },
        });
      }

      // Múltiples días sin cierre
      if (lastClosing) {
        const daysDiff = Math.floor((today.getTime() - lastClosing.date.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff > 3) {
          alerts.push({
            type: 'multiple_missing',
            severity: 'error',
            message: `${daysDiff} días sin registrar cierres de caja`,
            data: { daysPending: daysDiff },
          });
        }
      }

      return {
        alerts,
        summary: {
          hasAlerts: alerts.length > 0,
          criticalAlerts: alerts.filter(a => a.severity === 'error').length,
          warningAlerts: alerts.filter(a => a.severity === 'warning').length,
          infoAlerts: alerts.filter(a => a.severity === 'info').length,
        },
      };
    } catch (error) {
      console.error('❌ Error getting alerts:', error);
      throw new BadRequestException(`Error al obtener alertas: ${error.message}`);
    }
  }

  // Método temporal para limpiar cierre de hoy - SOLO PARA DESARROLLO
  async cleanTodayClosing() {
    try {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      console.log(`🧹 Limpiando cierres para ${todayString}`);
      
      const startOfDay = new Date(todayString + 'T00:00:00.000Z');
      const endOfDay = new Date(todayString + 'T23:59:59.999Z');
      
      const deleted = await this.prisma.cashClosing.deleteMany({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });
      
      console.log(`✅ Eliminados ${deleted.count} cierres para hoy`);
      
      return {
        success: true,
        message: `Eliminados ${deleted.count} cierres para ${todayString}`,
        deleted: deleted.count
      };
      
    } catch (error) {
      console.error('❌ Error cleaning today closing:', error);
      throw new BadRequestException(`Error al limpiar cierres: ${error.message}`);
    }
  }
}

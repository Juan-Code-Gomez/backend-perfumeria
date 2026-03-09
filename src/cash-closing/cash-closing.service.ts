import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCashClosingDto } from './dto/create-cash-closing.dto';
import { parseLocalDate, startOfDay as getStartOfDay, endOfDay as getEndOfDay, todayRangeColombia } from '../common/utils/timezone.util';

@Injectable()
export class CashClosingService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCashClosingDto, userId?: number) {
    try {
      console.log(`📥 Received cash closing data:`, {
        date: data.date,
        openingCash: data.openingCash,
        closingCash: data.closingCash
      });

      // Calcular la fecha en horario Colombia (UTC-5)
      // Si se provee fecha, parsearla; si no, calcular la fecha actual en Colombia
      // (new Date() en servidor UTC daría fecha incorrecta después de las 7 PM Colombia)
      let dateStr: string;
      if (data.date) {
        dateStr = parseLocalDate(data.date).toISOString().split('T')[0];
      } else {
        const nowColombia = new Date(new Date().getTime() - 5 * 60 * 60 * 1000);
        dateStr = nowColombia.toISOString().split('T')[0];
      }

      console.log(`🎯 Processing cash closing for Colombia date: ${dateStr}`);

      // Calcular rango del día usando UTC-5 Colombia correctamente
      const startOfDay = getStartOfDay(dateStr);
      const endOfDay = getEndOfDay(dateStr);

      console.log(`🕐 Date range (Colombia UTC-5): ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

      console.log(`🔍 Processing cash closing for date: ${startOfDay.toISOString()}`);

      // NOTA: Se permite múltiples cierres por día (diferentes turnos/sesiones)
      // Validación de cierre existente removida para permitir flexibilidad operativa
      
      // 1. Ventas del día - SOLO VENTAS PAGADAS
      const sales = await this.prisma.sale.findMany({
        where: { 
          date: { gte: startOfDay, lte: endOfDay },
          isPaid: true, // Solo ventas que han sido pagadas
        },
      });

      console.log(`📊 Found ${sales.length} PAID sales for the day`);

      const totalSales = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      
      // SOLO ventas en efectivo Y pagadas afectan la caja física
      const cashSales = sales
        .filter((s) => s.paymentMethod === 'Efectivo' && s.isPaid)
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
        
      const cardSales = sales
        .filter((s) => s.paymentMethod === 'Tarjeta' && s.isPaid)
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
        
      const transferSales = sales
        .filter((s) => s.paymentMethod === 'Transferencia' && s.isPaid)
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
        
      // Ventas a crédito NO afectan el efectivo en caja
      const creditSales = sales
        .filter((s) => s.paymentMethod === 'Crédito' || !s.isPaid)
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

      console.log(`💰 Sales breakdown:
        - Total Sales: $${totalSales}
        - Cash Sales (affects physical cash): $${cashSales}
        - Card Sales: $${cardSales}
        - Transfer Sales: $${transferSales}
        - Credit Sales (no cash impact): $${creditSales}
      `);

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
      include: {
        supplier: {
          select: {
            name: true
          }
        }
      }
    });
    const totalPayments = payments.reduce(
      (sum, p) => sum + (p.paidAmount || 0),
      0,
    );      console.log(`🏪 Found ${payments.length} supplier payments totaling: $${totalPayments}`);

      // 4. Ingresos extra del día (desde el DTO o 0)
      const totalIncome = data.totalIncome || 0;

      // 5. Cálculo CORRECTO de caja según sistema
      // FÓRMULA: Saldo Inicial + Ventas (Efectivo + Tarjeta + Transferencia) + Ingresos Extra - Gastos - Pagos a Proveedores
      const systemCash = Number((
        (data.openingCash || 0) +        // Dinero con que se abrió la caja
        cashSales +                      // Ventas en efectivo
        cardSales +                      // Ventas con tarjeta
        transferSales +                  // Ventas por transferencia
        (data.totalIncome || 0) -        // Ingresos extra (opcional)
        totalExpense -                   // Gastos del día
        totalPayments                    // Pagos hechos a proveedores
      ).toFixed(2));

      // 6. Diferencia: Dinero real contado - Dinero que debería haber según sistema
      const difference = Number(((data.closingCash || 0) - systemCash).toFixed(2));

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

      // Validaciones y alertas mejoradas
      const alerts: Array<{level: string, message: string, recommendation: string}> = [];
      const absDifference = Math.abs(difference);
      
      if (absDifference > 100000) { // Diferencia crítica > $100,000
        console.error(`🚨 CRITICAL: Huge cash difference detected: $${difference}`);
        alerts.push({
          level: 'CRITICAL',
          message: `Diferencia crítica de $${difference.toLocaleString()}. Revisar inmediatamente.`,
          recommendation: 'Verificar conteo de dinero y transacciones del día'
        });
      } else if (absDifference > 50000) { // Diferencia importante > $50,000
        console.warn(`⚠️ WARNING: Large cash difference detected: $${difference}`);
        alerts.push({
          level: 'WARNING',
          message: `Diferencia significativa de $${difference.toLocaleString()}`,
          recommendation: 'Revisar cálculos y conteo de efectivo'
        });
      } else if (absDifference > 10000) { // Diferencia menor > $10,000
        console.log(`ℹ️ INFO: Minor cash difference: $${difference}`);
        alerts.push({
          level: 'INFO',
          message: `Diferencia menor de $${difference.toLocaleString()}`,
          recommendation: 'Verificar conteo si es necesario'
        });
      }

      // Log de alertas
      if (alerts.length > 0) {
        console.log('🔔 Generated alerts:', alerts);
      }

      // Guarda el cierre
      // NOTA: Agregamos milisegundos únicos para permitir múltiples cierres por día
      const uniqueTimestamp = new Date(startOfDay);
      uniqueTimestamp.setMilliseconds(new Date().getMilliseconds());
      
      const cashClosing = await this.prisma.cashClosing.create({
        data: {
          date: uniqueTimestamp, // Usa timestamp único en lugar de startOfDay
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
    console.log('🔍 findAll called with filters:', { dateFrom, dateTo });
    
    const where: any = {};
    
    if (dateFrom || dateTo) {
      where.date = {};
      
      if (dateFrom) {
        // Crear fecha inicio del día en zona local
        const [year, month, day] = dateFrom.split('-').map(Number);
        const fromDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        where.date.gte = fromDate;
        console.log('📅 Date from (local):', fromDate.toISOString());
      }
      
      if (dateTo) {
        // Crear fecha fin del día en zona local
        const [year, month, day] = dateTo.split('-').map(Number);
        const toDate = new Date(year, month - 1, day, 23, 59, 59, 999);
        where.date.lte = toDate;
        console.log('📅 Date to (local):', toDate.toISOString());
      }
    }

    const result = await this.prisma.cashClosing.findMany({
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

    console.log(`📊 Found ${result.length} cash closings`);
    return result;
  }

  async findOne(id: number) {
    return this.prisma.cashClosing.findUnique({ where: { id } });
  }

  async getSummary(date?: string) {
    let targetDate: Date;
    
    // Manejo mejorado de fechas
    if (date) {
      console.log('📅 getSummary called with date:', date);
      
      if (date.includes('T')) {
        // Si viene con hora, usar directamente
        targetDate = new Date(date);
      } else {
        // Si es solo fecha (YYYY-MM-DD), crear explícitamente en local
        const [year, month, day] = date.split('-').map(Number);
        targetDate = new Date(year, month - 1, day, 12, 0, 0, 0); // Usar mediodía
      }
    } else {
      targetDate = new Date();
    }
    
    // Calcular rango del día usando UTC-5 (Colombia) para que funcione
    // correctamente en servidores UTC (Railway) y con horario de Colombia
    const dateStr = targetDate.toISOString().split('T')[0];
    const startOfDay = getStartOfDay(dateStr);
    const endOfDay = getEndOfDay(dateStr);

    console.log('🎯 Target date:', dateStr);
    console.log('🕐 Date range (Colombia UTC-5):', { 
      start: startOfDay.toISOString(), 
      end: endOfDay.toISOString() 
    });

    // 1. Todas las ventas del día (separando pagadas de no pagadas)
    const allSales = await this.prisma.sale.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    const paidSales = allSales.filter(s => s.isPaid);
    const unpaidSales = allSales.filter(s => !s.isPaid);

    console.log(`📊 Sales summary: ${allSales.length} total (${paidSales.length} paid, ${unpaidSales.length} unpaid)`);

    const totalSales = allSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    
    // SOLO ventas PAGADAS en efectivo afectan la caja física
    const cashSales = paidSales
      .filter((s) => s.paymentMethod === 'Efectivo')
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      
    const cardSales = paidSales
      .filter((s) => s.paymentMethod === 'Tarjeta')
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      
    const transferSales = paidSales
      .filter((s) => s.paymentMethod === 'Transferencia')
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      
    // Crédito incluye ventas marcadas como crédito O ventas no pagadas
    const creditSales = allSales
      .filter((s) => s.paymentMethod === 'Crédito' || !s.isPaid)
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

    console.log(`💰 Summary breakdown:
      - Total Sales: $${totalSales}
      - Cash Sales (paid): $${cashSales}
      - Card Sales (paid): $${cardSales}
      - Transfer Sales (paid): $${transferSales}
      - Credit Sales (unpaid): $${creditSales}
    `);

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
      include: {
        supplier: {
          select: {
            name: true
          }
        }
      }
    });
    const totalPayments = payments.reduce(
      (sum, p) => sum + (p.paidAmount || 0),
      0,
    );

    // 4. Ingresos extra
    const totalIncome = 0; // Si tienes modelo, ajusta aquí

    // Caja según sistema (FÓRMULA CORRECTA para mostrar en resumen)
    // NOTA: Aquí NO incluimos saldo inicial porque eso lo ingresa el usuario
    // Incluye efectivo, tarjeta y transferencias (todos los pagos recibidos excepto crédito)
    const systemCashBase = Number((cashSales + cardSales + transferSales + totalIncome - totalExpense - totalPayments).toFixed(2));

    const result = {
      fecha: startOfDay.toISOString().split('T')[0],
      totalSales: Number(totalSales.toFixed(2)),
      cashSales: Number(cashSales.toFixed(2)),
      cardSales: Number(cardSales.toFixed(2)),
      transferSales: Number(transferSales.toFixed(2)),
      creditSales: Number(creditSales.toFixed(2)),
      totalExpense: Number(totalExpense.toFixed(2)),
      totalPayments: Number(totalPayments.toFixed(2)),
      totalIncome: Number(totalIncome.toFixed(2)),
      systemCash: systemCashBase,
      // NUEVO: Detalle de transacciones individuales
      salesDetail: allSales.map(sale => ({
        id: sale.id,
        totalAmount: sale.totalAmount,
        paymentMethod: sale.paymentMethod,
        isPaid: sale.isPaid,
        createdAt: sale.createdAt,
        customerName: sale.customerName || 'Cliente general',
        // Si tienes relación con items, agregar aquí
      })),
      expensesDetail: expenses.map(expense => ({
        id: expense.id,
        amount: expense.amount,
        description: expense.description,
        date: expense.date,
        createdAt: expense.createdAt,
      })),
      paymentsDetail: payments.map(payment => ({
        id: payment.id,
        amount: payment.paidAmount || 0,
        supplierName: payment.supplier?.name || 'Proveedor',
        description: `Pago a ${payment.supplier?.name || 'proveedor'} - $${(payment.paidAmount || 0).toFixed(2)}`,
        date: payment.date,
        createdAt: payment.createdAt,
      })),
      // Información adicional para el frontend
      explanation: {
        formula: "Saldo Inicial + Ventas (Efectivo + Tarjeta + Transferencia) + Ingresos Extra - Gastos - Pagos Proveedores",
        note: "El saldo inicial se ingresa manualmente en el formulario. Se incluyen todas las ventas pagadas excepto crédito."
      }
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
      // Usar Colombia UTC-5 para calcular "hoy" y "ayer" correctamente
      const { startOfDay: todayStart, endOfDay: todayEnd } = todayRangeColombia();

      // Calcular "ayer" en horario Colombia: restar 24h al inicio de hoy
      const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayEnd = new Date(todayEnd.getTime() - 24 * 60 * 60 * 1000);

      // Obtener el último cierre
      const lastClosing = await this.prisma.cashClosing.findFirst({
        orderBy: { date: 'desc' },
      });

      // Obtener ventas de hoy (rango Colombia)
      const todaySales = await this.prisma.sale.findMany({
        where: {
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      });

      const totalSalesToday = todaySales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

      const alerts: any[] = [];

      // Verificar cierre faltante de ayer
      if (!lastClosing || lastClosing.date < yesterdayStart) {
        alerts.push({
          type: 'missing_closing',
          severity: 'error',
          message: 'Falta registrar cierre de caja de ayer',
          data: { missingDate: yesterdayStart.toISOString().split('T')[0] },
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

      // Recordatorio de cierre diario (después de las 6 PM hora Colombia)
      const nowColombia = new Date(new Date().getTime() - 5 * 60 * 60 * 1000);
      const currentHourColombia = nowColombia.getUTCHours();
      if (currentHourColombia >= 18 && totalSalesToday > 0 && (!lastClosing || lastClosing.date < todayStart)) {
        alerts.push({
          type: 'daily_reminder',
          severity: 'info',
          message: `Hora de cerrar caja. Ventas del día: $${totalSalesToday.toLocaleString()}`,
          data: { sales: totalSalesToday },
        });
      }

      // Múltiples días sin cierre
      if (lastClosing) {
        const daysDiff = Math.floor((todayStart.getTime() - lastClosing.date.getTime()) / (1000 * 60 * 60 * 24));
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

  // Eliminar cierre de caja
  async delete(id: number, userId?: number) {
    try {
      console.log(`🗑️ Deleting cash closing with ID: ${id}`);
      
      // Verificar que existe
      const existing = await this.prisma.cashClosing.findUnique({
        where: { id },
        include: {
          createdBy: {
            select: { username: true, name: true }
          }
        }
      });

      if (!existing) {
        throw new BadRequestException(`No se encontró el cierre con ID: ${id}`);
      }

      console.log(`📋 Deleting closing:`, {
        id: existing.id,
        date: existing.date.toLocaleDateString(),
        difference: existing.difference,
        user: existing.createdBy?.name || 'Sistema'
      });

      // Eliminar el cierre
      const deleted = await this.prisma.cashClosing.delete({
        where: { id }
      });

      console.log(`✅ Cash closing deleted successfully`);
      
      return {
        success: true,
        message: `Cierre del ${existing.date.toLocaleDateString()} eliminado correctamente`,
        data: deleted
      };

    } catch (error) {
      console.error('❌ Error deleting cash closing:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error al eliminar cierre: ${error.message}`);
    }
  }

  // Actualizar cierre de caja
  async update(id: number, data: CreateCashClosingDto, userId?: number) {
    try {
      console.log(`📝 Updating cash closing with ID: ${id}`, data);
      
      // Verificar que existe
      const existing = await this.prisma.cashClosing.findUnique({
        where: { id }
      });

      if (!existing) {
        throw new BadRequestException(`No se encontró el cierre con ID: ${id}`);
      }

      // Recalcular los valores con la nueva fecha si cambió
      let targetDate = existing.date;
      if (data.date && data.date !== existing.date.toISOString().split('T')[0]) {
        // Si cambió la fecha, usar la nueva
        const [year, month, day] = data.date.split('-').map(Number);
        targetDate = new Date(year, month - 1, day, 12, 0, 0, 0);
      }

      // Obtener datos para recálculo
      const summary = await this.calculateDaySummary(targetDate);
      
      // Calcular caja sistema actualizada
      const systemCash = (data.openingCash || 0) + 
                        summary.cashSales + 
                        (data.totalIncome || 0) - 
                        summary.totalExpense - 
                        summary.totalPayments;

      const difference = (data.closingCash || 0) - systemCash;

      console.log(`💰 Updated calculation:`, {
        systemCash,
        difference,
        previousDifference: existing.difference
      });

      // Actualizar el cierre
      const updated = await this.prisma.cashClosing.update({
        where: { id },
        data: {
          date: targetDate,
          openingCash: data.openingCash || 0,
          closingCash: data.closingCash || 0,
          systemCash: Number(systemCash.toFixed(2)),
          difference: Number(difference.toFixed(2)),
          totalSales: summary.totalSales,
          cashSales: summary.cashSales,
          cardSales: summary.cardSales,
          transferSales: summary.transferSales,
          creditSales: summary.creditSales,
          totalIncome: Number((data.totalIncome || 0).toFixed(2)),
          totalExpense: summary.totalExpense,
          totalPayments: summary.totalPayments,
          notes: data.notes || existing.notes,
        }
      });

      console.log(`✅ Cash closing updated successfully`);
      return updated;

    } catch (error) {
      console.error('❌ Error updating cash closing:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error al actualizar cierre: ${error.message}`);
    }
  }

  // Método auxiliar para calcular resumen del día
  private async calculateDaySummary(date: Date) {
    // Obtener el string de fecha en UTC y usar startOfDay/endOfDay con offset Colombia
    // Nota: 'date' suele ser mediodía Colombia (17 UTC), por lo que .split('T')[0] da el día correcto
    const dateStr = date.toISOString().split('T')[0];
    const startOfDay = getStartOfDay(dateStr);
    const endOfDay = getEndOfDay(dateStr);

    // Ventas del día
    const sales = await this.prisma.sale.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay } },
    });

    const totalSales = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const cashSales = sales.filter((s) => s.paymentMethod === 'Efectivo').reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const cardSales = sales.filter((s) => s.paymentMethod === 'Tarjeta').reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const transferSales = sales.filter((s) => s.paymentMethod === 'Transferencia').reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const creditSales = sales.filter((s) => s.paymentMethod === 'Crédito' || s.isPaid === false).reduce((sum, s) => sum + (s.totalAmount || 0), 0);

    // Gastos del día
    const expenses = await this.prisma.expense.findMany({
      where: { 
        date: { gte: startOfDay, lte: endOfDay },
        deletedAt: null 
      },
    });
    const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Pagos a proveedores del día
    const payments = await this.prisma.purchase.findMany({
      where: { 
        date: { gte: startOfDay, lte: endOfDay }, 
        isPaid: true 
      },
      include: {
        supplier: {
          select: {
            name: true
          }
        }
      }
    });
    const totalPayments = payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);

    return {
      totalSales: Number(totalSales.toFixed(2)),
      cashSales: Number(cashSales.toFixed(2)),
      cardSales: Number(cardSales.toFixed(2)),
      transferSales: Number(transferSales.toFixed(2)),
      creditSales: Number(creditSales.toFixed(2)),
      totalExpense: Number(totalExpense.toFixed(2)),
      totalPayments: Number(totalPayments.toFixed(2))
    };
  }
}

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseLocalDate, startOfDay, endOfDay, todayRangeColombia } from '../common/utils/timezone.util';

export interface OpenCashSessionDto {
  openingCash: number;
  notes?: string;
  date?: string; // Opcional, por defecto hoy
}

export interface CloseCashSessionDto {
  closingCash: number;
  notes?: string;
}

@Injectable()
export class CashSessionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Abrir nueva sesión de caja
   */
  async openCashSession(data: OpenCashSessionDto, userId?: number) {
    try {
      // Si no hay fecha explícita, calcular la fecha actual en hora Colombia (UTC-5)
      // Usar new Date() en server UTC daría la fecha incorrecta después de las 7 PM Colombia
      let dateOnly: string;
      if (data.date) {
        dateOnly = parseLocalDate(data.date).toISOString().split('T')[0];
      } else {
        // Restar 5 horas para obtener la fecha en Colombia
        const nowColombia = new Date(new Date().getTime() - 5 * 60 * 60 * 1000);
        dateOnly = nowColombia.toISOString().split('T')[0];
      }
      const startDay = startOfDay(dateOnly);
      const endDay = endOfDay(dateOnly);

      console.log(`🔓 Opening cash session for date: ${dateOnly}`);

      // Verificar si ya hay una sesión activa para la fecha
      const activeSession = await this.prisma.cashSession.findFirst({
        where: {
          date: {
            gte: startDay,
            lte: endDay
          },
          isActive: true
        }
      });

      if (activeSession) {
        throw new BadRequestException(
          `Ya existe una caja abierta para el ${dateOnly}. ` +
          `Sesión #${activeSession.sessionNumber} abierta a las ${activeSession.openedAt.toLocaleTimeString()}`
        );
      }

      // Determinar el número de sesión del día
      const lastSessionOfDay = await this.prisma.cashSession.findFirst({
        where: {
          date: {
            gte: startDay,
            lte: endDay
          }
        },
        orderBy: { sessionNumber: 'desc' }
      });

      const sessionNumber = (lastSessionOfDay?.sessionNumber || 0) + 1;

      // Crear nueva sesión
      const newSession = await this.prisma.cashSession.create({
        data: {
          sessionNumber,
          date: startDay,
          openingCash: data.openingCash,
          notes: data.notes,
          openedById: userId,
          isActive: true
        },
        include: {
          openedBy: {
            select: { id: true, name: true, username: true }
          }
        }
      });

      console.log(`✅ Cash session #${sessionNumber} opened successfully`);

      return {
        success: true,
        session: newSession,
        message: `Caja #${sessionNumber} abierta con $${data.openingCash.toLocaleString()}`
      };

    } catch (error) {
      console.error('❌ Error opening cash session:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error al abrir caja: ${error.message}`);
    }
  }

  /**
   * Cerrar sesión de caja activa
   */
  async closeCashSession(data: CloseCashSessionDto, userId?: number) {
    try {
      // Buscar sesión activa
      const activeSession = await this.prisma.cashSession.findFirst({
        where: { isActive: true },
        include: {
          openedBy: { select: { name: true } },
          sales: { where: { isPaid: true } },
          expenses: { where: { deletedAt: null } }
        }
      });

      if (!activeSession) {
        throw new BadRequestException('No hay ninguna caja abierta para cerrar');
      }

      // Calcular estadísticas de la sesión
      const totalSales = activeSession.sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const cashSales = activeSession.sales
        .filter(sale => sale.paymentMethod === 'Efectivo')
        .reduce((sum, sale) => sum + sale.totalAmount, 0);
      
      const totalExpenses = activeSession.expenses.reduce((sum, expense) => sum + expense.amount, 0);

      // Efectivo esperado = Inicial + Ventas en efectivo - Gastos
      const expectedCash = activeSession.openingCash + cashSales - totalExpenses;
      const difference = data.closingCash - expectedCash;

      // SOLUCIÓN SIMPLE: Primero marcar como inactiva, luego actualizar otros campos
      // Esto evita el problema del constraint unique
      await this.prisma.cashSession.update({
        where: { id: activeSession.id },
        data: { isActive: false }
      });

      // Ahora actualizar el resto de la información
      const closedSession = await this.prisma.cashSession.update({
        where: { id: activeSession.id },
        data: {
          closedAt: new Date(),
          closingCash: data.closingCash,
          closedById: userId,
          notes: data.notes
        },
        include: {
          openedBy: { select: { name: true } },
          closedBy: { select: { name: true } }
        }
      });

      console.log(`🔒 Cash session #${activeSession.sessionNumber} closed successfully`);

      return {
        success: true,
        session: closedSession,
        statistics: {
          duration: Math.round((new Date().getTime() - activeSession.openedAt.getTime()) / (1000 * 60 * 60)), // horas
          totalSales,
          cashSales,
          totalExpenses,
          expectedCash,
          actualCash: data.closingCash,
          difference,
          salesCount: activeSession.sales.length,
          expensesCount: activeSession.expenses.length
        },
        message: `Sesión #${activeSession.sessionNumber} cerrada. Diferencia: $${difference.toLocaleString()}`
      };

    } catch (error) {
      console.error('❌ Error closing cash session:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error al cerrar caja: ${error.message}`);
    }
  }

  /**
   * Obtener sesión activa actual
   */
  async getActiveSession() {
    const activeSession = await this.prisma.cashSession.findFirst({
      where: { isActive: true },
      include: {
        openedBy: { select: { id: true, name: true, username: true } },
        sales: { 
          where: { isPaid: true },
          include: {
            details: {
              include: {
                product: { select: { name: true } }
              }
            }
          }
        },
        expenses: { 
          where: { deletedAt: null },
          select: { id: true, amount: true, description: true, category: true }
        }
      }
    });

    if (!activeSession) {
      return { success: false, session: null, message: 'No hay caja abierta' };
    }

    // Calcular estadísticas en tiempo real
    const totalSales = activeSession.sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const cashSales = activeSession.sales
      .filter(sale => sale.paymentMethod === 'Efectivo')
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
    
    const totalExpenses = activeSession.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const expectedCash = activeSession.openingCash + cashSales - totalExpenses;

    return {
      success: true,
      session: activeSession,
      statistics: {
        duration: Math.round((new Date().getTime() - activeSession.openedAt.getTime()) / (1000 * 60)), // minutos
        totalSales,
        cashSales,
        totalExpenses,
        expectedCash,
        salesCount: activeSession.sales.length,
        expensesCount: activeSession.expenses.length
      }
    };
  }

  /**
   * Listar sesiones con filtros
   */
  async getSessions(dateFrom?: string, dateTo?: string, includeActive = true) {
    const where: any = {};
    
    if (!includeActive) {
      where.isActive = false;
    }
    
    if (dateFrom || dateTo) {
      where.date = {};
      
      if (dateFrom) {
        where.date.gte = startOfDay(dateFrom);
      }
      
      if (dateTo) {
        where.date.lte = endOfDay(dateTo);
      }
    }

    const sessions = await this.prisma.cashSession.findMany({
      where,
      orderBy: [
        { date: 'desc' },
        { sessionNumber: 'desc' }
      ],
      include: {
        openedBy: { select: { name: true } },
        closedBy: { select: { name: true } },
        _count: {
          select: {
            sales: true,
            expenses: true
          }
        }
      }
    });

    return sessions;
  }

  /**
   * MÉTODO DE EMERGENCIA: Forzar cierre de todas las sesiones activas
   * Útil para resolver problemas de sesiones que quedaron abiertas incorrectamente
   */
  async forceCloseAllActiveSessions() {
    try {
      const activeSessions = await this.prisma.cashSession.findMany({
        where: { isActive: true }
      });

      if (activeSessions.length === 0) {
        return {
          success: true,
          message: 'No hay sesiones activas para cerrar',
          closedCount: 0
        };
      }

      console.log(`🚨 FORZANDO CIERRE DE ${activeSessions.length} SESIÓN(ES) ACTIVA(S)`);

      // Cerrar cada sesión individualmente para evitar problemas de constraints
      let closedCount = 0;
      const closedSessionsInfo: Array<{
        id: number;
        sessionNumber: number;
        date: Date;
        openingCash: number;
      }> = [];

      for (const session of activeSessions) {
        try {
          await this.prisma.cashSession.update({
            where: { id: session.id },
            data: {
              isActive: false,
              closedAt: new Date(),
              notes: '[CIERRE FORZADO] - Sesión cerrada manualmente por el sistema'
            }
          });
          
          closedCount++;
          closedSessionsInfo.push({
            id: session.id,
            sessionNumber: session.sessionNumber,
            date: session.date,
            openingCash: session.openingCash
          });
          
          console.log(`✅ Sesión #${session.sessionNumber} cerrada`);
        } catch (error) {
          console.error(`❌ Error cerrando sesión #${session.sessionNumber}:`, error.message);
        }
      }

      console.log(`✅ ${closedCount} sesión(es) cerrada(s) exitosamente`);

      return {
        success: true,
        message: `${closedCount} sesión(es) de caja cerrada(s) exitosamente`,
        closedCount,
        closedSessions: closedSessionsInfo
      };

    } catch (error) {
      console.error('❌ Error forzando cierre de sesiones:', error);
      throw new BadRequestException(`Error al forzar cierre: ${error.message}`);
    }
  }

  /**
   * Generar reporte PDF de la sesión
   */
  async getSessionReportData(sessionId: number) {
    const session = await this.prisma.cashSession.findUnique({
      where: { id: sessionId },
      include: {
        openedBy: { select: { name: true } },
        closedBy: { select: { name: true } },
        sales: {
          include: {
            client: { select: { name: true } },
            details: {
              include: {
                product: { select: { name: true, sku: true } }
              }
            }
          }
        },
        expenses: {
          where: { deletedAt: null }
        }
      }
    });

    if (!session) {
      throw new NotFoundException(`Sesión de caja #${sessionId} no encontrada`);
    }

    return session;
  }
}
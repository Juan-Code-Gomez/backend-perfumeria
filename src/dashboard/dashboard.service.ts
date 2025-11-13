import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CapitalService } from '../capital/capital.service';
import { InvoiceService } from '../invoice/invoice.service';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, subDays, format } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private capitalService: CapitalService,
    private invoiceService: InvoiceService,
  ) {}

  async getExecutiveSummary() {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    // Mes anterior para comparaciones
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    
    // Últimos 7 y 30 días para tendencias
    const last7Days = subDays(now, 7);
    const last30Days = subDays(now, 30);

    // 🔥 MÉTRICAS PRINCIPALES
    const [
      salesToday,
      salesMonth,
      salesLastMonth,
      expensesToday,
      expensesMonth,
      expensesLastMonth,
      pendingPurchases,
      creditSales,
      topProducts,
      salesTrend,
      cashClosingToday,
      allProducts,
      capitalData,
      invoiceSummary
    ] = await Promise.all([
      // Ventas de hoy
      this.prisma.sale.findMany({
        where: { date: { gte: todayStart, lte: todayEnd } },
        include: { details: { include: { product: true } } },
      }),
      
      // Ventas del mes
      this.prisma.sale.findMany({
        where: { date: { gte: monthStart, lte: monthEnd } },
        include: { details: { include: { product: true } } },
      }),
      
      // Ventas mes anterior
      this.prisma.sale.findMany({
        where: { date: { gte: lastMonthStart, lte: lastMonthEnd } },
      }),
      
      // Gastos de hoy
      this.prisma.expense.findMany({
        where: { 
          date: { gte: todayStart, lte: todayEnd },
          deletedAt: null 
        },
      }),
      
      // Gastos del mes
      this.prisma.expense.findMany({
        where: { 
          date: { gte: monthStart, lte: monthEnd },
          deletedAt: null 
        },
      }),
      
      // Gastos mes anterior
      this.prisma.expense.findMany({
        where: { 
          date: { gte: lastMonthStart, lte: lastMonthEnd },
          deletedAt: null 
        },
      }),
      
      // Deudas a proveedores
      this.prisma.purchase.findMany({
        where: { isPaid: false },
        include: { supplier: true },
      }),
      
      // Ventas a crédito pendientes
      this.prisma.sale.findMany({
        where: { isPaid: false },
        include: { client: true },
      }),
      
      // Productos más vendidos (último mes)
      this.prisma.saleDetail.findMany({
        where: {
          sale: { date: { gte: last30Days } }
        },
        include: { product: true },
      }),
      
      // Tendencia de ventas (últimos 7 días)
      this.prisma.sale.findMany({
        where: { date: { gte: last7Days } },
        orderBy: { date: 'asc' },
      }),
      
      // Cierre de caja de hoy
      this.prisma.cashClosing.findFirst({
        where: { 
          date: { gte: todayStart, lte: todayEnd }
        },
      }),
      
      // Todos los productos para calcular inversión total
      this.prisma.product.findMany({
        select: {
          id: true,
          name: true,
          stock: true,
          purchasePrice: true,
        }
      }),
      
      // Capital actual (efectivo y banco)
      this.capitalService.getCapitalSummary(),
      
      // Resumen de facturas
      this.invoiceService.getInvoiceSummary(),
    ]);

    // 💰 CÁLCULOS PRINCIPALES
    const totalSalesToday = salesToday.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalSalesMonth = salesMonth.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalSalesLastMonth = salesLastMonth.reduce((sum, s) => sum + s.totalAmount, 0);
    
    const totalExpensesToday = expensesToday.reduce((sum, e) => sum + e.amount, 0);
    const totalExpensesMonth = expensesMonth.reduce((sum, e) => sum + e.amount, 0);
    const totalExpensesLastMonth = expensesLastMonth.reduce((sum, e) => sum + e.amount, 0);
    
    // 💼 INVERSIÓN TOTAL EN PRODUCTOS
    const totalInvestment = allProducts.reduce((sum, product) => {
      return sum + (product.stock * product.purchasePrice);
    }, 0);
    
    // 🏆 UTILIDAD NETA
    const profitToday = totalSalesToday - totalExpensesToday;
    const profitMonth = totalSalesMonth - totalExpensesMonth;
    const profitLastMonth = totalSalesLastMonth - totalExpensesLastMonth;
    
    // 📈 CRECIMIENTO
    const salesGrowth = totalSalesLastMonth > 0 ? 
      ((totalSalesMonth - totalSalesLastMonth) / totalSalesLastMonth) * 100 : 0;
    const expenseGrowth = totalExpensesLastMonth > 0 ? 
      ((totalExpensesMonth - totalExpensesLastMonth) / totalExpensesLastMonth) * 100 : 0;
    
    // 💸 DEUDAS Y CRÉDITOS
    const debtToSuppliers = pendingPurchases.reduce(
      (sum, p) => sum + (p.totalAmount - (p.paidAmount || 0)), 0
    );
    const creditFromClients = creditSales.reduce(
      (sum, s) => sum + (s.totalAmount - (s.paidAmount || 0)), 0
    );
    
    // 🏆 TOP PRODUCTOS
    const productSales = new Map();
    topProducts.forEach(detail => {
      const productId = detail.product.id;
      if (productSales.has(productId)) {
        productSales.get(productId).quantity += detail.quantity;
      } else {
        productSales.set(productId, {
          product: detail.product,
          quantity: detail.quantity,
          revenue: detail.quantity * detail.unitPrice
        });
      }
    });
    
    const topSellingProducts = Array.from(productSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
    
    // 📊 TENDENCIA DE VENTAS (últimos 7 días)
    const salesByDay: Array<{
      date: string;
      day: string;
      sales: number;
      transactions: number;
    }> = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(now, i);
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      const daySales = salesTrend.filter(s => 
        s.date >= dayStart && s.date <= dayEnd
      );
      
      salesByDay.push({
        date: format(day, 'yyyy-MM-dd'),
        day: format(day, 'EEE'),
        sales: daySales.reduce((sum, s) => sum + s.totalAmount, 0),
        transactions: daySales.length
      });
    }
    
    // 💳 MÉTODOS DE PAGO (mes actual)
    const paymentMethods = {
      efectivo: salesMonth.filter(s => s.paymentMethod === 'Efectivo' && s.isPaid).reduce((sum, s) => sum + s.totalAmount, 0),
      tarjeta: salesMonth.filter(s => s.paymentMethod === 'Tarjeta' && s.isPaid).reduce((sum, s) => sum + s.totalAmount, 0),
      transferencia: salesMonth.filter(s => s.paymentMethod === 'Transferencia' && s.isPaid).reduce((sum, s) => sum + s.totalAmount, 0),
      credito: salesMonth.filter(s => s.paymentMethod === 'Crédito' || !s.isPaid).reduce((sum, s) => sum + s.totalAmount, 0)
    };
    
    // 🚨 ALERTAS
    const alerts: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      message: string;
      data?: any;
    }> = [];
    
    // Stock bajo - Usar SQL raw para comparar columnas
    const lowStockProducts = await this.prisma.$queryRaw<Array<{
      id: number;
      name: string;
      stock: number;
      minStock: number;
    }>>`
      SELECT id, name, stock, "minStock"
      FROM "Product"
      WHERE "minStock" IS NOT NULL
        AND stock <= "minStock"
      ORDER BY stock ASC
      LIMIT 5
    `;
    
    if (lowStockProducts.length > 0) {
      alerts.push({
        type: 'stock',
        severity: 'high',
        message: `${lowStockProducts.length} productos con stock bajo`,
        data: lowStockProducts
      });
    }
    
    // Créditos vencidos (más de 30 días)
    const oldCredits = creditSales.filter(s => {
      const daysDiff = (now.getTime() - s.date.getTime()) / (1000 * 3600 * 24);
      return daysDiff > 30;
    });
    
    if (oldCredits.length > 0) {
      alerts.push({
        type: 'credits',
        severity: 'medium',
        message: `${oldCredits.length} créditos vencidos`,
        data: oldCredits.slice(0, 5)
      });
    }
    
    // Día sin cerrar caja
    if (!cashClosingToday) {
      alerts.push({
        type: 'cash_closing',
        severity: 'medium',
        message: 'No se ha realizado el cierre de caja de hoy'
      });
    }

    return {
      // 🎯 KPIs PRINCIPALES
      kpis: {
        today: {
          sales: totalSalesToday,
          expenses: totalExpensesToday,
          profit: profitToday,
          transactions: salesToday.length,
          cashInRegister: cashClosingToday?.closingCash || 0
        },
        month: {
          sales: totalSalesMonth,
          expenses: totalExpensesMonth,
          profit: profitMonth,
          transactions: salesMonth.length,
          salesGrowth,
          expenseGrowth
        },
        year: {
          // TODO: Implementar métricas anuales
        }
      },
      
      // 📊 GRÁFICOS
      charts: {
        salesTrend: salesByDay,
        topProducts: topSellingProducts,
        paymentMethods,
        expensesByCategory: expensesMonth.reduce((acc, exp) => {
          acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
          return acc;
        }, {})
      },
      
      // 💰 FINANZAS
      finances: {
        investment: {
          totalInvestment,
          totalProducts: allProducts.length,
          totalUnits: allProducts.reduce((sum, p) => sum + p.stock, 0)
        },
        capital: {
          cash: capitalData?.cash || 0,
          bank: capitalData?.bank || 0,
          total: capitalData?.total || 0,
          lastUpdate: capitalData?.lastUpdate || null
        },
        cashFlow: {
          income: totalSalesMonth,
          expenses: totalExpensesMonth,
          netFlow: profitMonth
        },
        accounts: {
          receivable: creditFromClients,
          payable: debtToSuppliers,
          netPosition: creditFromClients - debtToSuppliers
        },
        invoices: {
          total: invoiceSummary?.total?.amount || 0,
          pending: invoiceSummary?.pending?.pending || 0,
          overdue: invoiceSummary?.overdue?.pending || 0,
          count: {
            total: invoiceSummary?.total?.count || 0,
            pending: invoiceSummary?.pending?.count || 0,
            overdue: invoiceSummary?.overdue?.count || 0
          }
        }
      },
      
      // 🚨 ALERTAS
      alerts,
      
      // 📅 METADATA
      metadata: {
        generatedAt: now.toISOString(),
        period: {
          today: format(now, 'yyyy-MM-dd'),
          month: format(now, 'yyyy-MM'),
          lastUpdate: now
        }
      }
    };
  }
}

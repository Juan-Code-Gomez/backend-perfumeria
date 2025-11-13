import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay, endOfDay } from '../common/utils/timezone.util';

export interface MonthlySummary {
  month: string;
  year: number;
  totalSales: number;
  totalExpenses: number;
  totalPayments: number;
  netProfit: number;
  dailyClosings: Array<{
    date: string;
    totalSales: number;
    difference: number;
    openingCash: number;
    closingCash: number;
  }>;
  salesByMethod: Array<{
    method: string;
    amount: number;
    percentage: number;
  }>;
  topProducts: Array<{
    productId: number;
    productName: string;
    productCode: string;
    quantitySold: number;
    totalRevenue: number;
  }>;
  expensesByCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

@Injectable()
export class MonthlyClosingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generar cierre mensual
   */
  async generateMonthlyClosing(year: number, month: number): Promise<MonthlySummary> {
    try {
      console.log(`📊 Generating monthly closing for ${year}-${month.toString().padStart(2, '0')}`);

      // Calcular fechas del mes
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      console.log(`📅 Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

      // 1. Obtener todos los cierres diarios del mes
      const dailyClosings = await this.prisma.cashClosing.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { date: 'asc' }
      });

      console.log(`📋 Found ${dailyClosings.length} daily closings for the month`);

      // 2. Calcular totales del mes
      const monthlyTotals = dailyClosings.reduce(
        (acc, closing) => {
          acc.totalSales += closing.totalSales;
          acc.totalExpenses += closing.totalExpense;
          acc.totalPayments += closing.totalPayments;
          return acc;
        },
        { totalSales: 0, totalExpenses: 0, totalPayments: 0 }
      );

      const netProfit = monthlyTotals.totalSales - monthlyTotals.totalExpenses - monthlyTotals.totalPayments;

      // 3. Obtener ventas por método de pago del mes
      const salesByMethodRaw = await this.prisma.sale.groupBy({
        by: ['paymentMethod'],
        where: {
          date: { gte: startDate, lte: endDate },
          isPaid: true
        },
        _sum: { totalAmount: true }
      });

      const salesByMethod = salesByMethodRaw.map(item => ({
        method: item.paymentMethod || 'No especificado',
        amount: item._sum.totalAmount || 0,
        percentage: ((item._sum.totalAmount || 0) / monthlyTotals.totalSales) * 100
      }));

      // 4. Top productos vendidos del mes
      const topProductsRaw = await this.prisma.saleDetail.groupBy({
        by: ['productId'],
        where: {
          sale: {
            date: { gte: startDate, lte: endDate },
            isPaid: true
          }
        },
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: 10
      });

      // Obtener información de productos
      const productIds = topProductsRaw.map(p => p.productId);
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, sku: true }
      });

      const topProducts = topProductsRaw.map(tp => {
        const product = products.find(p => p.id === tp.productId);
        return {
          productId: tp.productId,
          productName: product?.name || 'Desconocido',
          productCode: product?.sku || 'N/A',
          quantitySold: tp._sum.quantity || 0,
          totalRevenue: tp._sum.totalPrice || 0
        };
      });

      // 5. Gastos por categoría del mes
      const expensesByCategoryRaw = await this.prisma.expense.groupBy({
        by: ['category'],
        where: {
          date: { gte: startDate, lte: endDate },
          deletedAt: null
        },
        _sum: { amount: true }
      });

      const expensesByCategory = expensesByCategoryRaw.map(item => ({
        category: item.category,
        amount: item._sum.amount || 0,
        percentage: ((item._sum.amount || 0) / monthlyTotals.totalExpenses) * 100
      }));

      // 6. Preparar datos de cierres diarios
      const dailyClosingsData = dailyClosings.map(closing => ({
        date: closing.date.toISOString().split('T')[0],
        totalSales: closing.totalSales,
        difference: closing.difference,
        openingCash: closing.openingCash,
        closingCash: closing.closingCash
      }));

      const result: MonthlySummary = {
        month: startDate.toLocaleString('es-ES', { month: 'long' }),
        year,
        totalSales: monthlyTotals.totalSales,
        totalExpenses: monthlyTotals.totalExpenses,
        totalPayments: monthlyTotals.totalPayments,
        netProfit,
        dailyClosings: dailyClosingsData,
        salesByMethod,
        topProducts,
        expensesByCategory
      };

      console.log(`✅ Monthly closing generated successfully`);
      console.log(`📊 Summary: Sales: $${monthlyTotals.totalSales}, Net Profit: $${netProfit}`);

      return result;

    } catch (error) {
      console.error('❌ Error generating monthly closing:', error);
      throw new Error(`Error generando cierre mensual: ${error.message}`);
    }
  }

  /**
   * Generar PDF del cierre mensual
   */
  async generateMonthlyClosingPDF(year: number, month: number): Promise<Buffer> {
    try {
      const monthlyData = await this.generateMonthlyClosing(year, month);
      
      // Usar jsPDF para generar el PDF
      const jsPDF = require('jspdf');
      require('jspdf-autotable');
      
      const doc = new jsPDF();
      
      // === ENCABEZADO ===
      doc.setFontSize(20);
      doc.setTextColor(40);
      doc.text('CIERRE MENSUAL', 105, 25, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setTextColor(100);
      doc.text(`${monthlyData.month.toUpperCase()} ${monthlyData.year}`, 105, 35, { align: 'center' });
      doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 105, 42, { align: 'center' });

      // === RESUMEN EJECUTIVO ===
      doc.setFontSize(16);
      doc.setTextColor(40);
      doc.text('RESUMEN EJECUTIVO', 20, 60);
      
      const summaryData = [
        ['Total Ventas:', `$${monthlyData.totalSales.toLocaleString()}`],
        ['Total Gastos:', `$${monthlyData.totalExpenses.toLocaleString()}`],
        ['Total Pagos:', `$${monthlyData.totalPayments.toLocaleString()}`],
        ['Utilidad Neta:', `$${monthlyData.netProfit.toLocaleString()}`],
        ['Dias con Cierre:', monthlyData.dailyClosings.length.toString()],
        ['Promedio Ventas/Dia:', `$${Math.round(monthlyData.totalSales / monthlyData.dailyClosings.length || 0).toLocaleString()}`]
      ];

      doc.autoTable({
        startY: 70,
        head: [['Concepto', 'Valor']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [52, 152, 219] },
        margin: { left: 20, right: 20 }
      });

      // === VENTAS POR METODO DE PAGO ===
      let currentY = doc.lastAutoTable.finalY + 20;
      
      doc.setFontSize(14);
      doc.setTextColor(40);
      doc.text('VENTAS POR METODO DE PAGO', 20, currentY);

      const paymentMethodData = monthlyData.salesByMethod.map(item => [
        item.method,
        `$${item.amount.toLocaleString()}`,
        `${item.percentage.toFixed(1)}%`
      ]);

      doc.autoTable({
        startY: currentY + 10,
        head: [['Metodo', 'Monto', 'Porcentaje']],
        body: paymentMethodData,
        theme: 'striped',
        headStyles: { fillColor: [46, 204, 113] },
        margin: { left: 20, right: 20 }
      });

      // === TOP PRODUCTOS ===
      currentY = doc.lastAutoTable.finalY + 20;
      
      doc.setFontSize(14);
      doc.setTextColor(40);
      doc.text('TOP PRODUCTOS VENDIDOS', 20, currentY);

      const topProductsData = monthlyData.topProducts.slice(0, 8).map(item => [
        item.productCode,
        item.productName,
        item.quantitySold.toString(),
        `$${item.totalRevenue.toLocaleString()}`
      ]);

      doc.autoTable({
        startY: currentY + 10,
        head: [['Codigo', 'Producto', 'Cantidad', 'Total Vendido']],
        body: topProductsData,
        theme: 'grid',
        headStyles: { fillColor: [231, 76, 60] },
        margin: { left: 20, right: 20 },
        styles: { fontSize: 9 }
      });

      // === NUEVA PÁGINA PARA CIERRES DIARIOS ===
      doc.addPage();
      
      doc.setFontSize(16);
      doc.setTextColor(40);
      doc.text('CIERRES DIARIOS DEL MES', 20, 30);

      const dailyClosingsData = monthlyData.dailyClosings.map(item => [
        new Date(item.date).toLocaleDateString('es-ES'),
        `$${item.totalSales.toLocaleString()}`,
        `$${item.openingCash.toLocaleString()}`,
        `$${item.closingCash.toLocaleString()}`,
        `$${item.difference.toLocaleString()}`
      ]);

      doc.autoTable({
        startY: 40,
        head: [['Fecha', 'Ventas', 'Apertura', 'Cierre', 'Diferencia']],
        body: dailyClosingsData,
        theme: 'striped',
        headStyles: { fillColor: [255, 152, 0] },
        margin: { left: 20, right: 20 },
        styles: { fontSize: 9 }
      });

      // === PIE DE PÁGINA ===
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
        doc.text('Sistema de Gestión - Milan Fragancias', 105, 292, { align: 'center' });
      }

      // Convertir a Buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      
      console.log(`✅ Monthly PDF generated successfully - Size: ${pdfBuffer.length} bytes`);
      return pdfBuffer;

    } catch (error) {
      console.error('❌ Error generating monthly PDF:', error);
      throw new Error(`Error generando PDF mensual: ${error.message}`);
    }
  }

  /**
   * Obtener lista de meses disponibles para cierre
   */
  async getAvailableMonths() {
    const result = await this.prisma.cashClosing.groupBy({
      by: ['date'],
      _count: true,
      orderBy: { date: 'desc' }
    });

    const monthsSet = new Set<string>();
    
    result.forEach(item => {
      const date = new Date(item.date);
      const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      monthsSet.add(monthYear);
    });

    return Array.from(monthsSet).sort().reverse();
  }
}
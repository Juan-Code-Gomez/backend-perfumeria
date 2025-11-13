import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseLocalDate, startOfDay, endOfDay } from '../common/utils/timezone.util';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable()
export class CashClosingReportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generar reporte PDF detallado del cierre de caja
   */
  async generateCashClosingDetailPDF(date: string): Promise<Buffer> {
    try {
      // Obtener datos del día
      const startDay = startOfDay(date);
      const endDay = endOfDay(date);

      console.log(`📊 Generating cash closing PDF for: ${date}`);

      // 1. Obtener cierre de caja del día
      const cashClosing = await this.prisma.cashClosing.findFirst({
        where: {
          date: {
            gte: startDay,
            lte: endDay
          }
        },
        include: {
          createdBy: { select: { name: true } }
        }
      });

      if (!cashClosing) {
        throw new Error(`No se encontró cierre de caja para la fecha ${date}`);
      }

      // 2. Obtener ventas del día con productos
      const sales = await this.prisma.sale.findMany({
        where: {
          date: { gte: startDay, lte: endDay },
          isPaid: true
        },
        include: {
          client: { select: { name: true } },
          details: {
            include: {
              product: { 
                select: { 
                  name: true, 
                  sku: true,
                  salePrice: true 
                } 
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      // 3. Obtener gastos del día
      const expenses = await this.prisma.expense.findMany({
        where: {
          date: { gte: startDay, lte: endDay },
          deletedAt: null
        },
        orderBy: { createdAt: 'asc' }
      });

      // 4. Generar PDF
      const doc = new jsPDF();
      
      // === ENCABEZADO ===
      doc.setFontSize(18);
      doc.setTextColor(40);
      doc.text('CIERRE DE CAJA DETALLADO', 105, 25, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Fecha: ${new Date(date).toLocaleDateString('es-ES')}`, 105, 35, { align: 'center' });
      doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 105, 42, { align: 'center' });
      doc.text(`Usuario: ${cashClosing.createdBy?.name || 'Sistema'}`, 105, 49, { align: 'center' });

      // === RESUMEN EJECUTIVO ===
      doc.setFontSize(14);
      doc.setTextColor(40);
      doc.text('RESUMEN EJECUTIVO', 20, 70);
      
      const summaryData = [
        ['Dinero inicial:', `$${cashClosing.openingCash.toLocaleString()}`],
        ['Dinero final contado:', `$${cashClosing.closingCash.toLocaleString()}`],
        ['Dinero sistema esperado:', `$${cashClosing.systemCash.toLocaleString()}`],
        ['Diferencia:', `$${cashClosing.difference.toLocaleString()}`],
        ['Total ventas:', `$${cashClosing.totalSales.toLocaleString()}`],
        ['Ventas en efectivo:', `$${cashClosing.cashSales.toLocaleString()}`],
        ['Ventas con tarjeta:', `$${cashClosing.cardSales.toLocaleString()}`],
        ['Total gastos:', `$${cashClosing.totalExpense.toLocaleString()}`]
      ];

      autoTable(doc, {
        startY: 80,
        head: [['Concepto', 'Valor']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [52, 152, 219] },
        margin: { left: 20, right: 20 },
        styles: { fontSize: 10 }
      });

      // === DETALLE DE VENTAS ===
      let currentY = (doc as any).lastAutoTable.finalY + 20;
      
      doc.setFontSize(14);
      doc.setTextColor(40);
      doc.text('DETALLE DE VENTAS', 20, currentY);

      // Preparar datos de productos vendidos
      const productSales: Array<{
        code: string;
        name: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        client: string;
        saleId: number;
      }> = [];

      sales.forEach(sale => {
        sale.details.forEach(detail => {
          productSales.push({
            code: detail.product.sku || 'N/A',
            name: detail.product.name,
            quantity: detail.quantity,
            unitPrice: detail.unitPrice,
            totalPrice: detail.totalPrice,
            client: sale.client?.name || sale.customerName || 'Cliente general',
            saleId: sale.id
          });
        });
      });

      if (productSales.length > 0) {
        const salesTableData = productSales.map(item => [
          `#${item.saleId}`,
          item.code,
          item.name,
          item.quantity.toString(),
          `$${item.unitPrice.toLocaleString()}`,
          `$${item.totalPrice.toLocaleString()}`,
          item.client
        ]);

        autoTable(doc, {
          startY: currentY + 10,
          head: [['Venta', 'Código', 'Producto', 'Cant.', 'P.Unit', 'Total', 'Cliente']],
          body: salesTableData,
          theme: 'striped',
          headStyles: { fillColor: [46, 204, 113] },
          margin: { left: 20, right: 20 },
          styles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 20 }, // Venta
            1: { cellWidth: 25 }, // Código
            2: { cellWidth: 50 }, // Producto
            3: { cellWidth: 18 }, // Cantidad
            4: { cellWidth: 25 }, // P.Unit
            5: { cellWidth: 25 }, // Total
            6: { cellWidth: 37 }  // Cliente
          }
        });
        currentY = (doc as any).lastAutoTable.finalY;
      } else {
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text('No hay ventas registradas para este día', 20, currentY + 15);
        currentY += 25;
      }

      // === RESUMEN POR PRODUCTO ===
      if (productSales.length > 0) {
        currentY += 15;
        
        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.text('RESUMEN POR PRODUCTO', 20, currentY);

        // Agrupar productos
        const productSummary = productSales.reduce((acc, item) => {
          const key = `${item.code}-${item.name}`;
          if (!acc[key]) {
            acc[key] = {
              code: item.code,
              name: item.name,
              quantity: 0,
              totalSales: 0
            };
          }
          acc[key].quantity += item.quantity;
          acc[key].totalSales += item.totalPrice;
          return acc;
        }, {} as Record<string, any>);

        const summaryTableData = Object.values(productSummary).map((item: any) => [
          item.code,
          item.name,
          item.quantity.toString(),
          `$${item.totalSales.toLocaleString()}`
        ]);

        autoTable(doc, {
          startY: currentY + 10,
          head: [['Código', 'Producto', 'Cant. Total', 'Venta Total']],
          body: summaryTableData,
          theme: 'grid',
          headStyles: { fillColor: [231, 76, 60] },
          margin: { left: 20, right: 20 },
          styles: { fontSize: 9 }
        });
        currentY = (doc as any).lastAutoTable.finalY;
      }

      // === GASTOS DEL DÍA ===
      if (expenses.length > 0) {
        // Verificar si necesitamos nueva página
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        } else {
          currentY += 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.text('GASTOS DEL DIA', 20, currentY);

        const expensesData = expenses.map(expense => [
          expense.category,
          expense.description,
          `$${expense.amount.toLocaleString()}`,
          expense.paymentMethod || 'N/A'
        ]);

        autoTable(doc, {
          startY: currentY + 10,
          head: [['Categoría', 'Descripción', 'Monto', 'Método Pago']],
          body: expensesData,
          theme: 'striped',
          headStyles: { fillColor: [255, 152, 0] },
          margin: { left: 20, right: 20 },
          styles: { fontSize: 9 }
        });
      }

      // === PIE DE PÁGINA ===
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
        doc.text('Sistema de Gestión - Milan Fragancias', 105, 292, { align: 'center' });
      }

      // Convertir a Buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      
      console.log(`✅ PDF generated successfully - Size: ${pdfBuffer.length} bytes`);
      return pdfBuffer;

    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      throw new Error(`Error generando reporte PDF: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas para el modal de cierre
   */
  async getCashClosingStats(date: string) {
    const startDay = startOfDay(date);
    const endDay = endOfDay(date);

    // Ventas por método de pago
    const salesByMethod = await this.prisma.sale.groupBy({
      by: ['paymentMethod'],
      where: {
        date: { gte: startDay, lte: endDay },
        isPaid: true
      },
      _sum: { totalAmount: true },
      _count: true
    });

    // Top productos vendidos
    const topProducts = await this.prisma.saleDetail.groupBy({
      by: ['productId'],
      where: {
        sale: {
          date: { gte: startDay, lte: endDay },
          isPaid: true
        }
      },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: 5
    });

    // Obtener nombres de productos
    const productIds = topProducts.map(p => p.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true }
    });

    const topProductsWithNames = topProducts.map(tp => {
      const product = products.find(p => p.id === tp.productId);
      return {
        ...tp,
        productName: product?.name || 'Desconocido',
        productCode: product?.sku || 'N/A'
      };
    });

    return {
      salesByMethod,
      topProducts: topProductsWithNames
    };
  }
}
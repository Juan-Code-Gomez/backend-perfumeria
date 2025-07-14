import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // 1. Ventas del día y del mes (incluyendo detalles y productos)
    const ventasDia = await this.prisma.sale.findMany({
      where: { date: { gte: todayStart, lte: todayEnd } },
      include: { details: { include: { product: true } } },
    });
    const ventasMes = await this.prisma.sale.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
      include: { details: { include: { product: true } } },
    });

    // 2. Egresos del día y del mes
    const egresosDia = await this.prisma.expense.findMany({
      where: { date: { gte: todayStart, lte: todayEnd } },
    });
    const egresosMes = await this.prisma.expense.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
    });

    // 3. Deuda total a proveedores (compras pendientes de pago)
    const comprasPendientes = await this.prisma.purchase.findMany({
      where: { isPaid: false },
      select: { totalAmount: true, paidAmount: true },
    });
    const deudaProveedores = comprasPendientes.reduce(
      (sum, c) => sum + (c.totalAmount - c.paidAmount),
      0,
    );

    // 4. Productos en stock bajo (donde stock <= minStock)
    const productosStockBajo = await this.prisma.product.findMany({
      where: {
        minStock: { not: null },
        stock: { lte: 10 }, // Puedes usar lte: minStock si quieres comparar contra mínimo real
      },
      select: { id: true, name: true, stock: true, minStock: true },
    });

    // 5. Cálculo de utilidad (venta - compra) por cada detalle
    const utilidadDia = ventasDia
      .flatMap((v) => v.details)
      .reduce((sum, d) => sum + ((d.unitPrice - (d.product?.purchasePrice ?? 0)) * d.quantity), 0);

    const utilidadMes = ventasMes
      .flatMap((v) => v.details)
      .reduce((sum, d) => sum + ((d.unitPrice - (d.product?.purchasePrice ?? 0)) * d.quantity), 0);

    // 6. Sumas de ventas y egresos
    const totalVentasDia = ventasDia.reduce((sum, v) => sum + v.totalAmount, 0);
    const totalVentasMes = ventasMes.reduce((sum, v) => sum + v.totalAmount, 0);
    const totalEgresosDia = egresosDia.reduce((sum, e) => sum + e.amount, 0);
    const totalEgresosMes = egresosMes.reduce((sum, e) => sum + e.amount, 0);

    return {
      totalVentasDia,
      totalVentasMes,
      utilidadDia,
      utilidadMes,
      totalEgresosDia,
      totalEgresosMes,
      deudaProveedores,
      productosStockBajo,
    };
  }
}

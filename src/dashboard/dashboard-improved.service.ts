import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

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
      where: { 
        date: { gte: todayStart, lte: todayEnd },
        deletedAt: null 
      },
    });
    const egresosMes = await this.prisma.expense.findMany({
      where: { 
        date: { gte: monthStart, lte: monthEnd },
        deletedAt: null 
      },
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

    // 4. Ventas pendientes de cobro (ventas a crédito)
    const ventasPendientes = await this.prisma.sale.findMany({
      where: { isPaid: false },
      select: { totalAmount: true, paidAmount: true },
    });
    const deudaClientes = ventasPendientes.reduce(
      (sum, v) => sum + (v.totalAmount - v.paidAmount),
      0,
    );

    // 5. Productos con stock bajo
    const productosStockBajo = await this.prisma.product.findMany({
      where: {
        minStock: { not: null },
      },
      include: { category: true, unit: true },
    });
    const alertasStock = productosStockBajo.filter(
      (p) => p.stock <= (p.minStock ?? 0),
    );

    // 6. Productos más vendidos del mes
    const ventasConDetalle = await this.prisma.saleDetail.groupBy({
      by: ['productId'],
      where: {
        sale: {
          date: { gte: monthStart, lte: monthEnd },
        },
      },
      _sum: { quantity: true },
      _count: { productId: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const productosMasVendidos = await Promise.all(
      ventasConDetalle.map(async (item) => {
        const producto = await this.prisma.product.findUnique({
          where: { id: item.productId },
          include: { category: true },
        });
        return {
          producto,
          cantidadVendida: item._sum.quantity,
          vecesVendido: item._count.productId,
        };
      }),
    );

    // 7. Valor total del inventario
    const todosLosProductos = await this.prisma.product.findMany({
      select: { stock: true, purchasePrice: true, salePrice: true },
    });
    
    const valorInventario = {
      costo: todosLosProductos.reduce((sum, p) => sum + (p.stock * p.purchasePrice), 0),
      venta: todosLosProductos.reduce((sum, p) => sum + (p.stock * p.salePrice), 0),
    };

    // 8. Resumen financiero
    const totalVentasDia = ventasDia.reduce((sum, v) => sum + v.totalAmount, 0);
    const totalVentasMes = ventasMes.reduce((sum, v) => sum + v.totalAmount, 0);
    const totalEgresosDia = egresosDia.reduce((sum, e) => sum + e.amount, 0);
    const totalEgresosMes = egresosMes.reduce((sum, e) => sum + e.amount, 0);
    
    // Ganancias brutas del día/mes
    const gananciasBrutasDia = totalVentasDia - totalEgresosDia;
    const gananciasBrutasMes = totalVentasMes - totalEgresosMes;

    return {
      resumenFinanciero: {
        hoy: {
          ventas: totalVentasDia,
          gastos: totalEgresosDia,
          gananciasBrutas: gananciasBrutasDia,
          cantidadVentas: ventasDia.length,
        },
        mes: {
          ventas: totalVentasMes,
          gastos: totalEgresosMes,
          gananciasBrutas: gananciasBrutasMes,
          cantidadVentas: ventasMes.length,
        },
      },
      inventario: {
        valorTotal: valorInventario,
        alertasStockBajo: alertasStock.length,
        productos: alertasStock.slice(0, 5), // Solo los primeros 5
      },
      cuentas: {
        porCobrar: deudaClientes,
        porPagar: deudaProveedores,
        flujoNeto: deudaClientes - deudaProveedores,
      },
      productosMasVendidos,
      fecha: new Date().toISOString(),
    };
  }

  // Nuevo método: Análisis de rentabilidad por período
  async getAnalisisRentabilidad(meses: number = 6) {
    const now = new Date();
    const resultados: any[] = [];

    for (let i = 0; i < meses; i++) {
      const mesActual = subMonths(now, i);
      const inicioMes = startOfMonth(mesActual);
      const finMes = endOfMonth(mesActual);

      const ventas = await this.prisma.sale.findMany({
        where: { date: { gte: inicioMes, lte: finMes } },
        include: { details: { include: { product: true } } },
      });

      const gastos = await this.prisma.expense.findMany({
        where: { 
          date: { gte: inicioMes, lte: finMes },
          deletedAt: null 
        },
      });

      const totalVentas = ventas.reduce((sum, v) => sum + v.totalAmount, 0);
      const totalGastos = gastos.reduce((sum, g) => sum + g.amount, 0);
      
      // Calcular costo de ventas (precio de compra de productos vendidos)
      const costoVentas = ventas.reduce((sum, venta) => {
        return sum + venta.details.reduce((detailSum, detail) => {
          return detailSum + (detail.quantity * detail.product.purchasePrice);
        }, 0);
      }, 0);

      const utilidadBruta = totalVentas - costoVentas;
      const utilidadNeta = utilidadBruta - totalGastos;
      const margenBruto = totalVentas > 0 ? (utilidadBruta / totalVentas) * 100 : 0;
      const margenNeto = totalVentas > 0 ? (utilidadNeta / totalVentas) * 100 : 0;

      resultados.push({
        mes: format(mesActual, 'yyyy-MM'),
        nombreMes: format(mesActual, 'MMMM yyyy'),
        ventas: totalVentas,
        costoVentas,
        gastos: totalGastos,
        utilidadBruta,
        utilidadNeta,
        margenBruto: parseFloat(margenBruto.toFixed(2)),
        margenNeto: parseFloat(margenNeto.toFixed(2)),
        cantidadVentas: ventas.length,
      });
    }

    return resultados.reverse(); // Mostrar del más antiguo al más reciente
  }

  // Nuevo método: Productos menos rentables
  async getProductosMenosRentables(limit: number = 10) {
    const productos = await this.prisma.product.findMany({
      include: { 
        category: true, 
        unit: true,
        SaleDetail: {
          select: {
            quantity: true,
            unitPrice: true,
          }
        }
      },
    });

    const analisisProductos = productos.map(producto => {
      const totalVendido = producto.SaleDetail.reduce((sum, detail) => sum + detail.quantity, 0);
      const ingresoTotal = producto.SaleDetail.reduce((sum, detail) => sum + (detail.quantity * detail.unitPrice), 0);
      const costoTotal = totalVendido * producto.purchasePrice;
      const utilidad = ingresoTotal - costoTotal;
      const margen = ingresoTotal > 0 ? ((utilidad / ingresoTotal) * 100) : 0;
      
      return {
        id: producto.id,
        nombre: producto.name,
        categoria: producto.category.name,
        stock: producto.stock,
        precioCompra: producto.purchasePrice,
        precioVenta: producto.salePrice,
        totalVendido,
        ingresoTotal,
        costoTotal,
        utilidad,
        margen: parseFloat(margen.toFixed(2)),
        rotacion: totalVendido > 0 ? 'Alta' : 'Baja',
      };
    });

    // Ordenar por margen ascendente (menos rentables primero)
    return analisisProductos
      .sort((a, b) => a.margen - b.margen)
      .slice(0, limit);
  }
}

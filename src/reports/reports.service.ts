import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfMonth, endOfMonth, subMonths, format, startOfYear, endOfYear } from 'date-fns';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // Control de inventario valorizado
  async getInventarioValorizado() {
    const productos = await this.prisma.product.findMany({
      include: { 
        category: true, 
        unit: true,
        SaleDetail: {
          select: {
            quantity: true,
            sale: {
              select: {
                date: true
              }
            }
          },
          orderBy: {
            sale: {
              date: 'desc'
            }
          }
        }
      },
    });

    const inventarioAnalisis = productos.map(producto => {
      const valorCosto = producto.stock * producto.purchasePrice;
      const valorVenta = producto.stock * producto.salePrice;
      const utilidadPotencial = valorVenta - valorCosto;
      const margenPorcentaje = valorCosto > 0 ? ((utilidadPotencial / valorCosto) * 100) : 0;
      
      // Calcular rotación (ventas últimos 30 días)
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - 30);
      
      const ventasRecientes = producto.SaleDetail.filter(
        detail => new Date(detail.sale.date) >= fechaLimite
      );
      const cantidadVendidaReciente = ventasRecientes.reduce(
        (sum, detail) => sum + detail.quantity, 0
      );

      return {
        id: producto.id,
        nombre: producto.name,
        categoria: producto.category.name,
        unidad: producto.unit.name,
        stock: producto.stock,
        stockMinimo: producto.minStock,
        precioCompra: producto.purchasePrice,
        precioVenta: producto.salePrice,
        valorTotalCosto: parseFloat(valorCosto.toFixed(2)),
        valorTotalVenta: parseFloat(valorVenta.toFixed(2)),
        utilidadPotencial: parseFloat(utilidadPotencial.toFixed(2)),
        margenPorcentaje: parseFloat(margenPorcentaje.toFixed(2)),
        rotacion30Dias: cantidadVendidaReciente,
        alertaStockBajo: producto.minStock ? producto.stock <= producto.minStock : false,
        diasInventario: cantidadVendidaReciente > 0 ? Math.round(producto.stock / (cantidadVendidaReciente / 30)) : null,
      };
    });

    const resumen = {
      valorTotalInventarioCosto: inventarioAnalisis.reduce((sum, item) => sum + item.valorTotalCosto, 0),
      valorTotalInventarioVenta: inventarioAnalisis.reduce((sum, item) => sum + item.valorTotalVenta, 0),
      utilidadPotencialTotal: inventarioAnalisis.reduce((sum, item) => sum + item.utilidadPotencial, 0),
      productosStockBajo: inventarioAnalisis.filter(item => item.alertaStockBajo).length,
      totalProductos: inventarioAnalisis.length,
    };

    return {
      resumen,
      productos: inventarioAnalisis.sort((a, b) => b.valorTotalVenta - a.valorTotalVenta),
    };
  }

  // Control de cuentas por cobrar y pagar
  async getCuentasPorCobrarPagar() {
    // Cuentas por cobrar (ventas pendientes)
    const ventasPendientes = await this.prisma.sale.findMany({
      where: { isPaid: false },
      include: {
        client: true,
        payments: true,
      },
      orderBy: { date: 'asc' },
    });

    // Cuentas por pagar (compras pendientes)
    const comprasPendientes = await this.prisma.purchase.findMany({
      where: { isPaid: false },
      include: {
        supplier: true,
      },
      orderBy: { date: 'asc' },
    });

    const cuentasPorCobrar = ventasPendientes.map(venta => {
      const totalPagado = venta.payments.reduce((sum, pago) => sum + pago.amount, 0);
      const saldoPendiente = venta.totalAmount - totalPagado;
      const diasVencido = Math.floor((new Date().getTime() - new Date(venta.date).getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        id: venta.id,
        fecha: venta.date,
        cliente: venta.client?.name || venta.customerName || 'Cliente General',
        totalVenta: venta.totalAmount,
        totalPagado,
        saldoPendiente,
        diasVencido,
        estado: diasVencido > 30 ? 'Vencida' : diasVencido > 15 ? 'Por vencer' : 'Al día',
      };
    });

    const cuentasPorPagar = comprasPendientes.map(compra => {
      const saldoPendiente = compra.totalAmount - compra.paidAmount;
      const diasVencido = Math.floor((new Date().getTime() - new Date(compra.date).getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        id: compra.id,
        fecha: compra.date,
        proveedor: compra.supplier.name,
        totalCompra: compra.totalAmount,
        totalPagado: compra.paidAmount,
        saldoPendiente,
        diasVencido,
        estado: diasVencido > 30 ? 'Vencida' : diasVencido > 15 ? 'Por vencer' : 'Al día',
      };
    });

    const resumen = {
      totalPorCobrar: cuentasPorCobrar.reduce((sum, cuenta) => sum + cuenta.saldoPendiente, 0),
      totalPorPagar: cuentasPorPagar.reduce((sum, cuenta) => sum + cuenta.saldoPendiente, 0),
      flujoNeto: cuentasPorCobrar.reduce((sum, cuenta) => sum + cuenta.saldoPendiente, 0) - 
                 cuentasPorPagar.reduce((sum, cuenta) => sum + cuenta.saldoPendiente, 0),
      cuentasVencidas: {
        porCobrar: cuentasPorCobrar.filter(c => c.estado === 'Vencida').length,
        porPagar: cuentasPorPagar.filter(c => c.estado === 'Vencida').length,
      },
    };

    return {
      resumen,
      cuentasPorCobrar: cuentasPorCobrar.sort((a, b) => b.diasVencido - a.diasVencido),
      cuentasPorPagar: cuentasPorPagar.sort((a, b) => b.diasVencido - a.diasVencido),
    };
  }

  // Análisis ABC de productos
  async getAnalisisABC() {
    const inicioAno = startOfYear(new Date());
    const finAno = endOfYear(new Date());

    const ventasProductos = await this.prisma.saleDetail.groupBy({
      by: ['productId'],
      where: {
        sale: {
          date: { gte: inicioAno, lte: finAno },
        },
      },
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      _count: {
        productId: true,
      },
    });

    const productosConVentas = await Promise.all(
      ventasProductos.map(async (item) => {
        const producto = await this.prisma.product.findUnique({
          where: { id: item.productId },
          include: { category: true },
        });
        
        if (!producto) {
          return null;
        }
        
        return {
          id: producto.id,
          nombre: producto.name,
          categoria: producto.category.name,
          cantidadVendida: item._sum.quantity || 0,
          ingresoTotal: item._sum.totalPrice || 0,
          frecuenciaVenta: item._count.productId,
          stock: producto.stock,
          precioVenta: producto.salePrice,
        };
      })
    ).then(results => results.filter(Boolean));

    // Ordenar por ingresos totales descendente
    const productosOrdenados = productosConVentas.sort((a, b) => (b?.ingresoTotal || 0) - (a?.ingresoTotal || 0));
    
    const ingresoTotal = productosOrdenados.reduce((sum, p) => sum + (p?.ingresoTotal || 0), 0);
    let acumulado = 0;
    
    const analisisABC = productosOrdenados.map((producto, index) => {
      if (!producto) return null;
      
      acumulado += producto.ingresoTotal;
      const porcentajeAcumulado = (acumulado / ingresoTotal) * 100;
      
      let clasificacion: 'A' | 'B' | 'C';
      if (porcentajeAcumulado <= 80) {
        clasificacion = 'A';
      } else if (porcentajeAcumulado <= 95) {
        clasificacion = 'B';
      } else {
        clasificacion = 'C';
      }
      
      return {
        ...producto,
        posicion: index + 1,
        porcentajeIngresos: parseFloat(((producto.ingresoTotal / ingresoTotal) * 100).toFixed(2)),
        porcentajeAcumulado: parseFloat(porcentajeAcumulado.toFixed(2)),
        clasificacion,
      };
    }).filter(Boolean);

    const resumen = {
      totalProductos: analisisABC.length,
      productosA: analisisABC.filter(p => p?.clasificacion === 'A').length,
      productosB: analisisABC.filter(p => p?.clasificacion === 'B').length,
      productosC: analisisABC.filter(p => p?.clasificacion === 'C').length,
      ingresoTotal,
    };

    return {
      resumen,
      productos: analisisABC,
    };
  }

  // Reporte de ganancias por período personalizado
  async getGananciasPorPeriodo(fechaInicio: string, fechaFin: string) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    const ventas = await this.prisma.sale.findMany({
      where: { date: { gte: inicio, lte: fin } },
      include: { 
        details: { 
          include: { 
            product: {
              include: {
                category: true
              }
            }
          } 
        } 
      },
    });

    const gastos = await this.prisma.expense.findMany({
      where: { 
        date: { gte: inicio, lte: fin },
        deletedAt: null 
      },
    });

    const compras = await this.prisma.purchase.findMany({
      where: { date: { gte: inicio, lte: fin } },
    });

    const totalVentas = ventas.reduce((sum, v) => sum + v.totalAmount, 0);
    const totalGastos = gastos.reduce((sum, g) => sum + g.amount, 0);
    const totalCompras = compras.reduce((sum, c) => sum + c.totalAmount, 0);

    // Calcular costo de ventas
    const costoVentas = ventas.reduce((sum, venta) => {
      return sum + venta.details.reduce((detailSum, detail) => {
        return detailSum + (detail.quantity * detail.product.purchasePrice);
      }, 0);
    }, 0);

    const utilidadBruta = totalVentas - costoVentas;
    const utilidadNeta = utilidadBruta - totalGastos;
    const margenBruto = totalVentas > 0 ? (utilidadBruta / totalVentas) * 100 : 0;
    const margenNeto = totalVentas > 0 ? (utilidadNeta / totalVentas) * 100 : 0;

    // Análisis por categoría
    const ventasPorCategoria = ventas.reduce((acc, venta) => {
      venta.details.forEach(detail => {
        const categoria = detail.product.category?.name || 'Sin categoría';
        if (!acc[categoria]) {
          acc[categoria] = { ventas: 0, cantidad: 0, costo: 0 };
        }
        acc[categoria].ventas += detail.totalPrice;
        acc[categoria].cantidad += detail.quantity;
        acc[categoria].costo += detail.quantity * detail.product.purchasePrice;
      });
      return acc;
    }, {} as Record<string, { ventas: number; cantidad: number; costo: number }>);

    const categorias = Object.entries(ventasPorCategoria).map(([nombre, datos]) => ({
      categoria: nombre,
      ventas: datos.ventas,
      costo: datos.costo,
      utilidad: datos.ventas - datos.costo,
      margen: datos.ventas > 0 ? ((datos.ventas - datos.costo) / datos.ventas) * 100 : 0,
      cantidad: datos.cantidad,
    }));

    return {
      periodo: {
        inicio: fechaInicio,
        fin: fechaFin,
        dias: Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)),
      },
      resumenFinanciero: {
        totalVentas,
        costoVentas,
        utilidadBruta,
        totalGastos,
        utilidadNeta,
        margenBruto: parseFloat(margenBruto.toFixed(2)),
        margenNeto: parseFloat(margenNeto.toFixed(2)),
        totalCompras,
        cantidadVentas: ventas.length,
      },
      categorias: categorias.sort((a, b) => b.ventas - a.ventas),
      gastosPorCategoria: gastos.reduce((acc, gasto) => {
        if (!acc[gasto.category]) {
          acc[gasto.category] = 0;
        }
        acc[gasto.category] += gasto.amount;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

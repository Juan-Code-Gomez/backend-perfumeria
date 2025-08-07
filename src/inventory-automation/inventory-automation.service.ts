import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from '../notifications/notifications.service';
import { addDays, subDays, differenceInDays } from 'date-fns';

export interface InventoryAutomationRule {
  id?: number;
  name: string;
  description?: string;
  ruleType: 'AUTO_REORDER' | 'STOCK_ADJUSTMENT' | 'DEAD_STOCK_ALERT' | 'EXPIRY_ALERT';
  conditions: any;
  actions: any;
  isActive: boolean;
  categoryIds?: number[];
  productIds?: number[];
}

export interface AutoReorderSuggestion {
  productId: number;
  productName: string;
  currentStock: number;
  minStock: number;
  suggestedQuantity: number;
  estimatedCost: number;
  supplier: string;
  reason: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface StockMovementPrediction {
  productId: number;
  productName: string;
  currentStock: number;
  dailyAverageSales: number;
  predictedStockInDays: number;
  daysUntilStockOut: number;
  recommendedAction: string;
}

@Injectable()
export class InventoryAutomationService {
  private readonly logger = new Logger(InventoryAutomationService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // ===== CRON JOBS PARA AUTOMATIZACIÓN =====

  @Cron(CronExpression.EVERY_6_HOURS)
  async runInventoryAutomation() {
    this.logger.log('🤖 Ejecutando automatización de inventario...');

    try {
      await this.checkAutoReorderRules();
      await this.detectDeadStock();
      await this.predictStockOutages();
      await this.optimizeStockLevels();
    } catch (error) {
      this.logger.error('Error en automatización de inventario:', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async generateInventoryReports() {
    this.logger.log('📊 Generando reportes automáticos de inventario...');

    try {
      await this.generateDailyInventoryReport();
      await this.checkExpiringProducts();
    } catch (error) {
      this.logger.error('Error generando reportes de inventario:', error);
    }
  }

  // ===== REGLAS DE REORDEN AUTOMÁTICO =====

  async checkAutoReorderRules() {
    this.logger.log('Verificando reglas de reorden automático...');

    // Obtener productos con stock bajo
    const lowStockProducts = await this.prisma.product.findMany({
      where: {
        OR: [
          { stock: { lte: 5 } }, // Stock bajo genérico
          { 
            AND: [
              { minStock: { not: null } },
              { stock: { lte: this.prisma.product.fields.minStock } }
            ]
          }
        ]
      },
      include: {
        category: true,
      },
    });

    for (const product of lowStockProducts) {
      const suggestion = await this.generateReorderSuggestion(product);
      if (suggestion) {
        await this.createReorderNotification(suggestion);
      }
    }
  }

  async generateReorderSuggestion(product: any): Promise<AutoReorderSuggestion | null> {
    try {
      // Calcular ventas promedio de los últimos 30 días
      const salesHistory = await this.getProductSalesHistory(product.id, 30);
      const averageDailySales = this.calculateAverageDailySales(salesHistory);

      // Calcular cantidad sugerida (para 30 días + stock de seguridad)
      const daysOfStock = 30;
      const safetyStockMultiplier = 1.5;
      const suggestedQuantity = Math.ceil(
        (averageDailySales * daysOfStock * safetyStockMultiplier) - product.stock
      );

      if (suggestedQuantity <= 0) return null;

      const estimatedCost = suggestedQuantity * (product.purchasePrice || 0);
      
      // Determinar prioridad basada en velocidad de rotación
      let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
      if (averageDailySales > 5) priority = 'CRITICAL';
      else if (averageDailySales > 2) priority = 'HIGH';
      else if (averageDailySales > 0.5) priority = 'MEDIUM';
      else priority = 'LOW';

      return {
        productId: product.id,
        productName: product.name,
        currentStock: product.stock,
        minStock: product.minStock || 0,
        suggestedQuantity,
        estimatedCost,
        supplier: 'Sin proveedor asignado', // Valor por defecto
        reason: `Ventas promedio: ${averageDailySales.toFixed(1)}/día. Stock para ${Math.ceil(product.stock / averageDailySales)} días.`,
        priority,
      };
    } catch (error) {
      this.logger.error(`Error generando sugerencia para producto ${product.id}:`, error);
      return null;
    }
  }

  private async getProductSalesHistory(productId: number, days: number) {
    const startDate = subDays(new Date(), days);
    
    return await this.prisma.saleDetail.findMany({
      where: {
        productId,
        sale: {
          date: {
            gte: startDate,
          },
        },
      },
      include: {
        sale: true,
      },
    });
  }

  private calculateAverageDailySales(salesHistory: any[]): number {
    if (salesHistory.length === 0) return 0;

    const totalQuantity = salesHistory.reduce((sum, sale) => sum + sale.quantity, 0);
    const daysInPeriod = 30; // Período fijo de 30 días para consistencia
    
    return totalQuantity / daysInPeriod;
  }

  // ===== DETECCIÓN DE STOCK MUERTO =====

  async detectDeadStock() {
    this.logger.log('Detectando productos con poco movimiento...');

    const deadStockThresholdDays = 60; // Productos sin venta en 60 días
    const cutoffDate = subDays(new Date(), deadStockThresholdDays);

    const deadStockProducts = await this.prisma.product.findMany({
      where: {
        stock: { gt: 0 },
        SaleDetail: {
          none: {
            sale: {
              date: { gte: cutoffDate },
            },
          },
        },
      },
      include: {
        category: true,
      },
    });

    for (const product of deadStockProducts) {
      await this.createDeadStockAlert(product, deadStockThresholdDays);
    }

    return deadStockProducts;
  }

  // ===== PREDICCIÓN DE AGOTAMIENTO =====

  async predictStockOutages(): Promise<StockMovementPrediction[]> {
    this.logger.log('Prediciendo agotamientos de stock...');

    const products = await this.prisma.product.findMany({
      where: { stock: { gt: 0 } },
      include: { category: true },
    });

    const predictions: StockMovementPrediction[] = [];

    for (const product of products) {
      const prediction = await this.generateStockPrediction(product);
      if (prediction) {
        predictions.push(prediction);
        
        // Crear notificación si el agotamiento es inminente
        if (prediction.daysUntilStockOut <= 7) {
          await this.createStockOutageAlert(prediction);
        }
      }
    }

    return predictions;
  }

  private async generateStockPrediction(product: any): Promise<StockMovementPrediction | null> {
    try {
      const salesHistory = await this.getProductSalesHistory(product.id, 30);
      const averageDailySales = this.calculateAverageDailySales(salesHistory);

      if (averageDailySales === 0) return null;

      const daysUntilStockOut = Math.floor(product.stock / averageDailySales);
      const predictedStockInDays = Math.max(0, product.stock - (averageDailySales * 7));

      let recommendedAction = 'Monitorear';
      if (daysUntilStockOut <= 3) recommendedAction = 'Reorden urgente';
      else if (daysUntilStockOut <= 7) recommendedAction = 'Planificar reorden';
      else if (daysUntilStockOut <= 14) recommendedAction = 'Evaluar reorden';

      return {
        productId: product.id,
        productName: product.name,
        currentStock: product.stock,
        dailyAverageSales: averageDailySales,
        predictedStockInDays,
        daysUntilStockOut,
        recommendedAction,
      };
    } catch (error) {
      this.logger.error(`Error prediciendo stock para producto ${product.id}:`, error);
      return null;
    }
  }

  // ===== OPTIMIZACIÓN DE NIVELES DE STOCK =====

  async optimizeStockLevels() {
    this.logger.log('Optimizando niveles de stock...');

    const products = await this.prisma.product.findMany({
      include: { category: true },
    });

    const optimizationResults: any[] = [];

    for (const product of products) {
      const optimization = await this.calculateOptimalStockLevels(product);
      if (optimization.shouldUpdate) {
        optimizationResults.push(optimization);
        
        // Actualizar minStock si la diferencia es significativa
        if (Math.abs(optimization.suggestedMinStock - (product.minStock || 0)) > 2) {
          await this.updateMinStockLevel(product.id, optimization.suggestedMinStock);
        }
      }
    }

    return optimizationResults;
  }

  private async calculateOptimalStockLevels(product: any) {
    const salesHistory = await this.getProductSalesHistory(product.id, 60);
    const averageDailySales = this.calculateAverageDailySales(salesHistory);
    
    // Calcular variabilidad de ventas
    const dailySales = this.groupSalesByDay(salesHistory);
    const salesVariability = this.calculateStandardDeviation(dailySales);
    
    // Stock de seguridad basado en variabilidad
    const safetyStock = Math.ceil(salesVariability * 1.5);
    
    // Stock mínimo sugerido (7 días de ventas + stock de seguridad)
    const suggestedMinStock = Math.ceil((averageDailySales * 7) + safetyStock);
    
    // Stock máximo sugerido (30 días de ventas)
    const suggestedMaxStock = Math.ceil(averageDailySales * 30);

    return {
      productId: product.id,
      productName: product.name,
      currentMinStock: product.minStock || 0,
      suggestedMinStock: Math.max(1, suggestedMinStock),
      suggestedMaxStock: Math.max(suggestedMinStock * 2, suggestedMaxStock),
      averageDailySales,
      salesVariability,
      shouldUpdate: suggestedMinStock !== (product.minStock || 0),
    };
  }

  private groupSalesByDay(salesHistory: any[]): number[] {
    const salesByDay = new Map<string, number>();
    
    salesHistory.forEach(sale => {
      const day = sale.sale.date.toISOString().split('T')[0];
      const currentTotal = salesByDay.get(day) || 0;
      salesByDay.set(day, currentTotal + sale.quantity);
    });

    return Array.from(salesByDay.values());
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    
    return Math.sqrt(avgSquaredDiff);
  }

  private async updateMinStockLevel(productId: number, newMinStock: number) {
    await this.prisma.product.update({
      where: { id: productId },
      data: { minStock: newMinStock },
    });

    this.logger.log(`Stock mínimo actualizado para producto ${productId}: ${newMinStock}`);
  }

  // ===== REPORTES AUTOMÁTICOS =====

  async generateDailyInventoryReport() {
    const inventoryValue = await this.calculateInventoryValue();
    const lowStockCount = await this.getLowStockCount();
    const deadStockCount = await this.getDeadStockCount();
    const pendingReorders = await this.getPendingReordersCount();

    const report = {
      date: new Date(),
      totalInventoryValue: inventoryValue,
      lowStockProducts: lowStockCount,
      deadStockProducts: deadStockCount,
      pendingReorders,
    };

    // Crear notificación con el reporte
    await this.notificationsService.createNotification({
      title: '📊 Reporte Diario de Inventario',
      message: `Valor total: $${inventoryValue.toLocaleString()}. Stock bajo: ${lowStockCount}. Stock muerto: ${deadStockCount}. Reordenes pendientes: ${pendingReorders}`,
      type: 'INFO',
      priority: 'NORMAL',
      category: 'REPORTES',
      metadata: report,
      autoGenerated: true,
    });

    return report;
  }

  async checkExpiringProducts() {
    // Esta funcionalidad se implementaría si los productos tienen fecha de expiración
    // Por ahora, verificamos productos con mucho tiempo en inventario
    const oldInventoryThreshold = 180; // 6 meses
    const cutoffDate = subDays(new Date(), oldInventoryThreshold);

    const oldProducts = await this.prisma.product.findMany({
      where: {
        createdAt: { lte: cutoffDate },
        stock: { gt: 0 },
      },
    });

    for (const product of oldProducts) {
      await this.notificationsService.createNotification({
        title: '⏰ Producto con Inventario Antiguo',
        message: `El producto "${product.name}" lleva más de 6 meses en inventario. Considere promociones o descuentos.`,
        type: 'WARNING',
        priority: 'NORMAL',
        category: 'INVENTARIO',
        relatedId: product.id,
        relatedType: 'PRODUCT',
        autoGenerated: true,
      });
    }
  }

  // ===== MÉTODOS DE NOTIFICACIÓN =====

  private async createReorderNotification(suggestion: AutoReorderSuggestion) {
    await this.notificationsService.createNotification({
      title: '🔄 Sugerencia de Reorden Automático',
      message: `${suggestion.productName}: Reordenar ${suggestion.suggestedQuantity} unidades. Costo estimado: $${suggestion.estimatedCost.toLocaleString()}. ${suggestion.reason}`,
      type: 'INFO',
      priority: suggestion.priority === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      category: 'REORDEN',
      relatedId: suggestion.productId,
      relatedType: 'PRODUCT',
      metadata: suggestion,
      autoGenerated: true,
    });
  }

  private async createDeadStockAlert(product: any, days: number) {
    await this.notificationsService.createNotification({
      title: '💤 Stock sin Movimiento',
      message: `El producto "${product.name}" no ha tenido ventas en ${days} días. Stock actual: ${product.stock}. Considere promociones.`,
      type: 'WARNING',
      priority: 'NORMAL',
      category: 'INVENTARIO',
      relatedId: product.id,
      relatedType: 'PRODUCT',
      metadata: { daysWithoutSales: days, currentStock: product.stock },
      autoGenerated: true,
    });
  }

  private async createStockOutageAlert(prediction: StockMovementPrediction) {
    await this.notificationsService.createNotification({
      title: '⚠️ Agotamiento de Stock Predicho',
      message: `${prediction.productName} se agotará en ${prediction.daysUntilStockOut} días. Ventas promedio: ${prediction.dailyAverageSales.toFixed(1)}/día.`,
      type: 'WARNING',
      priority: prediction.daysUntilStockOut <= 3 ? 'CRITICAL' : 'HIGH',
      category: 'PREDICCION',
      relatedId: prediction.productId,
      relatedType: 'PRODUCT',
      metadata: prediction,
      autoGenerated: true,
    });
  }

  // ===== MÉTODOS DE CONSULTA =====

  async getReorderSuggestions(): Promise<AutoReorderSuggestion[]> {
    const lowStockProducts = await this.prisma.product.findMany({
      where: {
        OR: [
          { stock: { lte: 5 } },
          { 
            AND: [
              { minStock: { not: null } },
              { stock: { lte: this.prisma.product.fields.minStock } }
            ]
          }
        ]
      },
      include: {
        category: true,
      },
    });

    const suggestions: AutoReorderSuggestion[] = [];
    for (const product of lowStockProducts) {
      const suggestion = await this.generateReorderSuggestion(product);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    return suggestions;
  }

  async getInventoryAnalytics() {
    const totalProducts = await this.prisma.product.count();
    const inventoryValue = await this.calculateInventoryValue();
    const lowStockCount = await this.getLowStockCount();
    const deadStockProducts = await this.detectDeadStock();
    const stockPredictions = await this.predictStockOutages();

    return {
      summary: {
        totalProducts,
        inventoryValue,
        lowStockCount,
        deadStockCount: deadStockProducts.length,
        criticalPredictions: stockPredictions.filter(p => p.daysUntilStockOut <= 7).length,
      },
      deadStockProducts: deadStockProducts.slice(0, 10), // Top 10
      criticalPredictions: stockPredictions
        .filter(p => p.daysUntilStockOut <= 14)
        .sort((a, b) => a.daysUntilStockOut - b.daysUntilStockOut)
        .slice(0, 10),
    };
  }

  // ===== MÉTODOS AUXILIARES =====

  private async calculateInventoryValue(): Promise<number> {
    const result = await this.prisma.product.aggregate({
      _sum: {
        stock: true,
      },
      where: {
        stock: { gt: 0 },
      },
    });

    // Aproximación del valor (se necesitaría el precio de compra por producto)
    return (result._sum.stock || 0) * 100; // Valor estimado promedio
  }

  private async getLowStockCount(): Promise<number> {
    return await this.prisma.product.count({
      where: {
        OR: [
          { stock: { lte: 5 } },
          { 
            AND: [
              { minStock: { not: null } },
              { stock: { lte: this.prisma.product.fields.minStock } }
            ]
          }
        ]
      },
    });
  }

  private async getDeadStockCount(): Promise<number> {
    const deadStockThresholdDays = 60;
    const cutoffDate = subDays(new Date(), deadStockThresholdDays);

    return await this.prisma.product.count({
      where: {
        stock: { gt: 0 },
        SaleDetail: {
          none: {
            sale: {
              date: { gte: cutoffDate },
            },
          },
        },
      },
    });
  }

  private async getPendingReordersCount(): Promise<number> {
    // Esto sería el número de productos que necesitan reorden
    return await this.getLowStockCount();
  }
}

import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Protegido solo para usuarios logueados

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  async getSummary(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    // Por ahora, redirigir al executive summary pero con formato compatible
    const executiveSummary = await this.dashboardService.getExecutiveSummary();
    
    // Mapear al formato esperado por el Dashboard normal
    return {
      totalSales: executiveSummary.kpis.month.sales,
      totalProfit: executiveSummary.kpis.month.profit,
      totalExpenses: executiveSummary.kpis.month.expenses,
      cashClosing: executiveSummary.kpis.today.cashInRegister,
      // Agregar otros campos si son necesarios
      salesChart: executiveSummary.charts.salesTrend,
      topProducts: executiveSummary.charts.topProducts,
      alerts: executiveSummary.alerts
    };
  }

  @Get('executive-summary')
  @UseGuards(JwtAuthGuard)
  async getExecutiveSummary() {
    return this.dashboardService.getExecutiveSummary();
  }

  // 🔍 ENDPOINT DE DIAGNÓSTICO TEMPORAL (Sin autenticación para testing)
  @Get('debug')
  async debugDashboard() {
    try {
      const results = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        tests: {}
      };

      // Test 1: Conexión básica
      try {
        await this.dashboardService['prisma'].$queryRaw`SELECT 1 as test`;
        results.tests['connection'] = '✓ OK';
      } catch (error) {
        results.tests['connection'] = `✗ ${error.message}`;
      }

      // Test 2: Contar ventas
      try {
        const count = await this.dashboardService['prisma'].sale.count();
        results.tests['sales'] = `✓ ${count} registros`;
      } catch (error) {
        results.tests['sales'] = `✗ ${error.message}`;
      }

      // Test 3: Contar gastos
      try {
        const count = await this.dashboardService['prisma'].expense.count();
        results.tests['expenses'] = `✓ ${count} registros`;
      } catch (error) {
        results.tests['expenses'] = `✗ ${error.message}`;
      }

      // Test 4: Contar productos
      try {
        const count = await this.dashboardService['prisma'].product.count();
        results.tests['products'] = `✓ ${count} registros`;
      } catch (error) {
        results.tests['products'] = `✗ ${error.message}`;
      }

      // Test 5: Verificar migraciones
      try {
        const migrations: any = await this.dashboardService['prisma'].$queryRaw`
          SELECT COUNT(*) as count FROM _prisma_migrations
        `;
        results.tests['migrations'] = `✓ ${migrations[0].count} aplicadas`;
      } catch (error) {
        results.tests['migrations'] = `✗ ${error.message}`;
      }

      // Test 6: Consulta completa del dashboard
      try {
        const summary = await this.dashboardService.getExecutiveSummary();
        results.tests['dashboard'] = '✓ Consulta exitosa';
        results['summary'] = summary;
      } catch (error) {
        results.tests['dashboard'] = `✗ ${error.message}`;
        results['error'] = {
          message: error.message,
          stack: error.stack,
          name: error.name
        };
      }

      return results;
    } catch (error) {
      return {
        status: 'ERROR',
        error: error.message,
        stack: error.stack
      };
    }
  }
}

import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Protegido solo para usuarios logueados

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
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
  async getExecutiveSummary() {
    return this.dashboardService.getExecutiveSummary();
  }
}

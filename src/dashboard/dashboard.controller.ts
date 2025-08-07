import { Controller, Get, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Protegido solo para usuarios logueados

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  summary() {
    return this.dashboardService.getSummary();
  }

  @Get('rentabilidad')
  async getAnalisisRentabilidad(@Query('meses') meses?: string) {
    const mesesNum = meses ? parseInt(meses, 10) : 6;
    return this.dashboardService.getAnalisisRentabilidad(mesesNum);
  }

  @Get('productos-menos-rentables')
  async getProductosMenosRentables(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.dashboardService.getProductosMenosRentables(limitNum);
  }
}

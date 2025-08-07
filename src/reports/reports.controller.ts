import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('inventario-valorizado')
  @Roles('ADMIN')
  async getInventarioValorizado() {
    return this.reportsService.getInventarioValorizado();
  }

  @Get('cuentas-por-cobrar-pagar')
  @Roles('ADMIN')
  async getCuentasPorCobrarPagar() {
    return this.reportsService.getCuentasPorCobrarPagar();
  }

  @Get('analisis-abc')
  @Roles('ADMIN')
  async getAnalisisABC() {
    return this.reportsService.getAnalisisABC();
  }

  @Get('ganancias-periodo')
  @Roles('ADMIN')
  async getGananciasPorPeriodo(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) {
    if (!fechaInicio || !fechaFin) {
      throw new Error('Se requieren fechaInicio y fechaFin');
    }
    return this.reportsService.getGananciasPorPeriodo(fechaInicio, fechaFin);
  }
}

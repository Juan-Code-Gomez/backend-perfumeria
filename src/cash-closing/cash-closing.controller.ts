import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  Param,
  UseGuards,
  Query,
  Delete,
  Put,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { CashClosingService } from './cash-closing.service';
import { CashClosingReportService } from './cash-closing-report.service';
import { MonthlyClosingService } from './monthly-closing.service';
import { CreateCashClosingDto } from './dto/create-cash-closing.dto';
// Si usas autenticación, puedes usar JwtAuthGuard aquí
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cash-closing')
// @UseGuards(JwtAuthGuard)
export class CashClosingController {
  constructor(
    private readonly cashClosingService: CashClosingService,
    private readonly reportService: CashClosingReportService,
    private readonly monthlyService: MonthlyClosingService
  ) {}

  @Post()
  async create(@Body() dto: CreateCashClosingDto, @Req() req: any) {
    // const userId = req.user?.userId;
    // Por ahora, si no tienes auth, pásalo como null
    return this.cashClosingService.create(dto /*, userId*/);
  }

  @Get()
  async findAll(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.cashClosingService.findAll(dateFrom, dateTo);
  }

  @Get('summary')
  async getSummary(@Query('date') date: string) {
    // Devolver solo los datos, sin wrapper de success
    return this.cashClosingService.getSummary(date);
  }

  @Get('analytics')
  async getAnalytics(@Query('days') days: string = '30') {
    return this.cashClosingService.getAnalytics(parseInt(days));
  }

  @Get('alerts')
  async getAlerts() {
    return this.cashClosingService.getAlerts();
  }

  // Endpoint temporal para limpiar cierre de hoy - SOLO PARA DESARROLLO
  @Post('clean-today')
  async cleanToday() {
    return this.cashClosingService.cleanTodayClosing();
  }

  // Endpoint temporal para eliminar por ID - SOLO PARA DESARROLLO
  @Post('delete-by-id/:id')
  async deleteById(@Param('id') id: string) {
    return this.cashClosingService.delete(Number(id));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cashClosingService.findOne(Number(id));
  }

  // Eliminar cierre de caja
  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    // const userId = req.user?.userId;
    return this.cashClosingService.delete(Number(id) /*, userId*/);
  }

  // Actualizar cierre de caja
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: CreateCashClosingDto, @Req() req: any) {
    // const userId = req.user?.userId;
    return this.cashClosingService.update(Number(id), dto /*, userId*/);
  }

  // Generar reporte PDF detallado
  @Get('report/pdf/:date')
  async generatePDFReport(@Param('date') date: string, @Res() res: Response) {
    try {
      const pdfBuffer = await this.reportService.generateCashClosingDetailPDF(date);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cierre-caja-${date}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });
      
      res.end(pdfBuffer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener estadísticas para el modal
  @Get('stats/:date')
  async getCashClosingStats(@Param('date') date: string) {
    return this.reportService.getCashClosingStats(date);
  }

  // ========== CIERRES MENSUALES ==========

  // Generar cierre mensual (datos JSON)
  @Get('monthly/:year/:month')
  async generateMonthlyClosing(
    @Param('year') year: string,
    @Param('month') month: string
  ) {
    return this.monthlyService.generateMonthlyClosing(Number(year), Number(month));
  }

  // Generar PDF del cierre mensual
  @Get('monthly/pdf/:year/:month')
  async generateMonthlyPDF(
    @Param('year') year: string,
    @Param('month') month: string,
    @Res() res: Response
  ) {
    try {
      const pdfBuffer = await this.monthlyService.generateMonthlyClosingPDF(
        Number(year),
        Number(month)
      );
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cierre-mensual-${year}-${month.padStart(2, '0')}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });
      
      res.end(pdfBuffer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener meses disponibles para cierre
  @Get('monthly/available')
  async getAvailableMonths() {
    return this.monthlyService.getAvailableMonths();
  }
}

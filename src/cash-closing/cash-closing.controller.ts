import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CashClosingService } from './cash-closing.service';
import { CreateCashClosingDto } from './dto/create-cash-closing.dto';
// Si usas autenticación, puedes usar JwtAuthGuard aquí
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cash-closing')
// @UseGuards(JwtAuthGuard)
export class CashClosingController {
  constructor(private readonly cashClosingService: CashClosingService) {}

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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cashClosingService.findOne(Number(id));
  }
}

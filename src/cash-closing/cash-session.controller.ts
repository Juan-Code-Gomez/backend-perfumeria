import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { CashSessionService, OpenCashSessionDto, CloseCashSessionDto } from './cash-session.service';

@Controller('cash-session')
export class CashSessionController {
  constructor(private readonly cashSessionService: CashSessionService) {}

  /**
   * Abrir nueva sesión de caja
   */
  @Post('open')
  async openSession(@Body() dto: OpenCashSessionDto, @Req() req: any) {
    // const userId = req.user?.userId; // Si tienes auth
    return this.cashSessionService.openCashSession(dto /*, userId*/);
  }

  /**
   * Cerrar sesión de caja activa
   */
  @Post('close')
  async closeSession(@Body() dto: CloseCashSessionDto, @Req() req: any) {
    // const userId = req.user?.userId; // Si tienes auth
    return this.cashSessionService.closeCashSession(dto /*, userId*/);
  }

  /**
   * Obtener sesión activa actual
   */
  @Get('active')
  async getActiveSession() {
    return this.cashSessionService.getActiveSession();
  }

  /**
   * ENDPOINT DE EMERGENCIA: Cerrar todas las sesiones activas
   * Útil para resolver problemas de sesiones que quedaron abiertas
   */
  @Post('force-close-all')
  async forceCloseAllActiveSessions() {
    return this.cashSessionService.forceCloseAllActiveSessions();
  }

  /**
   * Listar sesiones
   */
  @Get()
  async getSessions(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('includeActive') includeActive = 'true'
  ) {
    return this.cashSessionService.getSessions(
      dateFrom,
      dateTo,
      includeActive === 'true'
    );
  }

  /**
   * Obtener datos para reporte PDF de sesión
   */
  @Get(':sessionId/report')
  async getSessionReport(@Param('sessionId') sessionId: string) {
    return this.cashSessionService.getSessionReportData(Number(sessionId));
  }
}
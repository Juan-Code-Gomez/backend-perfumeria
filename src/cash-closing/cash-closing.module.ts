import { Module } from '@nestjs/common';
import { CashClosingService } from './cash-closing.service';
import { CashClosingController } from './cash-closing.controller';
import { CashSessionService } from './cash-session.service';
import { CashSessionController } from './cash-session.controller';
import { CashClosingReportService } from './cash-closing-report.service';
import { MonthlyClosingService } from './monthly-closing.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CashClosingService, CashSessionService, CashClosingReportService, MonthlyClosingService],
  controllers: [CashClosingController, CashSessionController],
  exports: [CashSessionService, CashClosingReportService, MonthlyClosingService] // Para usar en otros módulos si es necesario
})
export class CashClosingModule {}

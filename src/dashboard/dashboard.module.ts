import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CapitalModule } from '../capital/capital.module';
import { InvoiceModule } from '../invoice/invoice.module';

@Module({
  imports: [PrismaModule, CapitalModule, InvoiceModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

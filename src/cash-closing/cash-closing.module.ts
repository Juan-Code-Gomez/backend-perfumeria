import { Module } from '@nestjs/common';
import { CashClosingService } from './cash-closing.service';
import { CashClosingController } from './cash-closing.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CashClosingService],
  controllers: [CashClosingController],
})
export class CashClosingModule {}

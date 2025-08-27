import { Module } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { ExpenseController } from './expense.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CapitalAutoService } from '../services/capital-auto.service';

@Module({
  imports: [PrismaModule],
  providers: [ExpenseService, CapitalAutoService],
  controllers: [ExpenseController],
})
export class ExpenseModule {}

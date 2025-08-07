import { Module } from '@nestjs/common';
import { RecurringExpenseService } from './recurring-expense.service';
import { RecurringExpenseController } from './recurring-expense.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RecurringExpenseController],
  providers: [RecurringExpenseService],
})
export class RecurringExpenseModule {}

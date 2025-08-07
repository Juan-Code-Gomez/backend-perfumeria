import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { RecurringExpenseService } from './recurring-expense.service';
import { CreateRecurringExpenseDto, UpdateRecurringExpenseDto } from './dto/create-recurring-expense.dto';

@Controller('recurring-expenses')
export class RecurringExpenseController {
  constructor(private svc: RecurringExpenseService) {}

  @Post() create(@Body() dto: CreateRecurringExpenseDto) {
    return this.svc.create(dto);
  }

  @Get() findAll() {
    return this.svc.findAll();
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRecurringExpenseDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}

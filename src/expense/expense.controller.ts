import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseBoolPipe } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/create-expense.dto';

@Controller('expenses')
export class ExpenseController {
  constructor(private readonly svc: ExpenseService) {}

  @Post()
  create(@Body() dto: CreateExpenseDto) {
    return this.svc.create(dto);
  }

  @Get()
  findAll(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('category') category?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('search') search?: string,
    @Query('isRecurring') isRecurring?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    // Convertir isRecurring string a boolean si existe
    let isRecurringBool: boolean | undefined;
    if (isRecurring !== undefined) {
      isRecurringBool = isRecurring === 'true';
    }
    
    return this.svc.findAll({
      dateFrom, dateTo, category, paymentMethod, search, 
      isRecurring: isRecurringBool,
      page: Number(page), pageSize: Number(pageSize),
    });
  }

  @Get('summary')
  getSummary(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.svc.getSummary({ dateFrom, dateTo });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.svc.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(+id);
  }
}

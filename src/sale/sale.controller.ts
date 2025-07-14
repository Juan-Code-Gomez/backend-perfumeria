import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { SaleService } from './sale.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CreateSalePaymentDto } from './dto/create-sale-payment.dto';

@Controller('sales')
export class SaleController {
  constructor(private readonly saleService: SaleService) {}

  @Get('pending')
  async getPendingSales() {
    return this.saleService.getPendingSales();
  }

  @Post()
  async create(@Body() createSaleDto: CreateSaleDto) {
    return this.saleService.create(createSaleDto);
  }

  @Get()
  async findAll(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.saleService.findAll({ dateFrom, dateTo });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.saleService.findOne(Number(id));
  }

  @Post(':id/payments')
  async addPayment(@Param('id') id: string, @Body() dto: CreateSalePaymentDto) {
    return this.saleService.addPayment(Number(id), dto);
  }

  // GET /sales/:id/payments
  @Get(':id/payments')
  async getPayments(@Param('id') id: string) {
    return this.saleService.getPayments(Number(id));
  }
}

import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { SaleService } from './sale.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Controller('sales')
export class SaleController {
  constructor(private readonly saleService: SaleService) {}

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
}

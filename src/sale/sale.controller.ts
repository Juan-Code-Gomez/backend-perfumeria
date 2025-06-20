// src/sale/sale.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { SaleService } from './sale.service';

@Controller('sales')
export class SaleController {
  constructor(private readonly saleService: SaleService) {}

  @Post()
  create(@Body() body: any) {
    return this.saleService.create(body);
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.saleService.findAll(query);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.saleService.update(Number(id), body);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.saleService.findOne(id);
  }
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.saleService.remove(Number(id));
  }
}

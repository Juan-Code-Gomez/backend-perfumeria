// src/invoice/invoice.controller.ts
import { Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto, UpdateInvoiceDto, PayInvoiceDto } from './dto/create-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoiceService.create(createInvoiceDto);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('overdue') overdue?: string,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (overdue === 'true') filters.overdue = true;
    
    return this.invoiceService.findAll(filters);
  }

  @Get('summary')
  getInvoiceSummary() {
    return this.invoiceService.getInvoiceSummary();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoiceService.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.invoiceService.update(Number(id), updateInvoiceDto);
  }

  @Post(':id/pay')
  payInvoice(@Param('id') id: string, @Body() payInvoiceDto: PayInvoiceDto) {
    return this.invoiceService.payInvoice(Number(id), payInvoiceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.invoiceService.remove(Number(id));
  }
}

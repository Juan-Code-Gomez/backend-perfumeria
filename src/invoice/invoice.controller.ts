// src/invoice/invoice.controller.ts
import { Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto, UpdateInvoiceDto, PayInvoiceDto } from './dto/create-invoice.dto';
import { CreateInvoicePaymentDto } from './dto/create-invoice-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createInvoiceDto: CreateInvoiceDto) {
    try {
      console.log('📝 Creando factura con datos:', JSON.stringify(createInvoiceDto, null, 2));
      const result = await this.invoiceService.create(createInvoiceDto);
      console.log('✅ Factura creada exitosamente:', result?.id);
      return result;
    } catch (error) {
      console.error('❌ ERROR COMPLETO AL CREAR FACTURA:');
      console.error('Tipo:', error.constructor.name);
      console.error('Mensaje:', error.message);
      console.error('Stack:', error.stack);
      console.error('Code:', error.code);
      console.error('Meta:', error.meta);
      console.error('Datos enviados:', JSON.stringify(createInvoiceDto, null, 2));
      throw error;
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query('status') status?: string,
    @Query('overdue') overdue?: string,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (overdue === 'true') filters.overdue = true;
    
    return this.invoiceService.findAll(filters);
  }

  @Get('debug')
  async debugInvoices() {
    try {
      // Paso 1: Verificar conexión a la base de datos
      const dbTest = await this.invoiceService.testDatabaseConnection();
      
      // Paso 2: Contar registros sin relaciones
      const simpleCount = await this.invoiceService.getSimpleCount();
      
      // Paso 3: Intentar obtener un registro básico
      const firstInvoice = await this.invoiceService.getFirstInvoiceBasic();
      
      // Paso 4: Intentar con relaciones
      const firstInvoiceWithRelations = await this.invoiceService.getFirstInvoiceWithRelations();
      
      return {
        status: 'success',
        timestamp: new Date().toISOString(),
        tests: {
          databaseConnection: dbTest,
          simpleCount,
          firstInvoiceBasic: firstInvoice,
          firstInvoiceWithRelations
        }
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  getInvoiceSummary() {
    return this.invoiceService.getInvoiceSummary();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.invoiceService.findOne(Number(id));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.invoiceService.update(Number(id), updateInvoiceDto);
  }

  @Post(':id/pay')
  @UseGuards(JwtAuthGuard)
  payInvoice(@Param('id') id: string, @Body() payInvoiceDto: PayInvoiceDto) {
    return this.invoiceService.payInvoice(Number(id), payInvoiceDto);
  }

  @Post('payments')
  @UseGuards(JwtAuthGuard)
  registerPayment(@Body() createPaymentDto: CreateInvoicePaymentDto) {
    return this.invoiceService.registerPayment(createPaymentDto);
  }

  @Get(':id/payments')
  @UseGuards(JwtAuthGuard)
  getPaymentHistory(@Param('id') id: string) {
    return this.invoiceService.getPaymentHistory(Number(id));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.invoiceService.remove(Number(id));
  }
}

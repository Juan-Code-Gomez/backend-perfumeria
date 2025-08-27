import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('suppliers')
@UseGuards(JwtAuthGuard)
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.supplierService.create(createSupplierDto);
  }

  @Get()
  findAll(
    @Query('includeInactive') includeInactive?: string,
    @Query('search') search?: string,
    @Query('supplierType') supplierType?: string,
    @Query('paymentTerms') paymentTerms?: string,
    @Query('isPreferred') isPreferred?: string,
    @Query('withDebt') withDebt?: string
  ) {
    const includeInactiveFlag = includeInactive === 'true';
    const isPreferredFlag = isPreferred === 'true';
    const withDebtFlag = withDebt === 'true';
    
    return this.supplierService.findAll({ 
      includeInactive: includeInactiveFlag, 
      search,
      supplierType,
      paymentTerms,
      isPreferred: isPreferred ? isPreferredFlag : undefined,
      withDebt: withDebtFlag,
    });
  }

  @Get('statistics')
  getStatistics() {
    return this.supplierService.getStatistics();
  }

  @Get('by-type/:type')
  getSuppliersByType(@Param('type') type: string) {
    return this.supplierService.getSuppliersByType(type);
  }

  @Get('with-debt')
  getSuppliersWithDebt() {
    return this.supplierService.getSuppliersWithDebt();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.supplierService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateSupplierDto: UpdateSupplierDto) {
    return this.supplierService.update(+id, updateSupplierDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.supplierService.remove(+id);
  }

  @Put(':id/toggle-status')
  toggleStatus(@Param('id') id: string) {
    return this.supplierService.toggleStatus(+id);
  }

  @Put(':id/toggle-preferred')
  togglePreferred(@Param('id') id: string) {
    return this.supplierService.togglePreferred(+id);
  }

  @Put(':id/debt')
  updateDebt(
    @Param('id') id: string,
    @Body() body: { amount: number; operation: 'ADD' | 'SUBTRACT' }
  ) {
    return this.supplierService.updateDebt(+id, body.amount, body.operation);
  }

  @Get('financial/summary')
  getFinancialSummary() {
    return this.supplierService.getFinancialSummary();
  }

  @Post(':id/payment')
  registerPayment(
    @Param('id') id: string,
    @Body() body: { 
      amount: number; 
      paymentMethod: string; 
      description?: string;
    }
  ) {
    return this.supplierService.registerPayment(+id, body.amount, body.paymentMethod, body.description);
  }
}

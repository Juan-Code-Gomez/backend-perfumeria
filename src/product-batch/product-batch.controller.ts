// src/product-batch/product-batch.controller.ts
import { Controller, Get, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ProductBatchService } from './product-batch.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('product-batches')
@UseGuards(JwtAuthGuard)
export class ProductBatchController {
  constructor(private readonly batchService: ProductBatchService) {}

  /**
   * GET /product-batches/product/:id
   * Obtiene todos los lotes de un producto específico
   */
  @Get('product/:id')
  async getBatchesByProduct(@Param('id', ParseIntPipe) productId: number) {
    return this.batchService.getBatchesByProduct(productId);
  }

  /**
   * GET /product-batches/valuation
   * Obtiene la valorización total del inventario
   */
  @Get('valuation')
  async getInventoryValuation() {
    return this.batchService.getInventoryValuation();
  }

  /**
   * GET /product-batches/expiring
   * Obtiene lotes próximos a vencer
   * Query param: days (default: 30)
   */
  @Get('expiring')
  async getExpiringBatches(@Query('days') days?: string) {
    const daysThreshold = days ? parseInt(days, 10) : 30;
    return this.batchService.getExpiringBatches(daysThreshold);
  }

  /**
   * GET /product-batches/expired
   * Obtiene lotes ya vencidos con stock
   */
  @Get('expired')
  async getExpiredBatches() {
    return this.batchService.getExpiredBatches();
  }
}

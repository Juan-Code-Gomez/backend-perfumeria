import {
  Controller,
  Get,
  Post,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { InventoryAutomationService } from './inventory-automation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('inventory-automation')
@UseGuards(JwtAuthGuard)
export class InventoryAutomationController {
  constructor(
    private readonly inventoryAutomationService: InventoryAutomationService,
  ) {}

  // ===== ENDPOINTS DE ANÁLISIS =====

  @Get('analytics')
  async getInventoryAnalytics() {
    return {
      success: true,
      data: await this.inventoryAutomationService.getInventoryAnalytics(),
    };
  }

  @Get('reorder-suggestions')
  async getReorderSuggestions() {
    return {
      success: true,
      data: await this.inventoryAutomationService.getReorderSuggestions(),
    };
  }

  @Get('stock-predictions')
  async getStockPredictions() {
    return {
      success: true,
      data: await this.inventoryAutomationService.predictStockOutages(),
    };
  }

  @Get('dead-stock')
  async getDeadStock() {
    return {
      success: true,
      data: await this.inventoryAutomationService.detectDeadStock(),
    };
  }

  // ===== ENDPOINTS DE ACCIONES MANUALES =====

  @Post('trigger-automation')
  async triggerInventoryAutomation() {
    try {
      await this.inventoryAutomationService.runInventoryAutomation();
      return {
        success: true,
        message: 'Automatización de inventario ejecutada correctamente',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error ejecutando automatización de inventario',
        error: error.message,
      };
    }
  }

  @Post('generate-daily-report')
  async generateDailyReport() {
    try {
      const report = await this.inventoryAutomationService.generateDailyInventoryReport();
      return {
        success: true,
        data: report,
        message: 'Reporte diario generado correctamente',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error generando reporte diario',
        error: error.message,
      };
    }
  }

  @Post('optimize-stock-levels')
  async optimizeStockLevels() {
    try {
      const results = await this.inventoryAutomationService.optimizeStockLevels();
      return {
        success: true,
        data: results,
        message: 'Optimización de stock completada',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error optimizando niveles de stock',
        error: error.message,
      };
    }
  }
}

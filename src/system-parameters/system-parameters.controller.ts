import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SystemParametersService, CreateSystemParameterDto, UpdateSystemParameterDto } from './system-parameters.service';

@Controller('system-parameters')
@UseGuards(JwtAuthGuard)
export class SystemParametersController {
  constructor(private readonly systemParametersService: SystemParametersService) {}

  /**
   * Obtener todos los parámetros del sistema (solo administradores)
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAllParameters(@Query('companyId') companyId?: string) {
    try {
      const parameters = await this.systemParametersService.getAllParameters(
        companyId ? parseInt(companyId) : undefined
      );
      return {
        success: true,
        data: parameters,
        total: parameters.length,
      };
    } catch (error) {
      throw new HttpException(
        `Error al obtener parámetros: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtener parámetros por categoría
   */
  @Get('category/:category')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'MANAGER')
  async getParametersByCategory(
    @Param('category') category: string,
    @Query('companyId') companyId?: string,
  ) {
    try {
      const parameters = await this.systemParametersService.getParametersByCategory(
        category,
        companyId ? parseInt(companyId) : undefined
      );
      return {
        success: true,
        data: parameters,
        category,
      };
    } catch (error) {
      throw new HttpException(
        `Error al obtener parámetros de categoría ${category}: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtener un parámetro específico
   */
  @Get('key/:key')
  async getParameter(
    @Param('key') key: string,
    @Query('companyId') companyId?: string,
  ) {
    try {
      const value = await this.systemParametersService.getParameter(
        key,
        companyId ? parseInt(companyId) : undefined
      );
      
      if (value === null) {
        throw new HttpException(
          `Parámetro '${key}' no encontrado`,
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        key,
        value,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error al obtener parámetro ${key}: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtener configuración del POS
   */
  @Get('pos/configuration')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'MANAGER', 'VENDEDOR')
  async getPosConfiguration(@Query('companyId') companyId?: string) {
    try {
      const config = await this.systemParametersService.getPosConfiguration(
        companyId ? parseInt(companyId) : undefined
      );
      return {
        success: true,
        data: config,
      };
    } catch (error) {
      throw new HttpException(
        `Error al obtener configuración del POS: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crear un nuevo parámetro (solo super admin)
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  async createParameter(@Body() dto: CreateSystemParameterDto) {
    try {
      const parameter = await this.systemParametersService.createParameter(dto);
      return {
        success: true,
        message: 'Parámetro creado exitosamente',
        data: parameter,
      };
    } catch (error) {
      throw new HttpException(
        `Error al crear parámetro: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Actualizar un parámetro existente (solo administradores)
   */
  @Put(':key')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateParameter(
    @Param('key') key: string,
    @Body() dto: UpdateSystemParameterDto,
    @Query('companyId') companyId?: string,
  ) {
    try {
      const parameter = await this.systemParametersService.updateParameter(
        key,
        dto,
        companyId ? parseInt(companyId) : undefined
      );
      return {
        success: true,
        message: 'Parámetro actualizado exitosamente',
        data: parameter,
      };
    } catch (error) {
      throw new HttpException(
        `Error al actualizar parámetro ${key}: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Limpiar cache de parámetros (solo administradores)
   */
  @Post('cache/clear')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async clearCache() {
    try {
      this.systemParametersService.clearAllCache();
      return {
        success: true,
        message: 'Cache de parámetros limpiado exitosamente',
      };
    } catch (error) {
      throw new HttpException(
        `Error al limpiar cache: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Endpoints específicos para el POS (acceso más permisivo)
   */
  @Get('pos/edit-cost-enabled')
  async isPosEditCostEnabled(@Query('companyId') companyId?: string) {
    try {
      const enabled = await this.systemParametersService.isPosEditCostEnabled(
        companyId ? parseInt(companyId) : undefined
      );
      return {
        success: true,
        enabled,
      };
    } catch (error) {
      throw new HttpException(
        `Error al verificar configuración de edición de costo: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('pos/profit-margin-visible')
  async isProfitMarginVisible(@Query('companyId') companyId?: string) {
    try {
      const visible = await this.systemParametersService.isProfitMarginVisible(
        companyId ? parseInt(companyId) : undefined
      );
      return {
        success: true,
        visible,
      };
    } catch (error) {
      throw new HttpException(
        `Error al verificar configuración de margen: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Inicializar parámetros por defecto (solo super admin)
   */
  @Post('initialize')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  async initializeParameters() {
    try {
      const defaultParameters = [
        {
          parameterKey: 'pos_edit_cost_enabled',
          parameterValue: false,
          description: 'Permite editar el costo del producto en el punto de venta',
          category: 'pos'
        },
        {
          parameterKey: 'pos_show_profit_margin',
          parameterValue: true,
          description: 'Mostrar margen de ganancia en tiempo real en POS',
          category: 'pos'
        },
        {
          parameterKey: 'audit_track_cost_changes',
          parameterValue: true,
          description: 'Auditar cambios en costos de productos',
          category: 'security'
        }
      ];

      const results: any[] = [];
      for (const param of defaultParameters) {
        try {
          const created = await this.systemParametersService.createParameter(param);
          results.push({ success: true, parameter: param.parameterKey, data: created });
        } catch (error) {
          results.push({ success: false, parameter: param.parameterKey, error: error.message });
        }
      }

      return {
        success: true,
        message: 'Inicialización de parámetros completada',
        results,
      };
    } catch (error) {
      throw new HttpException(
        `Error al inicializar parámetros: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
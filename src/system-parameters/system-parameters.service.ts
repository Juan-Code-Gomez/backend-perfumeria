import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemParameter } from '@prisma/client';

export interface CreateSystemParameterDto {
  parameterKey: string;
  parameterValue?: boolean;
  parameterType?: 'boolean' | 'string' | 'number' | 'json';
  stringValue?: string;
  numberValue?: number;
  jsonValue?: any;
  description?: string;
  category?: string;
  companyId?: number;
}

export interface UpdateSystemParameterDto {
  parameterValue?: boolean;
  stringValue?: string;
  numberValue?: number;
  jsonValue?: any;
  description?: string;
  isActive?: boolean;
}

@Injectable()
export class SystemParametersService {
  private readonly logger = new Logger(SystemParametersService.name);
  
  // Cache para parámetros frecuentemente usados
  private parametersCache = new Map<string, any>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor(private prisma: PrismaService) {}

  /**
   * Obtener todos los parámetros del sistema
   */
  async getAllParameters(companyId?: number): Promise<SystemParameter[]> {
    return this.prisma.systemParameter.findMany({
      where: {
        companyId: companyId || null,
        isActive: true,
      },
      orderBy: [
        { category: 'asc' },
        { parameterKey: 'asc' },
      ],
    });
  }

  /**
   * Obtener parámetros por categoría
   */
  async getParametersByCategory(category: string, companyId?: number): Promise<SystemParameter[]> {
    return this.prisma.systemParameter.findMany({
      where: {
        category,
        companyId: companyId || null,
        isActive: true,
      },
      orderBy: { parameterKey: 'asc' },
    });
  }

  /**
   * Obtener un parámetro específico (con cache)
   */
  async getParameter(key: string, companyId?: number): Promise<any> {
    const cacheKey = `${key}_${companyId || 'global'}`;
    
    // Verificar cache
    if (this.parametersCache.has(cacheKey)) {
      const expiry = this.cacheExpiry.get(cacheKey);
      if (expiry && expiry > Date.now()) {
        return this.parametersCache.get(cacheKey);
      }
    }

    try {
      const parameter = await this.prisma.systemParameter.findFirst({
        where: {
          parameterKey: key,
          companyId: companyId || null,
          isActive: true,
        },
      });

      if (!parameter) {
        this.logger.warn(`Parámetro no encontrado: ${key}`);
        return null;
      }

      // Determinar el valor según el tipo
      let value: any;
      switch (parameter.parameterType) {
        case 'boolean':
          value = parameter.parameterValue;
          break;
        case 'string':
          value = parameter.stringValue;
          break;
        case 'number':
          value = parameter.numberValue;
          break;
        case 'json':
          value = parameter.jsonValue;
          break;
        default:
          value = parameter.parameterValue;
      }

      // Actualizar cache
      this.parametersCache.set(cacheKey, value);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);

      return value;
    } catch (error) {
      this.logger.error(`Error al obtener parámetro ${key}:`, error);
      return null;
    }
  }

  /**
   * Métodos de conveniencia para tipos específicos
   */
  async getBooleanParameter(key: string, companyId?: number, defaultValue = false): Promise<boolean> {
    const value = await this.getParameter(key, companyId);
    return value !== null ? Boolean(value) : defaultValue;
  }

  async getStringParameter(key: string, companyId?: number, defaultValue = ''): Promise<string> {
    const value = await this.getParameter(key, companyId);
    return value !== null ? String(value) : defaultValue;
  }

  async getNumberParameter(key: string, companyId?: number, defaultValue = 0): Promise<number> {
    const value = await this.getParameter(key, companyId);
    return value !== null ? Number(value) : defaultValue;
  }

  /**
   * Crear un nuevo parámetro
   */
  async createParameter(dto: CreateSystemParameterDto): Promise<SystemParameter> {
    const parameter = await this.prisma.systemParameter.create({
      data: {
        parameterKey: dto.parameterKey,
        parameterValue: dto.parameterValue || false,
        parameterType: dto.parameterType || 'boolean',
        stringValue: dto.stringValue,
        numberValue: dto.numberValue,
        jsonValue: dto.jsonValue,
        description: dto.description,
        category: dto.category || 'general',
        companyId: dto.companyId,
      },
    });

    // Limpiar cache
    this.clearCache(dto.parameterKey, dto.companyId);
    
    this.logger.log(`Parámetro creado: ${dto.parameterKey}`);
    return parameter;
  }

  /**
   * Actualizar un parámetro existente
   */
  async updateParameter(key: string, dto: UpdateSystemParameterDto, companyId?: number): Promise<SystemParameter> {
    const parameter = await this.prisma.systemParameter.update({
      where: { 
        parameterKey: key,
      },
      data: {
        parameterValue: dto.parameterValue,
        stringValue: dto.stringValue,
        numberValue: dto.numberValue,
        jsonValue: dto.jsonValue,
        description: dto.description,
        isActive: dto.isActive,
        updatedAt: new Date(),
      },
    });

    // Limpiar cache
    this.clearCache(key, companyId);
    
    this.logger.log(`Parámetro actualizado: ${key}`);
    return parameter;
  }

  /**
   * Métodos específicos para funcionalidades del POS
   */
  async isPosEditCostEnabled(companyId?: number): Promise<boolean> {
    return this.getBooleanParameter('pos_edit_cost_enabled', companyId, false);
  }

  async isProfitMarginVisible(companyId?: number): Promise<boolean> {
    return this.getBooleanParameter('pos_show_profit_margin', companyId, true);
  }

  async isAuditLogEnabled(companyId?: number): Promise<boolean> {
    return this.getBooleanParameter('audit_log_enabled', companyId, true);
  }

  /**
   * Nuevo: Verificar si se permite seleccionar fecha manual en ventas
   */
  async isManualSaleDateEnabled(companyId?: number): Promise<boolean> {
    return this.getBooleanParameter('allow_manual_sale_date', companyId, false);
  }

  /**
   * Limpiar cache
   */
  private clearCache(key: string, companyId?: number): void {
    const cacheKey = `${key}_${companyId || 'global'}`;
    this.parametersCache.delete(cacheKey);
    this.cacheExpiry.delete(cacheKey);
  }

  /**
   * Limpiar todo el cache
   */
  clearAllCache(): void {
    this.parametersCache.clear();
    this.cacheExpiry.clear();
    this.logger.log('Cache de parámetros limpiado');
  }

  /**
   * Obtener configuración completa del POS
   */
  async getPosConfiguration(companyId?: number) {
    const [
      editCostEnabled,
      showProfitMargin,
      requireCustomer,
      negativeStockAllowed,
      allowManualSaleDate,
    ] = await Promise.all([
      this.isPosEditCostEnabled(companyId),
      this.isProfitMarginVisible(companyId),
      this.getBooleanParameter('sales_require_customer', companyId, false),
      this.getBooleanParameter('inventory_negative_stock', companyId, false),
      this.isManualSaleDateEnabled(companyId),
    ]);

    return {
      editCostEnabled,
      showProfitMargin,
      requireCustomer,
      negativeStockAllowed,
      allowManualSaleDate,
    };
  }
}
// src/features/features.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeatureDto, CreateTenantFeatureDto, CreateCustomFieldDto } from './dto/features.dto';

@Injectable()
export class FeaturesService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // FEATURES GLOBALES
  // ============================================

  /**
   * Crear un nuevo feature en el catálogo global
   */
  async createFeature(dto: CreateFeatureDto) {
    return this.prisma.feature.create({
      data: dto,
    });
  }

  /**
   * Obtener todos los features disponibles en el sistema
   */
  async getAllFeatures() {
    return this.prisma.feature.findMany({
      where: { isActive: true },
      orderBy: { module: 'asc' },
    });
  }

  /**
   * Obtener un feature por código
   */
  async getFeatureByCode(code: string) {
    const feature = await this.prisma.feature.findUnique({
      where: { code },
    });

    if (!feature) {
      throw new NotFoundException(`Feature con código "${code}" no encontrado`);
    }

    return feature;
  }

  // ============================================
  // FEATURES POR TENANT (CLIENTE)
  // ============================================

  /**
   * Verificar si un tenant tiene un feature activado
   */
  async hasFeature(tenantId: number, featureCode: string): Promise<boolean> {
    const tenantFeature = await this.prisma.tenantFeature.findUnique({
      where: {
        tenantId_featureCode: {
          tenantId,
          featureCode,
        },
      },
    });

    return tenantFeature?.isEnabled || false;
  }

  /**
   * Obtener todos los features de un tenant
   */
  async getTenantFeatures(tenantId: number) {
    return this.prisma.tenantFeature.findMany({
      where: { 
        tenantId,
        isEnabled: true 
      },
      include: { 
        feature: true 
      },
      orderBy: {
        feature: {
          module: 'asc'
        }
      }
    });
  }

  /**
   * Obtener configuración de un feature específico
   */
  async getFeatureConfig(tenantId: number, featureCode: string) {
    const tenantFeature = await this.prisma.tenantFeature.findUnique({
      where: {
        tenantId_featureCode: { tenantId, featureCode },
      },
    });

    if (!tenantFeature) {
      return null;
    }

    return tenantFeature.configuration || {};
  }

  /**
   * Activar un feature para un tenant
   */
  async enableFeature(dto: CreateTenantFeatureDto) {
    // Verificar que el tenant existe
    const tenant = await this.prisma.companyConfig.findUnique({
      where: { id: dto.tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant con ID ${dto.tenantId} no encontrado`);
    }

    // Verificar que el feature existe
    await this.getFeatureByCode(dto.featureCode);

    // Activar o actualizar el feature
    return this.prisma.tenantFeature.upsert({
      where: {
        tenantId_featureCode: {
          tenantId: dto.tenantId,
          featureCode: dto.featureCode,
        },
      },
      create: {
        tenantId: dto.tenantId,
        featureCode: dto.featureCode,
        isEnabled: true,
        configuration: dto.configuration,
      },
      update: {
        isEnabled: true,
        configuration: dto.configuration,
      },
      include: {
        feature: true,
      },
    });
  }

  /**
   * Desactivar un feature para un tenant
   */
  async disableFeature(tenantId: number, featureCode: string) {
    const tenantFeature = await this.prisma.tenantFeature.findUnique({
      where: {
        tenantId_featureCode: { tenantId, featureCode },
      },
    });

    if (!tenantFeature) {
      throw new NotFoundException(
        `Feature "${featureCode}" no encontrado para el tenant ${tenantId}`
      );
    }

    return this.prisma.tenantFeature.update({
      where: {
        tenantId_featureCode: { tenantId, featureCode },
      },
      data: {
        isEnabled: false,
      },
    });
  }

  /**
   * Actualizar configuración de un feature
   */
  async updateFeatureConfig(
    tenantId: number,
    featureCode: string,
    configuration: any
  ) {
    const tenantFeature = await this.prisma.tenantFeature.findUnique({
      where: {
        tenantId_featureCode: { tenantId, featureCode },
      },
    });

    if (!tenantFeature) {
      throw new NotFoundException(
        `Feature "${featureCode}" no encontrado para el tenant ${tenantId}`
      );
    }

    return this.prisma.tenantFeature.update({
      where: {
        tenantId_featureCode: { tenantId, featureCode },
      },
      data: {
        configuration,
      },
    });
  }

  // ============================================
  // CUSTOM FIELDS (CAMPOS PERSONALIZADOS)
  // ============================================

  /**
   * Obtener campos personalizados de un tenant para un módulo
   */
  async getCustomFields(tenantId: number, module: string) {
    return this.prisma.tenantCustomField.findMany({
      where: {
        tenantId,
        module,
        isActive: true,
      },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Obtener todos los campos personalizados de un tenant
   */
  async getAllCustomFields(tenantId: number) {
    return this.prisma.tenantCustomField.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      orderBy: [
        { module: 'asc' },
        { order: 'asc' }
      ],
    });
  }

  /**
   * Crear un campo personalizado
   */
  async createCustomField(dto: CreateCustomFieldDto) {
    // Verificar que el tenant existe
    const tenant = await this.prisma.companyConfig.findUnique({
      where: { id: dto.tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant con ID ${dto.tenantId} no encontrado`);
    }

    return this.prisma.tenantCustomField.create({
      data: dto,
    });
  }

  /**
   * Actualizar un campo personalizado
   */
  async updateCustomField(id: number, updateData: Partial<CreateCustomFieldDto>) {
    const field = await this.prisma.tenantCustomField.findUnique({
      where: { id },
    });

    if (!field) {
      throw new NotFoundException(`Campo personalizado con ID ${id} no encontrado`);
    }

    return this.prisma.tenantCustomField.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Eliminar (desactivar) un campo personalizado
   */
  async deleteCustomField(id: number) {
    const field = await this.prisma.tenantCustomField.findUnique({
      where: { id },
    });

    if (!field) {
      throw new NotFoundException(`Campo personalizado con ID ${id} no encontrado`);
    }

    return this.prisma.tenantCustomField.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Obtener resumen completo de features de un tenant
   */
  async getTenantFeaturesSummary(tenantId: number) {
    const [features, customFields, tenant] = await Promise.all([
      this.getTenantFeatures(tenantId),
      this.getAllCustomFields(tenantId),
      this.prisma.companyConfig.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          tenantCode: true,
          tenantName: true,
          industry: true,
          plan: true,
        },
      }),
    ]);

    if (!tenant) {
      throw new NotFoundException(`Tenant con ID ${tenantId} no encontrado`);
    }

    return {
      tenant,
      features: features.map(tf => ({
        code: tf.featureCode,
        name: tf.feature.name,
        module: tf.feature.module,
        configuration: tf.configuration,
      })),
      customFields: customFields.reduce((acc, field) => {
        if (!acc[field.module]) {
          acc[field.module] = [];
        }
        acc[field.module].push({
          id: field.id,
          name: field.fieldName,
          label: field.fieldLabel,
          type: field.fieldType,
          options: field.fieldOptions,
          required: field.isRequired,
        });
        return acc;
      }, {} as Record<string, any[]>),
    };
  }
}

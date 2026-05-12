// src/features/dto/features.dto.ts
import { IsString, IsInt, IsBoolean, IsOptional, IsObject, IsEnum, Min } from 'class-validator';

// ============================================
// FEATURES GLOBALES
// ============================================

export class CreateFeatureDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  module: string;

  @IsOptional()
  @IsEnum(['MODULE', 'FIELD', 'REPORT', 'INTEGRATION'])
  featureType?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ============================================
// FEATURES POR TENANT
// ============================================

export class CreateTenantFeatureDto {
  @IsInt()
  @Min(1)
  tenantId: number;

  @IsString()
  featureCode: string;

  @IsOptional()
  @IsObject()
  configuration?: any;
}

export class UpdateFeatureConfigDto {
  @IsInt()
  @Min(1)
  tenantId: number;

  @IsString()
  featureCode: string;

  @IsObject()
  configuration: any;
}

// ============================================
// CUSTOM FIELDS
// ============================================

export class CreateCustomFieldDto {
  @IsInt()
  @Min(1)
  tenantId: number;

  @IsString()
  module: string;

  @IsString()
  fieldName: string;

  @IsString()
  fieldLabel: string;

  @IsEnum(['text', 'number', 'select', 'date', 'boolean', 'textarea', 'email', 'tel'])
  fieldType: string;

  @IsOptional()
  @IsObject()
  fieldOptions?: any;

  @IsOptional()
  @IsString()
  defaultValue?: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsObject()
  validation?: any;
}

export class UpdateCustomFieldDto {
  @IsOptional()
  @IsString()
  fieldLabel?: string;

  @IsOptional()
  @IsEnum(['text', 'number', 'select', 'date', 'boolean', 'textarea', 'email', 'tel'])
  fieldType?: string;

  @IsOptional()
  @IsObject()
  fieldOptions?: any;

  @IsOptional()
  @IsString()
  defaultValue?: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsObject()
  validation?: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

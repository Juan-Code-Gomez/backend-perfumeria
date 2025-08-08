import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsNumber, 
  IsPositive, 
  Min, 
  IsUrl, 
  IsInt, 
  IsBoolean,
  IsEnum,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  IsDecimal
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// Enums para tipos de productos
export enum ProductType {
  SIMPLE = 'SIMPLE',
  VARIANT = 'VARIANT',
  COMPOSITE = 'COMPOSITE'
}

export enum VariantType {
  ESENCIA = 'ESENCIA',
  PERFUME_11 = 'PERFUME_11',
  SPLASH = 'SPLASH',
  SPLASH_ESCARCHADO = 'SPLASH_ESCARCHADO',
  CREMA = 'CREMA',
  AEROSOL = 'AEROSOL',
  FRASCO = 'FRASCO'
}

export enum Gender {
  MASCULINO = 'MASCULINO',
  FEMENINO = 'FEMENINO',
  UNISEX = 'UNISEX'
}

// DTO para componentes de productos compuestos
export class ProductComponentDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  componentProductId: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  @Transform(({ value }) => parseFloat(value))
  quantity: number;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isOptional?: boolean = false;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  notes?: string;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  description?: string;

  // Códigos de identificación
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim().toUpperCase())
  sku?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  barcode?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  fragranceName?: string;

  // Categorización básica
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  categoryId: number;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  unitId: number;

  // Tipo de producto y variantes
  @IsEnum(ProductType)
  @IsOptional()
  productType?: ProductType = ProductType.SIMPLE;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  size?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  @Transform(({ value }) => parseFloat(value))
  sizeValue?: number;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  brand?: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  // Variantes
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  hasVariants?: boolean = false;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  parentProductId?: number;

  @IsEnum(VariantType)
  @IsOptional()
  variantType?: VariantType;

  // Productos compuestos
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isComposite?: boolean = false;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  requiresPreparation?: boolean = false;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductComponentDto)
  components?: ProductComponentDto[];

  // Inventario
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @Transform(({ value }) => parseFloat(value))
  stock: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  @Transform(({ value }) => parseFloat(value))
  minStock?: number;

  // Precios
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  @Transform(({ value }) => parseFloat(value))
  purchasePrice: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  @Transform(({ value }) => parseFloat(value))
  salePrice: number;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  @Transform(({ value }) => parseFloat(value))
  suggestedPrice?: number;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  @Transform(({ value }) => parseFloat(value))
  minPrice?: number;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  @Transform(({ value }) => parseFloat(value))
  maxPrice?: number;

  // Proveedor
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  supplierId?: number;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  supplierCode?: string;

  // Metadatos
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  notes?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
    return value;
  })
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean = true;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  categoryId?: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  unitId?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  stock?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minStock?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  purchasePrice?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  salePrice?: number;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;
}

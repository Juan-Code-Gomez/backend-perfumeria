import { IsNumber, IsOptional, IsPositive, IsInt, IsString, IsBoolean, IsDateString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateProductPriceDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  productId: number;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  @Transform(({ value }) => parseFloat(value))
  purchasePrice?: number;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  @Transform(({ value }) => parseFloat(value))
  salePrice?: number;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  @Transform(({ value }) => parseFloat(value))
  suggestedPrice?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  supplierId?: number;

  @IsDateString()
  @IsOptional()
  effectiveDate?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  notes?: string;
}

export class UpdateProductPriceDto {
  @IsNumber()
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  @Transform(({ value }) => parseFloat(value))
  purchasePrice?: number;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  @Transform(({ value }) => parseFloat(value))
  salePrice?: number;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  @Transform(({ value }) => parseFloat(value))
  suggestedPrice?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  supplierId?: number;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  notes?: string;
}

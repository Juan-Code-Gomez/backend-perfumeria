import { IsString, IsNotEmpty, IsOptional, IsNumber, IsPositive, Min, IsUrl, IsInt } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  categoryId: number;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  unitId: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minStock?: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  purchasePrice: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  salePrice: number;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;
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

import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT', 
  ADJUST = 'ADJUST'
}

export class CreateProductMovementDto {
  @IsEnum(MovementType)
  type: MovementType;

  @IsNumber()
  @Type(() => Number)
  @Transform(({ value }) => parseFloat(value))
  quantity: number;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  reason?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  notes?: string;
}
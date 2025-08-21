// src/capital/dto/create-capital.dto.ts
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCapitalDto {
  @IsNumber()
  cash: number;

  @IsNumber()
  bank: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCapitalDto {
  @IsOptional()
  @IsNumber()
  cash?: number;

  @IsOptional()
  @IsNumber()
  bank?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

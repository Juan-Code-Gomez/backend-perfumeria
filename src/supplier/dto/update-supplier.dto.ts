import { IsString, IsOptional, IsBoolean, IsNumber, IsEmail, IsIn, IsArray, Length, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateSupplierDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto' })
  @Length(1, 100, { message: 'El nombre debe tener entre 1 y 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsOptional()
  @IsString({ message: 'El NIT debe ser un texto' })
  @Length(5, 20, { message: 'El NIT debe tener entre 5 y 20 caracteres' })
  @Transform(({ value }) => value?.trim())
  nit?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser un texto' })
  @Length(7, 20, { message: 'El teléfono debe tener entre 7 y 20 caracteres' })
  @Transform(({ value }) => value?.trim())
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Debe ser un email válido' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email?: string;

  @IsOptional()
  @IsString({ message: 'La dirección debe ser un texto' })
  @Length(1, 255, { message: 'La dirección debe tener entre 1 y 255 caracteres' })
  @Transform(({ value }) => value?.trim())
  address?: string;

  @IsOptional()
  @IsString({ message: 'La persona de contacto debe ser un texto' })
  @Length(1, 100, { message: 'La persona de contacto debe tener entre 1 y 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  contactPerson?: string;

  @IsOptional()
  @IsString({ message: 'El sitio web debe ser un texto' })
  @Transform(({ value }) => value?.trim())
  website?: string;

  @IsOptional()
  @IsString({ message: 'Los términos de pago deben ser un texto' })
  @IsIn(['CONTADO', '15_DIAS', '30_DIAS', '45_DIAS', '60_DIAS', '90_DIAS'], { 
    message: 'Los términos de pago deben ser: CONTADO, 15_DIAS, 30_DIAS, 45_DIAS, 60_DIAS o 90_DIAS' 
  })
  paymentTerms?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El límite de crédito debe ser un número' })
  @Min(0, { message: 'El límite de crédito debe ser mayor o igual a 0' })
  @Type(() => Number)
  creditLimit?: number;

  @IsOptional()
  @IsNumber({}, { message: 'La deuda actual debe ser un número' })
  @Min(0, { message: 'La deuda actual debe ser mayor o igual a 0' })
  @Type(() => Number)
  currentDebt?: number;

  @IsOptional()
  @IsString({ message: 'El tipo de proveedor debe ser un texto' })
  @IsIn(['ESENCIAS', 'FRASCOS', 'ORIGINALES', 'LOCIONES', 'CREMAS', 'MIXTO'], { 
    message: 'El tipo debe ser: ESENCIAS, FRASCOS, ORIGINALES, LOCIONES, CREMAS o MIXTO' 
  })
  supplierType?: string;

  @IsOptional()
  @IsArray({ message: 'Las categorías especializadas deben ser un array' })
  @IsString({ each: true, message: 'Cada categoría debe ser un texto' })
  specializedCategories?: string[];

  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser verdadero o falso' })
  isActive?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'isPreferred debe ser verdadero o falso' })
  isPreferred?: boolean;

  @IsOptional()
  @IsNumber({}, { message: 'El monto mínimo de pedido debe ser un número' })
  @Min(0, { message: 'El monto mínimo debe ser mayor o igual a 0' })
  @Type(() => Number)
  minOrderAmount?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Los días de entrega deben ser un número' })
  @Min(1, { message: 'Los días de entrega deben ser al menos 1' })
  @Max(365, { message: 'Los días de entrega no pueden ser más de 365' })
  @Type(() => Number)
  leadTimeDays?: number;

  @IsOptional()
  @IsNumber({}, { message: 'La calificación debe ser un número' })
  @Min(1, { message: 'La calificación mínima es 1' })
  @Max(5, { message: 'La calificación máxima es 5' })
  @Type(() => Number)
  rating?: number;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser un texto' })
  @Length(1, 1000, { message: 'Las notas deben tener entre 1 y 1000 caracteres' })
  @Transform(({ value }) => value?.trim())
  notes?: string;
}

import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { SupplierType } from '../enums/supplier-types.enum';

export class CreateSupplierDto {
  // Solo el nombre es obligatorio
  @IsString({ message: 'El nombre debe ser un texto' })
  @Transform(({ value }) => value?.trim())
  name: string;

  // Todos los demás campos son opcionales
  @IsOptional()
  @IsString({ message: 'El NIT/RUT debe ser un texto' })
  @Transform(({ value }) => value?.trim())
  nit?: string;

  @IsOptional()
  @IsEnum(SupplierType, { 
    message: 'El tipo debe ser: ESENCIAS, FRASCOS, ORIGINALES, LOCIONES, CREMAS, MIXTO, DISTRIBUIDOR, FABRICANTE, IMPORTADOR o LOCAL' 
  })
  supplierType?: SupplierType;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser un texto' })
  @Transform(({ value }) => value?.trim())
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Debe ser un email válido' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email?: string;

  @IsOptional()
  @IsString({ message: 'La dirección debe ser un texto' })
  @Transform(({ value }) => value?.trim())
  address?: string;

  // Campos que se mantienen en el backend pero no se usan en el formulario
  @IsOptional()
  @IsString({ message: 'La persona de contacto debe ser un texto' })
  @Transform(({ value }) => value?.trim())
  contactPerson?: string;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser un texto' })
  @Transform(({ value }) => value?.trim())
  notes?: string;
}

import { IsString, IsOptional, IsBoolean, IsIn, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUnitDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto' })
  @Length(1, 50, { message: 'El nombre debe tener entre 1 y 50 caracteres' })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsOptional()
  @IsString({ message: 'El símbolo debe ser un texto' })
  @Length(1, 10, { message: 'El símbolo debe tener entre 1 y 10 caracteres' })
  @Transform(({ value }) => value?.trim())
  symbol?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  @Length(1, 255, { message: 'La descripción debe tener entre 1 y 255 caracteres' })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsOptional()
  @IsString({ message: 'El tipo de unidad debe ser un texto' })
  @IsIn(['VOLUME', 'WEIGHT', 'QUANTITY', 'LENGTH', 'AREA', 'TIME'], { 
    message: 'El tipo debe ser: VOLUME, WEIGHT, QUANTITY, LENGTH, AREA o TIME' 
  })
  unitType?: string;

  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser verdadero o falso' })
  isActive?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'isDecimal debe ser verdadero o falso' })
  isDecimal?: boolean;
}
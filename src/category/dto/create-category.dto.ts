import { IsString, IsNotEmpty, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede tener más de 50 caracteres' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'La descripción no puede tener más de 255 caracteres' })
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(7, { message: 'El color debe ser un código hexadecimal válido' })
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'El icono no puede tener más de 50 caracteres' })
  icon?: string;
}

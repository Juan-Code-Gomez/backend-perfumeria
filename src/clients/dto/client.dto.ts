import { IsString, IsNotEmpty, IsOptional, IsEmail, IsPhoneNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  phone?: string;

  @IsEmail()
  @IsOptional()
  @Transform(({ value }) => value?.trim().toLowerCase())
  email?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  document?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  address?: string;
}

export class UpdateClientDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  phone?: string;

  @IsEmail()
  @IsOptional()
  @Transform(({ value }) => value?.trim().toLowerCase())
  email?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  document?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  address?: string;
}

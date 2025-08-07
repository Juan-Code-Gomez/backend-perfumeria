import { IsString, IsNotEmpty, IsOptional, IsNumber, IsPositive, IsDateString, IsArray, ValidateNested, IsEnum, Min, IsInt } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum PaymentMethod {
  CASH = 'EFECTIVO',
  CARD = 'TARJETA',
  TRANSFER = 'TRANSFERENCIA',
  CREDIT = 'CREDITO'
}

export class SaleDetailDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  productId: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantity: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  unitPrice: number;
}

export class CreateSaleDto {
  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  customerName?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  clientId?: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  totalAmount: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  paidAmount: number;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleDetailDto)
  details: SaleDetailDto[];
}

export class CreateSalePaymentDto {
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount: number;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsEnum(PaymentMethod)
  @IsOptional()
  method?: PaymentMethod;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  note?: string;
}

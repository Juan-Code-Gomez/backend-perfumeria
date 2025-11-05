import { IsString, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PaymentDto {
  @IsString()
  method: string; // 'Efectivo', 'Tarjeta', 'Transferencia', etc.

  @IsString()
  amount: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class ApproveOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentDto)
  payments: PaymentDto[];
}

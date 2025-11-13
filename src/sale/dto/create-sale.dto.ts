import { IsOptional, IsNumber, IsString, IsBoolean, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSaleDetailDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  totalPrice: number;

  @IsOptional()
  @IsNumber()
  purchasePrice?: number;   // Opcional - se obtendrá del producto si no se proporciona

  @IsOptional()
  @IsNumber()
  suggestedPrice?: number;  // Opcional - precio sugerido original
}

export class CreateSalePaymentDto {
  @IsNumber()
  amount: number;

  @IsString()
  method: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateSaleDto {
  @IsOptional()
  @IsString()
  date?: string; // Puede venir "2025-07-10" o "2025-07-10T14:00:00.000Z"

  @IsOptional()
  @IsNumber()
  clientId?: number;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsNumber()
  subtotalAmount: number;

  @IsOptional()
  @IsString()
  discountType?: string; // 'percentage' | 'fixed'

  @IsOptional()
  @IsNumber()
  discountValue?: number;

  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @IsNumber()
  totalAmount: number;

  @IsNumber()
  paidAmount: number;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsString()
  paymentMethod?: string; // Mantener para compatibilidad hacia atrás

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalePaymentDto)
  payments?: CreateSalePaymentDto[]; // Nuevo: múltiples métodos de pago

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleDetailDto)
  details: CreateSaleDetailDto[];
}

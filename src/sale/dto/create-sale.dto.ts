import { IsOptional, IsNumber, IsString, IsBoolean, IsArray, ValidateNested } from 'class-validator';
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
  totalAmount: number;

  @IsNumber()
  paidAmount: number;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleDetailDto)
  details: CreateSaleDetailDto[];
}

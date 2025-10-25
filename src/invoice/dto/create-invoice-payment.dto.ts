import { IsNumber, IsOptional, IsString, IsDateString, Min } from 'class-validator';

export class CreateInvoicePaymentDto {
  @IsNumber()
  invoiceId: number;

  @IsNumber()
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  amount: number;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

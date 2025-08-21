// src/invoice/dto/create-invoice.dto.ts
import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  invoiceNumber: string;

  @IsString()
  supplierName: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsNumber()
  paidAmount?: number;

  @IsOptional()
  @IsString()
  status?: string; // PENDING, PARTIAL, PAID

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  invoiceDate: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateInvoiceDto {
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsNumber()
  paidAmount?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class PayInvoiceDto {
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}

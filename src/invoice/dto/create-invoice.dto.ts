// src/invoice/dto/create-invoice.dto.ts
import { IsString, IsNumber, IsOptional, IsDateString, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceItemDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  quantity: number;

  // Aceptar ambos campos para compatibilidad
  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  unitCost?: number; // Deprecated - mantener para compatibilidad temporal

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  shouldCreateProduct?: boolean;

  @IsOptional()
  @IsBoolean()
  affectInventory?: boolean;

  @IsOptional()
  @IsNumber()
  currentMarketPrice?: number;

  @IsOptional()
  @IsNumber()
  priceVariation?: number;

  @IsOptional()
  @IsNumber()
  profitMargin?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateInvoiceDto {
  @IsString()
  invoiceNumber: string;

  @IsNumber()
  supplierId: number; // Ahora requerimos el ID del proveedor

  @IsOptional()
  @IsNumber()
  discount?: number; // Descuento de la factura

  @IsOptional()
  @IsNumber()
  paidAmount?: number;

  @IsOptional()
  @IsString()
  status?: string; // PENDING, PARTIAL, PAID

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsDateString()
  invoiceDate: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  // Productos de la factura
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @IsOptional()
  @IsBoolean()
  processInventory?: boolean; // Si debe procesar el inventario (crear compra y lotes)
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

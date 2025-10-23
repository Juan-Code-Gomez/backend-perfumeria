// src/invoice/dto/create-invoice.dto.ts
import { IsString, IsNumber, IsOptional, IsDateString, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceItemDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitCost: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  batchNumber?: string; // Número de lote del proveedor

  @IsOptional()
  @IsDateString()
  expiryDate?: string; // Fecha de vencimiento del producto
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

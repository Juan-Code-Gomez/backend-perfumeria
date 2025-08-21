import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ExpenseCategory } from '@prisma/client';

// src/expense/dto/create-expense.dto.ts
export class CreateExpenseDto {
  @IsDateString() date: string;
  @IsNumber() amount: number;
  @IsString() description: string;
  @IsString() category: string;
  @IsString() paymentMethod: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateExpenseDto {
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsNumber() amount?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(ExpenseCategory) category?: ExpenseCategory;
  @IsOptional() @IsString() paymentMethod?: string;
  @IsOptional() @IsString() notes?: string;
}
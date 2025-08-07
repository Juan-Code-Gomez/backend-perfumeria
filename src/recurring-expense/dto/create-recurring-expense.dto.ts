// src/recurring-expense/dto/create-recurring-expense.dto.ts
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ArrayMinSize,
  ArrayMaxSize,
  Min,
  Max,
} from 'class-validator';
import { ExpenseCategory } from '@prisma/client';
import { PartialType } from '@nestjs/mapped-types';

export class CreateRecurringExpenseDto {
  @IsString() concept: string;
  @IsNumber() amount: number;
  @IsEnum(ExpenseCategory) category: ExpenseCategory;
  @IsString() paymentMethod: string;
  @IsOptional() @IsString() notes?: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(28)
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  @Max(28, { each: true })
  daysOfMonth: number[];
}

export class UpdateRecurringExpenseDto extends PartialType(
  CreateRecurringExpenseDto
) {}

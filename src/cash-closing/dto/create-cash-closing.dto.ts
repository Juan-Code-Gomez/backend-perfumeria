import { IsNumber, IsOptional, IsString, IsDateString, Min } from 'class-validator';

export class CreateCashClosingDto {
  @IsDateString()
  date: string; // YYYY-MM-DD

  @IsNumber()
  @Min(0)
  openingCash: number;

  @IsNumber()
  @Min(0)
  closingCash: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalIncome?: number;   // ingresos extra (opcional)

  @IsOptional()
  @IsString()
  notes?: string;
}
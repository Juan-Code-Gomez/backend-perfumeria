import { IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateSalePaymentDto {
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
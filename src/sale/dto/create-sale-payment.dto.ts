export class CreateSalePaymentDto {
  amount: number;
  method?: string;
  note?: string;
  date?: Date;
}
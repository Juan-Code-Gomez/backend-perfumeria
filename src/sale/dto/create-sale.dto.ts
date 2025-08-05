export class CreateSaleDetailDto {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export class CreateSaleDto {
  date?: string; // Puede venir "2025-07-10" o "2025-07-10T14:00:00.000Z"
  clientId?: number;
  customerName?: string;
  totalAmount: number;
  paidAmount: number;
  isPaid?: boolean;
  paymentMethod?: string;
  details: CreateSaleDetailDto[];
}

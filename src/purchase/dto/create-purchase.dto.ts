export class CreatePurchaseDto {
  supplierId: number;
  date?: Date;
  totalAmount: number;
  paidAmount: number;
  isPaid: boolean;
  details: {
    productId: number;
    quantity: number;
    unitCost: number;
  }[];
}
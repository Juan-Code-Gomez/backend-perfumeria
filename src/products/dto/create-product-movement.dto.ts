export class CreateProductMovementDto {
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  price?: number;
  note?: string;
}
export class CreateCreditNoteDto {
  details: Array<{
    productId: number;
    quantity: number;
  }>;
  date?: string; // opcional, formato YYYY-MM-DD
}

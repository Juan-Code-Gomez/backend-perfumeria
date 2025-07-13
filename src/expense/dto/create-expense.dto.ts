// src/expense/dto/create-expense.dto.ts
export class CreateExpenseDto {
  date?: string; // opcional, por defecto today
  amount: number;
  description: string;
  category?: string;
}

export class UpdateExpenseDto {
  amount?: number;
  description?: string;
  category?: string;
  date?: string;
}

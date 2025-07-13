export class CreateCashClosingDto {
  date: string; // YYYY-MM-DD
  openingCash: number;
  closingCash: number;
  totalIncome?: number;   // ingresos extra
  totalExpense?: number;  // gastos
  totalPayments?: number; // pagos a proveedores
  notes?: string;
}
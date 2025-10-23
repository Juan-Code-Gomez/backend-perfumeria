export class CreatePurchaseDto {
  supplierId: number;
  date?: Date | string;
  
  // Datos financieros
  discount?: number; // Descuento aplicado
  paidAmount: number;
  isPaid?: boolean;
  
  // Datos de factura del proveedor (opcionales)
  invoiceNumber?: string;
  invoiceDate?: Date | string;
  dueDate?: Date | string; // Para compras a crédito
  
  // Metadata
  notes?: string;
  
  // Detalles de productos
  details: {
    productId: number;
    quantity: number;
    unitCost: number;
  }[];
}

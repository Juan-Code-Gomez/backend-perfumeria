export interface ExportInventoryResponse {
  success: boolean;
  data?: {
    buffer: Buffer;
    filename: string;
    totalProducts: number;
    totalValue?: number;
    format: string;
    groupBy?: string;
  };
  error?: string;
}
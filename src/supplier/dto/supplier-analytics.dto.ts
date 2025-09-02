// src/supplier/dto/supplier-analytics.dto.ts

export class SupplierAnalyticsDto {
  totalSuppliers: number;
  activeSuppliers: number;
  preferredSuppliers: number;
  suppliersWithDebt: number;
  totalDebt: number;
  totalCreditLimit: number;
  typeDistribution: Record<string, number>;
  topDebtors: {
    id: string;
    name: string;
    currentDebt: number;
    creditLimit?: number;
    debtPercentage: number;
  }[];
  metrics: {
    activePercentage: number;
    preferredPercentage: number;
    creditUtilization: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

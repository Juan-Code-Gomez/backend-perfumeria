import { IsOptional, IsEnum, IsBoolean, IsArray, IsNumber, IsString } from 'class-validator';

export enum ExportFormat {
  EXCEL = 'excel',
  PDF = 'pdf',
  CSV = 'csv'
}

export enum StockLevel {
  ALL = 'all',
  LOW = 'low',
  OUT = 'out',
  POSITIVE = 'positive'
}

export enum GroupBy {
  NONE = 'none',
  CATEGORY = 'category',
  SUPPLIER = 'supplier',
  LOCATION = 'location'
}

export enum SortBy {
  NAME = 'name',
  STOCK = 'stock',
  CATEGORY = 'category',
  VALUE = 'value',
  CODE = 'code'
}

export class ExportInventoryDto {
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat = ExportFormat.EXCEL;

  @IsOptional()
  @IsBoolean()
  includeImages?: boolean = false;

  @IsOptional()
  @IsBoolean()
  includeStockValue?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeBarcode?: boolean = false;

  @IsOptional()
  @IsBoolean()
  includePhysicalCountColumns?: boolean = true;

  @IsOptional()
  @IsBoolean()
  printFriendly?: boolean = false;

  @IsOptional()
  @IsArray()
  categories?: number[];

  @IsOptional()
  @IsArray()
  suppliers?: number[];

  @IsOptional()
  @IsEnum(StockLevel)
  stockLevel?: StockLevel = StockLevel.ALL;

  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsEnum(GroupBy)
  groupBy?: GroupBy = GroupBy.NONE;

  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy = SortBy.NAME;

  @IsOptional()
  @IsString()
  title?: string = 'Inventario Físico';

  @IsOptional()
  @IsString()
  notes?: string;
}
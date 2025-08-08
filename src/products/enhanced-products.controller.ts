import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  UseGuards
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './enhanced-products.service';
import { 
  CreateProductDto, 
  UpdateProductDto, 
  ProductFiltersDto, 
  BulkCreateProductDto,
  ProductType,
  VariantType 
} from './dto/enhanced-product.dto';
import { CreateProductPriceDto } from './dto/product-price.dto';
import { CreateProductMovementDto } from './dto/create-product-movement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ===============================
  // ENDPOINTS BÁSICOS DE PRODUCTOS
  // ===============================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createProductDto: CreateProductDto) {
    return {
      message: 'Producto creado exitosamente',
      data: await this.productsService.create(createProductDto)
    };
  }

  @Get()
  async findAll(
    @Query() filters: ProductFiltersDto,
    @Query('page') page = '1',
    @Query('limit') limit = '20'
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      throw new BadRequestException('Parámetros de paginación inválidos');
    }

    return this.productsService.findAll(filters, pageNum, limitNum);
  }

  @Get('search')
  async search(@Query('q') query: string) {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('La búsqueda debe tener al menos 2 caracteres');
    }
    
    return {
      message: 'Resultados de búsqueda',
      data: await this.productsService.searchProducts(query.trim())
    };
  }

  @Get('statistics')
  async getStatistics() {
    return {
      message: 'Estadísticas de productos',
      data: await this.productsService.getStockStatistics()
    };
  }

  @Get('low-stock')
  async findLowStock() {
    return {
      message: 'Productos con stock bajo',
      data: await this.productsService.findLowStock()
    };
  }

  @Get('fragrance-groups')
  async getFragranceGroups() {
    return {
      message: 'Grupos de fragancias',
      data: await this.productsService.getFragranceGroups()
    };
  }

  // ===============================
  // ENDPOINTS ESTADÍSTICAS FINANCIERAS
  // ===============================

  @Get('financial-statistics')
  async getFinancialStatistics() {
    return {
      message: 'Estadísticas financieras del inventario',
      data: await this.productsService.getFinancialStatistics()
    };
  }

  @Get('inventory-value')
  async getInventoryValue() {
    return {
      message: 'Valor total del inventario',
      data: await this.productsService.getInventoryValue()
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return {
      message: 'Producto encontrado',
      data: await this.productsService.findOne(id)
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto
  ) {
    return {
      message: 'Producto actualizado exitosamente',
      data: await this.productsService.update(id, updateProductDto)
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.productsService.remove(id);
  }

  @Patch(':id/toggle')
  async toggleActive(@Param('id', ParseIntPipe) id: number) {
    return {
      message: 'Estado del producto cambiado',
      data: await this.productsService.toggleActive(id)
    };
  }

  // ===============================
  // ENDPOINTS DE FRAGANCIAS Y VARIANTES
  // ===============================

  @Get('fragrance/:name')
  async findByFragrance(@Param('name') fragranceName: string) {
    return {
      message: `Productos de la fragancia: ${fragranceName}`,
      data: await this.productsService.findByFragrance(fragranceName)
    };
  }

  @Post(':id/variants')
  @HttpCode(HttpStatus.CREATED)
  async createVariant(
    @Param('id', ParseIntPipe) parentId: number,
    @Body() variantData: CreateProductDto
  ) {
    return {
      message: 'Variante creada exitosamente',
      data: await this.productsService.createFragranceVariant(parentId, variantData)
    };
  }

  // ===============================
  // ENDPOINTS DE PRODUCTOS COMPUESTOS
  // ===============================

  @Get(':id/composite-price')
  async calculateCompositePrice(@Param('id', ParseIntPipe) id: number) {
    return {
      message: 'Precio calculado del producto compuesto',
      data: await this.productsService.calculateCompositePrice(id)
    };
  }

  @Patch(':id/update-composite-stock')
  async updateCompositeStock(@Param('id', ParseIntPipe) id: number) {
    return {
      message: 'Stock del producto compuesto actualizado',
      data: await this.productsService.updateCompositeStock(id)
    };
  }

  // ===============================
  // ENDPOINTS DE MOVIMIENTOS DE STOCK
  // ===============================

  @Get(':id/movements')
  async getMovements(@Param('id', ParseIntPipe) id: number) {
    return {
      message: 'Movimientos del producto',
      data: await this.productsService.findMovements(id)
    };
  }

  @Post(':id/movements')
  @HttpCode(HttpStatus.CREATED)
  async createMovement(
    @Param('id', ParseIntPipe) id: number,
    @Body() createMovementDto: CreateProductMovementDto
  ) {
    return {
      message: 'Movimiento de stock registrado',
      data: await this.productsService.createMovement(id, createMovementDto)
    };
  }

  // ===============================
  // ENDPOINTS DE GESTIÓN DE PRECIOS
  // ===============================

  @Get(':id/price-history')
  async getPriceHistory(@Param('id', ParseIntPipe) id: number) {
    return {
      message: 'Historial de precios',
      data: await this.productsService.getPriceHistory(id)
    };
  }

  @Post(':id/prices')
  @HttpCode(HttpStatus.CREATED)
  async createPriceHistory(
    @Param('id', ParseIntPipe) id: number,
    @Body() createPriceDto: Omit<CreateProductPriceDto, 'productId'>
  ) {
    const priceDto = { ...createPriceDto, productId: id };
    return {
      message: 'Precio actualizado exitosamente',
      data: await this.productsService.createPriceHistory(priceDto)
    };
  }

  // ===============================
  // ENDPOINTS POR PROVEEDOR
  // ===============================

  @Get('supplier/:supplierId')
  async getProductsBySupplier(@Param('supplierId', ParseIntPipe) supplierId: number) {
    return {
      message: 'Productos del proveedor',
      data: await this.productsService.getProductsBySupplier(supplierId)
    };
  }

  // ===============================
  // ENDPOINTS DE CARGA MASIVA
  // ===============================

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  async bulkCreate(@Body() bulkCreateDto: BulkCreateProductDto) {
    return {
      message: 'Carga masiva procesada',
      data: await this.productsService.bulkCreate(bulkCreateDto)
    };
  }

  @Post('upload-excel')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async uploadExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }

    if (!file.originalname.match(/\.(xlsx|xls)$/)) {
      throw new BadRequestException('El archivo debe ser un Excel (.xlsx o .xls)');
    }

    return {
      message: 'Archivo Excel procesado',
      data: await this.productsService.processExcelFile(file.buffer)
    };
  }

  // ===============================
  // ENDPOINTS DE INFORMACIÓN AUXILIAR
  // ===============================

  @Get('types/product-types')
  async getProductTypes() {
    return {
      message: 'Tipos de productos disponibles',
      data: Object.values(ProductType).map(type => ({
        value: type,
        label: this.getProductTypeLabel(type)
      }))
    };
  }

  @Get('types/variant-types')
  async getVariantTypes() {
    return {
      message: 'Tipos de variantes disponibles',
      data: Object.values(VariantType).map(type => ({
        value: type,
        label: this.getVariantTypeLabel(type)
      }))
    };
  }

  // ===============================
  // MÉTODOS AUXILIARES PRIVADOS
  // ===============================

  private getProductTypeLabel(type: ProductType): string {
    const labels = {
      [ProductType.SIMPLE]: 'Producto Simple',
      [ProductType.VARIANT]: 'Variante',
      [ProductType.COMPOSITE]: 'Producto Compuesto'
    };
    return labels[type] || type;
  }

  private getVariantTypeLabel(type: VariantType): string {
    const labels = {
      [VariantType.ESENCIA]: 'Esencia',
      [VariantType.PERFUME_11]: 'Perfume 1.1',
      [VariantType.SPLASH]: 'Splash',
      [VariantType.SPLASH_ESCARCHADO]: 'Splash Escarchado',
      [VariantType.CREMA]: 'Crema',
      [VariantType.AEROSOL]: 'Aerosol',
      [VariantType.FRASCO]: 'Frasco'
    };
    return labels[type] || type;
  }
}

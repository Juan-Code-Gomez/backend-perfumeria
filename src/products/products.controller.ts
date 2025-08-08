import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  ParseIntPipe,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import * as multer from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { QueryProductDto } from './dto/query-product.dto';
import { CreateProductMovementDto } from './dto/create-product-movement.dto';
import { CreateProductDto, UpdateProductDto } from './dto/enhanced-product.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { MESSAGES } from '../common/constants';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('alerts/low-stock')
  findLowStock() {
    return this.productsService.findLowStock();
  }

  @Get(':id/movements')
  findMovements(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findMovements(id);
  }

  @Post(':id/movements')
  createMovement(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: CreateProductMovementDto,
  ) {
    return this.productsService.createMovement(id, data);
  }

  // @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() query: QueryProductDto) {
    return this.productsService.findAll(query);
  }

  // @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('ADMIN')
  @Post()
  create(@Body() data: any) {
    return this.productsService.create(data);
  }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('ADMIN')
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.productsService.update(id, data);
  }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }

  @Post('bulk-upload')
  @Roles('ADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB (ajusta si quieres)
      fileFilter: (req, file, cb) => {
        // Solo permite archivos Excel
        if (
          file.mimetype ===
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.mimetype === 'application/vnd.ms-excel'
        ) {
          cb(null, true);
        } else {
          cb(new Error('Solo se permiten archivos .xlsx'), false);
        }
      },
    }),
  )
  async bulkUploadProducts(@UploadedFile() file: Express.Multer.File) {
    // Aquí llamas tu servicio ya listo
    return this.productsService.bulkUploadProducts(file);
  }
}

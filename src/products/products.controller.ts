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
} from '@nestjs/common';
import { ProductsService } from './products.service';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { QueryProductDto } from './dto/query-product.dto';
import { CreateProductMovementDto } from './dto/create-product-movement.dto';

@Controller('products')
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
}

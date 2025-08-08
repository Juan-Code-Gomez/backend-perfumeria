import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductsService as EnhancedProductsService } from './enhanced-products.service';
import { ProductsController as EnhancedProductsController } from './enhanced-products.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController, EnhancedProductsController],
  providers: [ProductsService, EnhancedProductsService],
  exports: [ProductsService, EnhancedProductsService]
})
export class ProductsModule {}

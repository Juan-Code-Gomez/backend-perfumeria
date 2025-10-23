// src/product-batch/product-batch.module.ts
import { Module } from '@nestjs/common';
import { ProductBatchService } from './product-batch.service';
import { ProductBatchController } from './product-batch.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProductBatchController],
  providers: [ProductBatchService],
  exports: [ProductBatchService],
})
export class ProductBatchModule {}

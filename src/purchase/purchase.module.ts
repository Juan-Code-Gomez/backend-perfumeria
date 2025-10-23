import { Module } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { PurchaseController } from './purchase.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProductBatchModule } from '../product-batch/product-batch.module';

@Module({
  imports: [PrismaModule, ProductBatchModule],
  providers: [PurchaseService],
  controllers: [PurchaseController]
})
export class PurchaseModule {}

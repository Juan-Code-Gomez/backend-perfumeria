import { Controller, Get, Post, Put, Param, Body, Delete, ParseIntPipe } from '@nestjs/common';
import { PurchaseService } from './purchase.service';

@Controller('purchases')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Get()
  findAll() {
    return this.purchaseService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseService.findOne(id);
  }

  @Post()
  create(@Body() data: {
    supplierId: number;
    date?: Date;
    totalAmount: number;
    paidAmount: number;
    isPaid: boolean;
    details: {
      productId: number;
      quantity: number;
      unitCost: number;
    }[];
  }) {
    return this.purchaseService.create(data);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: {
      supplierId: number;
      date?: Date;
      totalAmount: number;
      paidAmount: number;
      isPaid: boolean;
      details: {
        productId: number;
        quantity: number;
        unitCost: number;
      }[];
    }
  ) {
    return this.purchaseService.update(id, data);
  }

//   @Delete(':id')
//   remove(@Param('id', ParseIntPipe) id: number) {
//     return this.purchaseService.remove(id);
//   }
}

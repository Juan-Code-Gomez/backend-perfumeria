// src/supplier/supplier.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common'
import { SupplierService } from './supplier.service'

@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  create(@Body() body: any) {
    return this.supplierService.create(body)
  }

  @Get()
  findAll() {
    return this.supplierService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.supplierService.findOne(+id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.supplierService.update(+id, body)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.supplierService.remove(+id)
  }
}

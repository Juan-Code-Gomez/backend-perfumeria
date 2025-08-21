// src/capital/capital.controller.ts
import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { CapitalService } from './capital.service';
import { CreateCapitalDto, UpdateCapitalDto } from './dto/create-capital.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('capital')
@UseGuards(JwtAuthGuard)
export class CapitalController {
  constructor(private readonly capitalService: CapitalService) {}

  @Post()
  create(@Body() createCapitalDto: CreateCapitalDto) {
    return this.capitalService.create(createCapitalDto);
  }

  @Get()
  findAll() {
    return this.capitalService.findAll();
  }

  @Get('latest')
  findLatest() {
    return this.capitalService.findLatest();
  }

  @Get('summary')
  getCapitalSummary() {
    return this.capitalService.getCapitalSummary();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.capitalService.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCapitalDto: UpdateCapitalDto) {
    return this.capitalService.update(Number(id), updateCapitalDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.capitalService.remove(Number(id));
  }
}

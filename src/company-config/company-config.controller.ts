// src/company-config/company-config.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CompanyConfigService } from './company-config.service';
import { CreateCompanyConfigDto, UpdateCompanyConfigDto } from './dto/company-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('company-config')
export class CompanyConfigController {
  constructor(private readonly companyConfigService: CompanyConfigService) {}

  // Endpoint público para obtener información básica (logo, nombre)
  @Get('public')
  getPublicConfig() {
    return this.companyConfigService.getPublicConfig();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() createCompanyConfigDto: CreateCompanyConfigDto) {
    return this.companyConfigService.create(createCompanyConfigDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  findCurrent() {
    return this.companyConfigService.findCurrent();
  }

  @Get('invoice-config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getInvoiceConfig() {
    return this.companyConfigService.getInvoiceConfig();
  }

  @Get('pos-config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getPOSConfig() {
    return this.companyConfigService.getPOSConfig();
  }

  @Get('system-config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getSystemConfig() {
    return this.companyConfigService.getSystemConfig();
  }

  @Put('current')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateCurrent(@Body() updateCompanyConfigDto: UpdateCompanyConfigDto) {
    return this.companyConfigService.updateCurrent(updateCompanyConfigDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCompanyConfigDto: UpdateCompanyConfigDto,
  ) {
    return this.companyConfigService.update(id, updateCompanyConfigDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.companyConfigService.remove(id);
  }
}

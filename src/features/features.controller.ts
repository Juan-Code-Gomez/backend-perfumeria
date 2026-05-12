// src/features/features.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { FeaturesService } from './features.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateFeatureDto,
  CreateTenantFeatureDto,
  UpdateFeatureConfigDto,
  CreateCustomFieldDto,
  UpdateCustomFieldDto,
} from './dto/features.dto';

@Controller('features')
@UseGuards(JwtAuthGuard)
export class FeaturesController {
  constructor(private readonly featuresService: FeaturesService) {}

  // ============================================
  // FEATURES GLOBALES (Solo admins)
  // ============================================

  @Post()
  createFeature(@Body() dto: CreateFeatureDto) {
    return this.featuresService.createFeature(dto);
  }

  @Get()
  getAllFeatures() {
    return this.featuresService.getAllFeatures();
  }

  @Get('code/:code')
  getFeatureByCode(@Param('code') code: string) {
    return this.featuresService.getFeatureByCode(code);
  }

  // ============================================
  // FEATURES POR TENANT
  // ============================================

  @Get('tenant/:tenantId')
  getTenantFeatures(@Param('tenantId', ParseIntPipe) tenantId: number) {
    return this.featuresService.getTenantFeatures(tenantId);
  }

  @Get('tenant/:tenantId/summary')
  getTenantFeaturesSummary(@Param('tenantId', ParseIntPipe) tenantId: number) {
    return this.featuresService.getTenantFeaturesSummary(tenantId);
  }

  @Get('tenant/:tenantId/has/:featureCode')
  async hasFeature(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('featureCode') featureCode: string,
  ) {
    const hasFeature = await this.featuresService.hasFeature(tenantId, featureCode);
    return { hasFeature };
  }

  @Get('tenant/:tenantId/config/:featureCode')
  getFeatureConfig(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('featureCode') featureCode: string,
  ) {
    return this.featuresService.getFeatureConfig(tenantId, featureCode);
  }

  @Post('tenant/enable')
  enableFeature(@Body() dto: CreateTenantFeatureDto) {
    return this.featuresService.enableFeature(dto);
  }

  @Put('tenant/:tenantId/disable/:featureCode')
  disableFeature(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('featureCode') featureCode: string,
  ) {
    return this.featuresService.disableFeature(tenantId, featureCode);
  }

  @Put('tenant/config')
  updateFeatureConfig(@Body() dto: UpdateFeatureConfigDto) {
    return this.featuresService.updateFeatureConfig(
      dto.tenantId,
      dto.featureCode,
      dto.configuration,
    );
  }

  // ============================================
  // CUSTOM FIELDS
  // ============================================

  @Get('custom-fields/:tenantId')
  getAllCustomFields(@Param('tenantId', ParseIntPipe) tenantId: number) {
    return this.featuresService.getAllCustomFields(tenantId);
  }

  @Get('custom-fields/:tenantId/:module')
  getCustomFields(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('module') module: string,
  ) {
    return this.featuresService.getCustomFields(tenantId, module);
  }

  @Post('custom-fields')
  createCustomField(@Body() dto: CreateCustomFieldDto) {
    return this.featuresService.createCustomField(dto);
  }

  @Put('custom-fields/:id')
  updateCustomField(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomFieldDto,
  ) {
    return this.featuresService.updateCustomField(id, dto);
  }

  @Delete('custom-fields/:id')
  deleteCustomField(@Param('id', ParseIntPipe) id: number) {
    return this.featuresService.deleteCustomField(id);
  }
}

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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
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

  // Endpoint para subir logo de empresa
  @Post('upload-logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('logo', {
    fileFilter: (req, file, cb) => {
      // Solo permitir imágenes
      if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten archivos de imagen (jpg, jpeg, png, gif, webp)'), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB máximo
    },
  }))
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    try {
      // Convertir archivo a base64
      const base64Logo = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      
      const result = await this.companyConfigService.uploadLogoBase64(base64Logo);
      return {
        success: true,
        message: 'Logo subido exitosamente',
        data: {
          logoUrl: result.logoUrl,
          filename: 'logo.png', // Placeholder ya que usamos base64
          companyConfig: result.companyConfig
        }
      };
    } catch (error) {
      throw new BadRequestException(`Error al subir logo: ${error.message}`);
    }
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
  @Roles('ADMIN', 'SUPER_ADMIN')
  updateCurrent(@Body() updateCompanyConfigDto: UpdateCompanyConfigDto) {
    return this.companyConfigService.updateCurrent(updateCompanyConfigDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
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

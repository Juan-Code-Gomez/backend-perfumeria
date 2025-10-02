// src/company-config/company-config.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyConfigDto, UpdateCompanyConfigDto } from './dto/company-config.dto';

@Injectable()
export class CompanyConfigService {
  constructor(private prisma: PrismaService) {}

  async create(createCompanyConfigDto: CreateCompanyConfigDto) {
    // Solo permitir una configuración por empresa
    const existingConfig = await this.prisma.companyConfig.findFirst();
    if (existingConfig) {
      throw new Error('Ya existe una configuración de empresa. Use el método de actualización.');
    }

    return this.prisma.companyConfig.create({
      data: createCompanyConfigDto,
    });
  }

  async findCurrent() {
    const config = await this.prisma.companyConfig.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    // Si no existe configuración, crear una por defecto
    if (!config) {
      return this.prisma.companyConfig.create({
        data: {
          companyName: 'Mi Empresa',
          currency: 'COP',
          timezone: 'America/Bogota',
          dateFormat: 'DD/MM/YYYY',
          numberFormat: 'es-CO',
          taxRate: 0,
        },
      });
    }

    return config;
  }

  async update(id: number, updateCompanyConfigDto: UpdateCompanyConfigDto) {
    const config = await this.prisma.companyConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException('Configuración de empresa no encontrada');
    }

    return this.prisma.companyConfig.update({
      where: { id },
      data: updateCompanyConfigDto,
    });
  }

  async updateCurrent(updateCompanyConfigDto: UpdateCompanyConfigDto) {
    const currentConfig = await this.findCurrent();
    return this.update(currentConfig.id, updateCompanyConfigDto);
  }

  async remove(id: number) {
    const config = await this.prisma.companyConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException('Configuración de empresa no encontrada');
    }

    return this.prisma.companyConfig.delete({
      where: { id },
    });
  }

  // Métodos para obtener configuraciones específicas
  async getInvoiceConfig() {
    const config = await this.findCurrent();
    return {
      companyName: config.companyName,
      nit: config.nit,
      address: config.address,
      phone: config.phone,
      email: config.email,
      website: config.website,
      logo: config.logo,
      invoicePrefix: config.invoicePrefix,
      invoiceFooter: config.invoiceFooter,
      taxRate: config.taxRate,
      currency: config.currency,
    };
  }

  async getPOSConfig() {
    const config = await this.findCurrent();
    return {
      companyName: config.companyName,
      nit: config.nit,
      address: config.address,
      phone: config.phone,
      email: config.email,
      posReceiptHeader: config.posReceiptHeader,
      posReceiptFooter: config.posReceiptFooter,
      printLogo: config.printLogo,
      logo: config.logo,
      currency: config.currency,
      taxRate: config.taxRate,
    };
  }

  async getSystemConfig() {
    const config = await this.findCurrent();
    return {
      timezone: config.timezone,
      dateFormat: config.dateFormat,
      numberFormat: config.numberFormat,
      currency: config.currency,
    };
  }

  async getPublicConfig() {
    const config = await this.findCurrent();
    return {
      companyName: config.companyName,
      logo: config.logo,
    };
  }

  async uploadLogo(file: Express.Multer.File) {
    if (!file) {
      throw new Error('No se proporcionó ningún archivo');
    }

    // Construir la URL del logo (ahora se sirve desde el frontend)
    const logoUrl = `/logos/${file.filename}`;

    // Actualizar la configuración de empresa con la nueva URL del logo
    const updatedConfig = await this.updateCurrent({ logo: logoUrl });

    return {
      success: true,
      message: 'Logo subido exitosamente',
      data: {
        logoUrl,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        companyConfig: updatedConfig,
      },
    };
  }

  async uploadLogoBase64(base64Logo: string) {
    if (!base64Logo) {
      throw new Error('No se proporcionó ninguna imagen');
    }

    // Actualizar la configuración de empresa con el logo en base64
    const updatedConfig = await this.updateCurrent({ logo: base64Logo });

    return {
      success: true,
      message: 'Logo subido exitosamente',
      logoUrl: base64Logo,
      companyConfig: updatedConfig,
    };
  }
}

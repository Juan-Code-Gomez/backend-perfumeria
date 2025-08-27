// src/company-config/company-config.module.ts
import { Module } from '@nestjs/common';
import { CompanyConfigService } from './company-config.service';
import { CompanyConfigController } from './company-config.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CompanyConfigController],
  providers: [CompanyConfigService],
  exports: [CompanyConfigService],
})
export class CompanyConfigModule {}

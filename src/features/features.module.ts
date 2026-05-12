// src/features/features.module.ts
import { Module } from '@nestjs/common';
import { FeaturesService } from './features.service';
import { FeaturesController } from './features.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FeaturesController],
  providers: [FeaturesService],
  exports: [FeaturesService], // Exportar para usar en otros módulos
})
export class FeaturesModule {}

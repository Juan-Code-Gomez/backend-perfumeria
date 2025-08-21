// src/capital/capital.module.ts
import { Module } from '@nestjs/common';
import { CapitalService } from './capital.service';
import { CapitalController } from './capital.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CapitalController],
  providers: [CapitalService],
  exports: [CapitalService],
})
export class CapitalModule {}

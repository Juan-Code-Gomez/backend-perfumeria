import { Module } from '@nestjs/common';
import { SaleService } from './sale.service';
import { SaleController } from './sale.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SystemParametersModule } from '../system-parameters/system-parameters.module';
import { ComboService } from '../services/combo.service';
import { SimpleCapitalService } from '../services/simple-capital.service';

@Module({
  imports: [PrismaModule, SystemParametersModule],
  providers: [SaleService, ComboService, SimpleCapitalService],
  controllers: [SaleController]
})
export class SaleModule {}

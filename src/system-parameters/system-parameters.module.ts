import { Module } from '@nestjs/common';
import { SystemParametersController } from './system-parameters.controller';
import { SystemParametersService } from './system-parameters.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SystemParametersController],
  providers: [SystemParametersService],
  exports: [SystemParametersService], // Exportar para usar en otros módulos
})
export class SystemParametersModule {}
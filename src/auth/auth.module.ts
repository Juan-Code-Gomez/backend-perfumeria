import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { JwtStrategy } from './strategy/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module'; // Asegúrate de importar el módulo Prisma si lo necesitas

@Module({
  imports: [
  PrismaModule, // Importa el módulo Prisma si lo necesitas
    JwtModule.register({
      secret: 'supersecretkey', // mejor ponerlo en .env
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, UserService],
})
export class AuthModule {}

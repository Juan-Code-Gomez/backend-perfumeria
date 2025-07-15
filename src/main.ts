import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors( [
    "http://localhost:5173",                       // Desarrollo local
    "https://perfumeria-sistema.vercel.app",        // Dominio de Vercel
    "https://perfumeria-sistema-juan-camilo-gomezs-projects-6585cabf.vercel.app", // Deploys temporales de Vercel
  ]);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

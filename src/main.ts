import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { createValidationPipe } from './common/pipes/validation.pipe';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Global pipes
  app.useGlobalPipes(createValidationPipe());

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );
  
  // Serve static files (ANTES del prefijo global para evitar el /api/)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  
  //hola x2
  // CORS configuration
  app.enableCors({
    origin: [
      'https://perfumeria-sistema.vercel.app',
      'https://perfumeria-sistema-production.up.railway.app',
      'https://perfumeria-sistema-production-1c59.up.railway.app',
      'https://perfumeria-sistema-production.up.railway.app',
      'https://perfumeria-sistema-production-1d47.up.railway.app',
      'http://localhost:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global prefix
  app.setGlobalPrefix('api');

  const port = configService.port;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}/api`);
  logger.log(`📖 Environment: ${configService.nodeEnv}`);
  logger.log(`🌐 Allowed Origins: ${configService.allowedOrigins.join(', ')}`);
}
bootstrap();

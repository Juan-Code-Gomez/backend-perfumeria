import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'backend-perfumeria'
    };
  }
}

// Controlador adicional sin prefijo para Railway health check
@Controller('/')
export class RootHealthController {
  @Get('health')
  rootHealthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'backend-perfumeria',
      endpoint: 'root-health'
    };
  }
}

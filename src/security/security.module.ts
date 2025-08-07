import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '../config/config.service';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.rateLimitTtl * 1000, // Convert to milliseconds
          limit: configService.rateLimitLimit,
        },
      ],
      inject: [ConfigService],
    }),
  ],
  exports: [ThrottlerModule],
})
export class SecurityModule {}

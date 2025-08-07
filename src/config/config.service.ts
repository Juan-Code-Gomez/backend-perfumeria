import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  // Database
  get databaseUrl(): string {
    return process.env.DATABASE_URL || '';
  }

  // JWT
  get jwtSecret(): string {
    return process.env.JWT_SECRET || 'default-secret-key';
  }

  get jwtExpiresIn(): string {
    return process.env.JWT_EXPIRES_IN || '7d';
  }

  // Server
  get port(): number {
    return parseInt(process.env.PORT || '3000', 10);
  }

  get nodeEnv(): string {
    return process.env.NODE_ENV || 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  // CORS
  get frontendUrl(): string {
    return process.env.FRONTEND_URL || 'http://localhost:5173';
  }

  get frontendProdUrl(): string {
    return process.env.FRONTEND_PROD_URL || '';
  }

  get allowedOrigins(): string[] {
    const origins = [this.frontendUrl];
    if (this.frontendProdUrl) {
      origins.push(this.frontendProdUrl);
    }
    return origins;
  }

  // Rate Limiting
  get rateLimitTtl(): number {
    return parseInt(process.env.RATE_LIMIT_TTL || '60', 10);
  }

  get rateLimitLimit(): number {
    return parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10);
  }

  // File Upload
  get maxFileSize(): number {
    return parseInt(process.env.MAX_FILE_SIZE || '2097152', 10);
  }

  // Business Settings
  get defaultCurrency(): string {
    return process.env.DEFAULT_CURRENCY || 'COP';
  }

  get taxRate(): number {
    return parseFloat(process.env.TAX_RATE || '0.19');
  }

  get lowStockThreshold(): number {
    return parseInt(process.env.LOW_STOCK_THRESHOLD || '5', 10);
  }

  // Email
  get smtpHost(): string {
    return process.env.SMTP_HOST || '';
  }

  get smtpPort(): number {
    return parseInt(process.env.SMTP_PORT || '587', 10);
  }

  get smtpUser(): string {
    return process.env.SMTP_USER || '';
  }

  get smtpPass(): string {
    return process.env.SMTP_PASS || '';
  }

  get emailFrom(): string {
    return process.env.EMAIL_FROM || '';
  }

  // Backup
  get backupEnabled(): boolean {
    return process.env.BACKUP_ENABLED === 'true';
  }

  get backupSchedule(): string {
    return process.env.BACKUP_SCHEDULE || '0 2 * * *';
  }
}

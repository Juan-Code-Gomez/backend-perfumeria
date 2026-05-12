// src/common/decorators/require-feature.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const FEATURE_KEY = 'requiredFeature';

/**
 * Decorator para marcar un endpoint como protegido por feature flag
 * Uso: @RequireFeature('JEWELRY_MODULE')
 */
export const RequireFeature = (featureCode: string) => 
  SetMetadata(FEATURE_KEY, featureCode);

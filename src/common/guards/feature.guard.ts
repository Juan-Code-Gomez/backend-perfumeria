// src/common/guards/feature.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeaturesService } from '../../features/features.service';
import { FEATURE_KEY } from '../decorators/require-feature.decorator';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private featuresService: FeaturesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Obtener el feature requerido del metadata
    const requiredFeature = this.reflector.getAllAndOverride<string>(FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no se requiere feature, permitir acceso
    if (!requiredFeature) {
      return true;
    }

    // Obtener el usuario del request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    // Verificar que el usuario tenga un tenantId
    if (!user.tenantId) {
      throw new ForbiddenException(
        'Usuario sin tenant asignado. Contacte al administrador.',
      );
    }

    // Verificar si el tenant tiene el feature activado
    const hasFeature = await this.featuresService.hasFeature(
      user.tenantId,
      requiredFeature,
    );

    if (!hasFeature) {
      throw new ForbiddenException(
        `El feature "${requiredFeature}" no está disponible para su cuenta. Actualice su plan o contacte a soporte.`,
      );
    }

    // Feature activado, permitir acceso
    return true;
  }
}

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No roles requeridos
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user?.roles?.some((r) => requiredRoles.includes(r))) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a esta ruta',
      );
    }

    return true;
  }
}

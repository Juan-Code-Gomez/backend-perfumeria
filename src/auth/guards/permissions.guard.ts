import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../../permissions/permissions.service';

export interface RequiredPermission {
  module: string;
  action: 'view' | 'create' | 'edit' | 'delete' | 'export';
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermission[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true; // Si no se especifican permisos, permitir acceso
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Verificar si el usuario es SUPER_ADMIN (acceso total)
    const userRoles = await this.getUserRoles(user.id);
    if (userRoles.some(role => role.name === 'SUPER_ADMIN')) {
      return true;
    }

    // Verificar permisos específicos
    for (const permission of requiredPermissions) {
      const hasPermission = await this.permissionsService.checkUserPermission(
        user.id,
        permission.module,
        permission.action
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          `No tienes permisos para ${permission.action} en el módulo ${permission.module}`
        );
      }
    }

    return true;
  }

  private async getUserRoles(userId: number) {
    // Este método debería implementarse en el servicio de usuarios
    // Por ahora, usamos una consulta directa
    const { PrismaService } = await import('../../prisma/prisma.service');
    const prisma = new PrismaService();
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    return user?.roles.map(ur => ur.role) || [];
  }
}

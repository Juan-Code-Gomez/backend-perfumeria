import { SetMetadata } from '@nestjs/common';

export interface RequiredPermission {
  module: string;
  action: 'view' | 'create' | 'edit' | 'delete' | 'export';
}

export const RequirePermissions = (...permissions: RequiredPermission[]) => 
  SetMetadata('permissions', permissions);

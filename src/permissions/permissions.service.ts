// src/permissions/permissions.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateModuleDto,
  UpdateModuleDto,
  CreateModulePermissionDto,
  UpdateModulePermissionDto,
} from './dto/permissions.dto';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  // Gestión de Módulos del Sistema
  async createModule(createModuleDto: CreateModuleDto) {
    return this.prisma.systemModule.create({
      data: createModuleDto,
      include: {
        parent: true,
        children: true,
        permissions: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findAllModules() {
    return this.prisma.systemModule.findMany({
      include: {
        parent: true,
        children: true,
        permissions: {
          include: {
            role: true,
          },
        },
      },
      orderBy: [{ order: 'asc' }, { displayName: 'asc' }],
    });
  }

  async findModuleById(id: number) {
    const module = await this.prisma.systemModule.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        permissions: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!module) {
      throw new NotFoundException('Módulo no encontrado');
    }

    return module;
  }

  async updateModule(id: number, updateModuleDto: UpdateModuleDto) {
    const module = await this.findModuleById(id);

    return this.prisma.systemModule.update({
      where: { id },
      data: updateModuleDto,
      include: {
        parent: true,
        children: true,
        permissions: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async removeModule(id: number) {
    const module = await this.findModuleById(id);

    return this.prisma.systemModule.delete({
      where: { id },
    });
  }

  // Gestión de Permisos
  async createModulePermission(createPermissionDto: CreateModulePermissionDto) {
    return this.prisma.modulePermission.create({
      data: createPermissionDto,
      include: {
        module: true,
        role: true,
      },
    });
  }

  async findPermissionsByRole(roleId: number) {
    return this.prisma.modulePermission.findMany({
      where: { roleId },
      include: {
        module: {
          include: {
            parent: true,
            children: true,
          },
        },
        role: true,
      },
    });
  }

  async findPermissionsByModule(moduleId: number) {
    return this.prisma.modulePermission.findMany({
      where: { moduleId },
      include: {
        module: true,
        role: true,
      },
    });
  }

  async updateModulePermission(
    moduleId: number,
    roleId: number,
    updatePermissionDto: UpdateModulePermissionDto,
  ) {
    const permission = await this.prisma.modulePermission.findUnique({
      where: {
        moduleId_roleId: {
          moduleId,
          roleId,
        },
      },
    });

    if (!permission) {
      throw new NotFoundException('Permiso no encontrado');
    }

    return this.prisma.modulePermission.update({
      where: {
        moduleId_roleId: {
          moduleId,
          roleId,
        },
      },
      data: updatePermissionDto,
      include: {
        module: true,
        role: true,
      },
    });
  }

  async removeModulePermission(moduleId: number, roleId: number) {
    const permission = await this.prisma.modulePermission.findUnique({
      where: {
        moduleId_roleId: {
          moduleId,
          roleId,
        },
      },
    });

    if (!permission) {
      throw new NotFoundException('Permiso no encontrado');
    }

    return this.prisma.modulePermission.delete({
      where: {
        moduleId_roleId: {
          moduleId,
          roleId,
        },
      },
    });
  }

  // Verificación de permisos
  async hasPermission(
    userId: number,
    moduleName: string,
    permission: 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canExport',
  ): Promise<boolean> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                module: true,
              },
            },
          },
        },
      },
    });

    for (const userRole of userRoles) {
      const modulePermissions = userRole.role.permissions.filter(
        (perm) => perm.module.name === moduleName,
      );

      for (const modulePermission of modulePermissions) {
        if (modulePermission[permission]) {
          return true;
        }
      }
    }

    return false;
  }

  async getUserModules(userId: number) {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: {
              where: {
                canView: true,
              },
              include: {
                module: {
                  include: {
                    parent: true,
                    children: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const accessibleModules = new Map();

    for (const userRole of userRoles) {
      for (const permission of userRole.role.permissions) {
        const module = permission.module;
        if (module.isActive && !accessibleModules.has(module.id)) {
          accessibleModules.set(module.id, {
            ...module,
            permissions: {
              canView: permission.canView,
              canCreate: permission.canCreate,
              canEdit: permission.canEdit,
              canDelete: permission.canDelete,
              canExport: permission.canExport,
            },
          });
        }
      }
    }

    return Array.from(accessibleModules.values()).sort((a, b) => a.order - b.order);
  }

  // Inicializar módulos por defecto
  async initializeDefaultModules() {
    const defaultModules = [
      {
        name: 'dashboard',
        displayName: 'Dashboard',
        description: 'Panel principal',
        route: '/',
        icon: 'DashboardOutlined',
        order: 1,
      },
      {
        name: 'sales',
        displayName: 'Ventas',
        description: 'Gestión de ventas',
        route: '/ventas',
        icon: 'ShoppingCartOutlined',
        order: 2,
      },
      {
        name: 'pos',
        displayName: 'Punto de Venta',
        description: 'POS',
        route: '/pos',
        icon: 'CreditCardOutlined',
        order: 3,
      },
      {
        name: 'products',
        displayName: 'Productos',
        description: 'Gestión de productos',
        route: '/products',
        icon: 'AppstoreOutlined',
        order: 4,
      },
      {
        name: 'clients',
        displayName: 'Clientes',
        description: 'Gestión de clientes',
        route: '/clients',
        icon: 'TeamOutlined',
        order: 5,
      },
      {
        name: 'suppliers',
        displayName: 'Proveedores',
        description: 'Gestión de proveedores',
        route: '/suppliers',
        icon: 'ShopOutlined',
        order: 6,
      },
      {
        name: 'expenses',
        displayName: 'Gastos',
        description: 'Gestión de gastos',
        route: '/expenses',
        icon: 'DollarOutlined',
        order: 7,
      },
      {
        name: 'capital',
        displayName: 'Capital',
        description: 'Gestión de capital',
        route: '/capital',
        icon: 'WalletOutlined',
        order: 8,
      },
      {
        name: 'invoices',
        displayName: 'Facturas',
        description: 'Gestión de facturas',
        route: '/invoices',
        icon: 'FileTextOutlined',
        order: 9,
      },
      {
        name: 'users',
        displayName: 'Usuarios',
        description: 'Gestión de usuarios',
        route: '/users',
        icon: 'UserOutlined',
        order: 10,
      },
      {
        name: 'categories',
        displayName: 'Categorías',
        description: 'Gestión de categorías',
        route: '/categories',
        icon: 'TagsOutlined',
        order: 11,
      },
      {
        name: 'units',
        displayName: 'Unidades',
        description: 'Gestión de unidades',
        route: '/units',
        icon: 'NumberOutlined',
        order: 12,
      },
      {
        name: 'reports',
        displayName: 'Reportes',
        description: 'Reportes del sistema',
        route: '/reports',
        icon: 'BarChartOutlined',
        order: 13,
      },
      {
        name: 'company-config',
        displayName: 'Configuración',
        description: 'Configuración de empresa',
        route: '/company-config',
        icon: 'SettingOutlined',
        order: 14,
      },
      {
        name: 'permissions',
        displayName: 'Permisos',
        description: 'Gestión de permisos',
        route: '/permissions',
        icon: 'SafetyOutlined',
        order: 15,
      },
    ];

    for (const moduleData of defaultModules) {
      const existingModule = await this.prisma.systemModule.findUnique({
        where: { name: moduleData.name },
      });

      if (!existingModule) {
        await this.prisma.systemModule.create({
          data: moduleData,
        });
      }
    }

    // Dar permisos completos al rol ADMIN en todos los módulos
    const adminRole = await this.prisma.role.findUnique({
      where: { name: 'ADMIN' },
    });

    if (adminRole) {
      const modules = await this.prisma.systemModule.findMany();

      for (const module of modules) {
        const existingPermission = await this.prisma.modulePermission.findUnique({
          where: {
            moduleId_roleId: {
              moduleId: module.id,
              roleId: adminRole.id,
            },
          },
        });

        if (!existingPermission) {
          await this.prisma.modulePermission.create({
            data: {
              moduleId: module.id,
              roleId: adminRole.id,
              canView: true,
              canCreate: true,
              canEdit: true,
              canDelete: true,
              canExport: true,
            },
          });
        }
      }
    }
  }

  // Métodos adicionales para manejo dinámico de permisos

  // Obtener permisos de un usuario específico
  async getUserPermissions(userId: number) {
    const userWithRoles: any = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    module: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!userWithRoles) {
      return [];
    }

    // Combinar permisos de todos los roles del usuario
    const permissions = new Map();
    
    for (const userRole of userWithRoles.roles) {
      for (const permission of userRole.role.permissions) {
        const moduleId = permission.moduleId;
        const existing = permissions.get(moduleId);
        
        if (!existing) {
          permissions.set(moduleId, {
            module: permission.module,
            canView: permission.canView,
            canCreate: permission.canCreate,
            canEdit: permission.canEdit,
            canDelete: permission.canDelete,
            canExport: permission.canExport,
          });
        } else {
          // Si ya existe, combinar permisos (usar OR lógico)
          permissions.set(moduleId, {
            module: permission.module,
            canView: existing.canView || permission.canView,
            canCreate: existing.canCreate || permission.canCreate,
            canEdit: existing.canEdit || permission.canEdit,
            canDelete: existing.canDelete || permission.canDelete,
            canExport: existing.canExport || permission.canExport,
          });
        }
      }
    }

    return Array.from(permissions.values());
  }

  // Verificar si un usuario tiene un permiso específico
  async checkUserPermission(userId: number, moduleName: string, action: 'view' | 'create' | 'edit' | 'delete' | 'export'): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    
    const modulePermission = userPermissions.find(p => p.module.name === moduleName);
    
    if (!modulePermission) {
      return false;
    }

    switch (action) {
      case 'view':
        return modulePermission.canView;
      case 'create':
        return modulePermission.canCreate;
      case 'edit':
        return modulePermission.canEdit;
      case 'delete':
        return modulePermission.canDelete;
      case 'export':
        return modulePermission.canExport;
      default:
        return false;
    }
  }

  // Obtener módulos accesibles para un usuario
  async getUserAccessibleModules(userId: number) {
    const userPermissions = await this.getUserPermissions(userId);
    
    return userPermissions
      .filter(p => p.canView)
      .map(p => ({
        ...p.module,
        permissions: {
          canView: p.canView,
          canCreate: p.canCreate,
          canEdit: p.canEdit,
          canDelete: p.canDelete,
          canExport: p.canExport,
        }
      }))
      .sort((a, b) => a.order - b.order);
  }

  // Actualizar permisos de un rol completo
  async updateRolePermissions(roleId: number, permissions: Array<{
    moduleId: number;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canExport: boolean;
  }>) {
    // Eliminar permisos existentes del rol
    await this.prisma.modulePermission.deleteMany({
      where: { roleId }
    });

    // Crear nuevos permisos
    const permissionsToCreate = permissions.map(permission => ({
      roleId,
      moduleId: permission.moduleId,
      canView: permission.canView,
      canCreate: permission.canCreate,
      canEdit: permission.canEdit,
      canDelete: permission.canDelete,
      canExport: permission.canExport,
    }));

    await this.prisma.modulePermission.createMany({
      data: permissionsToCreate
    });

    return this.findPermissionsByRole(roleId);
  }
}

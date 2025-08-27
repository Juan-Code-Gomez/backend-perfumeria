// src/permissions/permissions.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import {
  CreateModuleDto,
  UpdateModuleDto,
  CreateModulePermissionDto,
  UpdateModulePermissionDto,
} from './dto/permissions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  // Módulos del Sistema
  @Post('modules')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  createModule(@Body() createModuleDto: CreateModuleDto) {
    return this.permissionsService.createModule(createModuleDto);
  }

  @Get('modules')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findAllModules() {
    return this.permissionsService.findAllModules();
  }

  @Get('modules/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findModuleById(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.findModuleById(id);
  }

  @Put('modules/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  updateModule(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateModuleDto: UpdateModuleDto,
  ) {
    return this.permissionsService.updateModule(id, updateModuleDto);
  }

  @Delete('modules/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  removeModule(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.removeModule(id);
  }

  // Permisos de Módulos
  @Post('module-permissions')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  createModulePermission(@Body() createPermissionDto: CreateModulePermissionDto) {
    return this.permissionsService.createModulePermission(createPermissionDto);
  }

  @Get('module-permissions/role/:roleId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findPermissionsByRole(@Param('roleId', ParseIntPipe) roleId: number) {
    return this.permissionsService.findPermissionsByRole(roleId);
  }

  @Get('module-permissions/module/:moduleId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findPermissionsByModule(@Param('moduleId', ParseIntPipe) moduleId: number) {
    return this.permissionsService.findPermissionsByModule(moduleId);
  }

  @Put('module-permissions/:moduleId/:roleId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  updateModulePermission(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() updatePermissionDto: UpdateModulePermissionDto,
  ) {
    return this.permissionsService.updateModulePermission(
      moduleId,
      roleId,
      updatePermissionDto,
    );
  }

  @Delete('module-permissions/:moduleId/:roleId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  removeModulePermission(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    return this.permissionsService.removeModulePermission(moduleId, roleId);
  }

  // Verificación de permisos
  @Get('check')
  @UseGuards(JwtAuthGuard)
  async checkPermission(
    @GetUser() user: any,
    @Query('module') moduleName: string,
    @Query('permission') permission: 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canExport',
  ) {
    const hasPermission = await this.permissionsService.hasPermission(
      user.id,
      moduleName,
      permission,
    );
    return { hasPermission };
  }

  // Nuevos endpoints para manejo dinámico de permisos

  // Obtener permisos de un usuario específico
  @Get('user/:userId')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  getUserPermissions(@Param('userId', ParseIntPipe) userId: number) {
    return this.permissionsService.getUserPermissions(userId);
  }

  // Obtener módulos accesibles para un usuario específico
  @Get('user/:userId/modules')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  getUserAccessibleModules(@Param('userId', ParseIntPipe) userId: number) {
    return this.permissionsService.getUserAccessibleModules(userId);
  }

  // Verificar permiso específico de un usuario
  @Get('user/:userId/check/:moduleName/:action')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  checkUserPermission(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('moduleName') moduleName: string,
    @Param('action') action: 'view' | 'create' | 'edit' | 'delete' | 'export'
  ) {
    return this.permissionsService.checkUserPermission(userId, moduleName, action);
  }

  // Actualizar permisos completos de un rol
  @Put('role/:roleId/permissions')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  updateRolePermissions(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() permissions: Array<{
      moduleId: number;
      canView: boolean;
      canCreate: boolean;
      canEdit: boolean;
      canDelete: boolean;
      canExport: boolean;
    }>
  ) {
    return this.permissionsService.updateRolePermissions(roleId, permissions);
  }

  // Obtener módulos accesibles para el usuario actual
  @Get('user-modules')
  @UseGuards(JwtAuthGuard)
  getUserModules(@GetUser() user: any) {
    return this.permissionsService.getUserModules(user.id);
  }

  // Obtener mis módulos (usuario logueado)
  @Get('my-modules')
  @UseGuards(JwtAuthGuard)
  getMyModules(@GetUser() user: any) {
    return this.permissionsService.getUserAccessibleModules(user.id);
  }

  // Obtener mis permisos (usuario logueado)
  @Get('my-permissions')
  @UseGuards(JwtAuthGuard)
  getMyPermissions(@GetUser() user: any) {
    return this.permissionsService.getUserPermissions(user.id);
  }

  // Verificar un permiso específico del usuario actual
  @Get('check/:moduleName/:action')
  @UseGuards(JwtAuthGuard)
  checkMyPermission(
    @GetUser() user: any,
    @Param('moduleName') moduleName: string,
    @Param('action') action: 'view' | 'create' | 'edit' | 'delete' | 'export'
  ) {
    return this.permissionsService.checkUserPermission(user.id, moduleName, action);
  }

  // Inicializar módulos por defecto (solo para ADMIN)
  @Post('initialize')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  initializeDefaultModules() {
    return this.permissionsService.initializeDefaultModules();
  }
}

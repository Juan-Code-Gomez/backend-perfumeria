import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete,
  Body, 
  Param, 
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { NotificationsService, CreateNotificationDto, CreateNotificationRuleDto } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('includeRead') includeRead?: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const includeReadBool = includeRead === 'true';
    const includeArchivedBool = includeArchived === 'true';

    return {
      success: true,
      data: await this.notificationsService.getNotificationsForUser(
        req.user.userId,
        limitNum,
        includeReadBool,
        includeArchivedBool,
      ),
    };
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    return {
      success: true,
      data: {
        count: await this.notificationsService.getUnreadCount(req.user.userId),
      },
    };
  }

  @Post()
  async createNotification(
    @Body() createNotificationDto: CreateNotificationDto,
    @Request() req,
  ) {
    return {
      success: true,
      data: await this.notificationsService.createNotification({
        ...createNotificationDto,
        userId: req.user.userId,
      }),
    };
  }

  @Put(':id/read')
  async markAsRead(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return {
      success: true,
      data: await this.notificationsService.markAsRead(id, req.user.userId),
    };
  }

  @Put('mark-all-read')
  async markAllAsRead(@Request() req) {
    return {
      success: true,
      data: await this.notificationsService.markAllAsRead(req.user.userId),
    };
  }

  @Put(':id/archive')
  async archiveNotification(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return {
      success: true,
      data: await this.notificationsService.archiveNotification(id, req.user.userId),
    };
  }

  // ===== REGLAS =====
  @Get('rules')
  async getNotificationRules() {
    return {
      success: true,
      data: await this.notificationsService.getNotificationRules(),
    };
  }

  @Post('rules')
  async createNotificationRule(@Body() createRuleDto: CreateNotificationRuleDto) {
    return {
      success: true,
      data: await this.notificationsService.createNotificationRule(createRuleDto),
    };
  }

  @Put('rules/:id')
  async updateNotificationRule(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRuleDto: Partial<CreateNotificationRuleDto>,
  ) {
    return {
      success: true,
      data: await this.notificationsService.updateNotificationRule(id, updateRuleDto),
    };
  }

  @Delete('rules/:id')
  async deleteNotificationRule(@Param('id', ParseIntPipe) id: number) {
    return {
      success: true,
      data: await this.notificationsService.deleteNotificationRule(id),
    };
  }

  // ===== ADMINISTRACIÓN =====
  @Post('initialize-default-rules')
  async initializeDefaultRules() {
    try {
      await this.notificationsService.createDefaultRules();
      return { 
        success: true, 
        message: 'Reglas por defecto inicializadas correctamente' 
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'Error al inicializar reglas por defecto',
        error: error.message 
      };
    }
  }

  @Post('trigger-check')
  async triggerManualCheck() {
    try {
      await this.notificationsService.checkAutomaticNotifications();
      return { 
        success: true, 
        message: 'Verificación manual de notificaciones ejecutada' 
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'Error en verificación manual',
        error: error.message 
      };
    }
  }
}

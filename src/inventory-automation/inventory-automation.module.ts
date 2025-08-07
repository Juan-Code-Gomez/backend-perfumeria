import { Module } from '@nestjs/common';
import { InventoryAutomationService } from './inventory-automation.service';
import { InventoryAutomationController } from './inventory-automation.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [InventoryAutomationController],
  providers: [InventoryAutomationService],
  exports: [InventoryAutomationService],
})
export class InventoryAutomationModule {}

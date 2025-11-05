import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ApproveOrderDto } from './dto/approve-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrderStatus } from '@prisma/client';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * POST /orders - Crear nuevo pedido
   * Roles: VENDEDOR, CAJERO, ADMIN, BODEGA
   */
  @Post()
  @Roles('VENDEDOR', 'CAJERO', 'ADMIN', 'BODEGA')
  async create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    const userId = req.user.userId;
    return await this.orderService.create(createOrderDto, userId);
  }

  /**
   * GET /orders - Listar todos los pedidos
   * Roles: VENDEDOR (solo ve los suyos), BODEGA/CAJERO/ADMIN (ven todos)
   */
  @Get()
  @Roles('VENDEDOR', 'CAJERO', 'ADMIN', 'BODEGA')
  async findAll(@Request() req, @Query('status') status?: OrderStatus) {
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Si es VENDEDOR, solo puede ver sus propios pedidos
    const filters: any = {};
    if (status) {
      filters.status = status;
    }

    if (userRole === 'VENDEDOR') {
      filters.createdById = userId;
    }

    return await this.orderService.findAll(filters);
  }

  /**
   * GET /orders/statistics - Obtener estadísticas
   * Roles: BODEGA, CAJERO, ADMIN
   */
  @Get('statistics')
  @Roles('BODEGA', 'CAJERO', 'ADMIN')
  async getStatistics() {
    return await this.orderService.getStatistics();
  }

  /**
   * GET /orders/:id - Obtener pedido por ID
   * Roles: VENDEDOR (solo si lo creó), BODEGA/CAJERO/ADMIN
   */
  @Get(':id')
  @Roles('VENDEDOR', 'CAJERO', 'ADMIN', 'BODEGA')
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const order = await this.orderService.findOne(id);
    
    // Si es VENDEDOR, solo puede ver sus propios pedidos
    if (req.user.role === 'VENDEDOR' && order.createdById !== req.user.userId) {
      throw new Error('No tienes permiso para ver este pedido');
    }

    return order;
  }

  /**
   * GET /orders/:id/history - Obtener historial de cambios
   * Roles: BODEGA, CAJERO, ADMIN
   */
  @Get(':id/history')
  @Roles('BODEGA', 'CAJERO', 'ADMIN')
  async getHistory(@Param('id', ParseIntPipe) id: number) {
    return await this.orderService.getHistory(id);
  }

  /**
   * PATCH /orders/:id - Editar pedido pendiente
   * Roles: CAJERO, ADMIN (BODEGA puede aprobar pero no editar)
   */
  @Patch(':id')
  @Roles('CAJERO', 'ADMIN')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return await this.orderService.update(id, updateOrderDto, userId);
  }

  /**
   * POST /orders/:id/approve - Aprobar pedido y convertir en venta
   * Roles: BODEGA, CAJERO, ADMIN
   */
  @Post(':id/approve')
  @Roles('BODEGA', 'CAJERO', 'ADMIN')
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() approveOrderDto: ApproveOrderDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return await this.orderService.approve(id, approveOrderDto, userId);
  }

  /**
   * DELETE /orders/:id - Cancelar pedido
   * Roles: ADMIN
   */
  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const userId = req.user.userId;
    return await this.orderService.remove(id, userId);
  }
}

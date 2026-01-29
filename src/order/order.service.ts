import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductBatchService } from '../product-batch/product-batch.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ApproveOrderDto } from './dto/approve-order.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private batchService: ProductBatchService,
  ) {}

  /**
   * Crear un nuevo pedido (VENDEDOR)
   * - Valida stock disponible
   * - Reserva stock
   * - Crea OrderHistory
   */
  async create(data: CreateOrderDto, userId: number) {
    console.log('📝 Creando pedido:', JSON.stringify(data, null, 2));

    return await this.prisma.$transaction(async (tx) => {
      // 1. Validar que el cliente existe (si se proporciona)
      if (data.clientId) {
        const client = await tx.client.findUnique({
          where: { id: data.clientId },
        });
        if (!client) {
          throw new BadRequestException(`Cliente con ID ${data.clientId} no existe`);
        }
      }

      // 2. Validar productos y stock disponible
      const productIds = data.details.map(d => d.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { 
          id: true, 
          name: true, 
          stock: true, 
          reservedStock: true,
          salePrice: true,
          isActive: true,
        },
      });

      if (products.length !== productIds.length) {
        throw new BadRequestException('Uno o más productos no existen');
      }

      // Validar stock disponible para cada producto
      for (const detail of data.details) {
        const product = products.find(p => p.id === detail.productId);
        if (!product) {
          throw new BadRequestException(`Producto con ID ${detail.productId} no encontrado`);
        }

        if (!product.isActive) {
          throw new BadRequestException(`Producto "${product.name}" no está activo`);
        }

        const availableStock = product.stock - product.reservedStock;
        if (availableStock < detail.quantity) {
          throw new BadRequestException(
            `Stock insuficiente para "${product.name}". ` +
            `Disponible: ${availableStock}, Solicitado: ${detail.quantity}`
          );
        }
      }

      // 3. Generar número de pedido
      const lastOrder = await tx.order.findFirst({
        orderBy: { id: 'desc' },
        select: { orderNumber: true },
      });

      const nextNumber = lastOrder 
        ? parseInt(lastOrder.orderNumber.split('-')[1]) + 1 
        : 1;
      const orderNumber = `OD-${String(nextNumber).padStart(4, '0')}`;

      // 4. Crear el pedido
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerName: data.customerName || null,
          clientId: data.clientId || null,
          totalAmount: data.totalAmount,
          notes: data.notes || null,
          status: OrderStatus.PENDING,
          createdById: userId,
          details: {
            create: data.details.map(d => ({
              productId: d.productId,
              quantity: d.quantity,
              originalQty: d.quantity,
              unitPrice: d.unitPrice,
              totalPrice: d.totalPrice,
            })),
          },
        },
        include: {
          details: {
            include: {
              product: {
                select: { id: true, name: true, sku: true },
              },
            },
          },
          createdBy: {
            select: { id: true, name: true, username: true },
          },
        },
      });

      console.log(`✅ Pedido ${orderNumber} creado exitosamente`);

      // 5. RESERVAR stock en cada producto
      for (const detail of data.details) {
        await tx.product.update({
          where: { id: detail.productId },
          data: {
            reservedStock: {
              increment: detail.quantity,
            },
          },
        });
      }

      // 6. Registrar en historial
      await tx.orderHistory.create({
        data: {
          orderId: order.id,
          action: 'CREATED',
          userId,
          changes: `Pedido creado: ${data.details.length} producto(s)`,
        },
      });

      console.log(`✅ Pedido ${orderNumber} creado exitosamente`);
      
      return order;
    });
  }

  /**
   * Listar pedidos con filtros
   */
  async findAll(filters?: { status?: OrderStatus; createdById?: number }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.createdById) {
      where.createdById = filters.createdById;
    }

    return await this.prisma.order.findMany({
      where,
      include: {
        details: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, stock: true, reservedStock: true },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true, username: true },
        },
        approvedBy: {
          select: { id: true, name: true, username: true },
        },
        client: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtener un pedido por ID
   */
  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        details: {
          include: {
            product: {
              select: { 
                id: true, 
                name: true, 
                sku: true, 
                stock: true, 
                reservedStock: true,
                salePrice: true,
              },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true, username: true },
        },
        approvedBy: {
          select: { id: true, name: true, username: true },
        },
        client: true,
        sale: true,
        history: {
          include: {
            user: {
              select: { id: true, name: true, username: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }

    return order;
  }

  /**
   * Editar un pedido pendiente (BODEGA/CAJERO/ADMIN)
   * - Solo se puede editar si está PENDING
   * - Ajusta stock reservado según cambios
   * - Registra cambios en history
   */
  async update(id: number, data: UpdateOrderDto, userId: number) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Obtener pedido actual
      const order = await tx.order.findUnique({
        where: { id },
        include: {
          details: true,
        },
      });

      if (!order) {
        throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException(
          `No se puede editar un pedido con estado ${order.status}`
        );
      }

      // 2. Procesar cambios en los detalles
      const changes: any[] = [];

      if (data.details) {
        // Mapear detalles actuales
        const currentDetailsMap = new Map(
          order.details.map(d => [d.productId, d])
        );

        // Procesar cada nuevo detalle
        for (const newDetail of data.details) {
          const currentDetail = currentDetailsMap.get(newDetail.productId);

          if (!currentDetail) {
            // Producto nuevo agregado
            const product = await tx.product.findUnique({
              where: { id: newDetail.productId },
            });

            if (!product) {
              throw new BadRequestException(
                `Producto con ID ${newDetail.productId} no existe`
              );
            }

            const availableStock = product.stock - product.reservedStock;
            if (availableStock < newDetail.quantity) {
              throw new BadRequestException(
                `Stock insuficiente para "${product.name}". ` +
                `Disponible: ${availableStock}, Solicitado: ${newDetail.quantity}`
              );
            }

            // Reservar stock del nuevo producto
            await tx.product.update({
              where: { id: newDetail.productId },
              data: {
                reservedStock: {
                  increment: newDetail.quantity,
                },
              },
            });

            changes.push({
              productId: newDetail.productId,
              productName: product.name,
              action: 'ADDED',
              quantity: newDetail.quantity,
            });

          } else if (currentDetail.quantity !== newDetail.quantity) {
            // Cantidad cambiada
            const product = await tx.product.findUnique({
              where: { id: newDetail.productId },
            });

            const difference = newDetail.quantity - currentDetail.quantity;

            if (difference > 0) {
              // Aumentó la cantidad - verificar stock disponible
              const availableStock = product!.stock - product!.reservedStock;
              if (availableStock < difference) {
                throw new BadRequestException(
                  `Stock insuficiente para "${product!.name}". ` +
                  `Disponible adicional: ${availableStock}, Solicitado: ${difference}`
                );
              }
            }

            // Ajustar stock reservado
            await tx.product.update({
              where: { id: newDetail.productId },
              data: {
                reservedStock: {
                  increment: difference, // Puede ser positivo o negativo
                },
              },
            });

            changes.push({
              productId: newDetail.productId,
              productName: product!.name,
              action: 'MODIFIED',
              from: currentDetail.quantity,
              to: newDetail.quantity,
            });
          }
        }

        // Detectar productos eliminados
        for (const currentDetail of order.details) {
          const stillExists = data.details.find(d => d.productId === currentDetail.productId);
          if (!stillExists) {
            // Producto eliminado - liberar stock
            await tx.product.update({
              where: { id: currentDetail.productId },
              data: {
                reservedStock: {
                  decrement: currentDetail.quantity,
                },
              },
            });

            const product = await tx.product.findUnique({
              where: { id: currentDetail.productId },
              select: { name: true },
            });

            changes.push({
              productId: currentDetail.productId,
              productName: product!.name,
              action: 'REMOVED',
              quantity: currentDetail.quantity,
            });
          }
        }

        // 3. Actualizar detalles del pedido
        await tx.orderDetail.deleteMany({
          where: { orderId: id },
        });

        await tx.orderDetail.createMany({
          data: data.details.map(d => ({
            orderId: id,
            productId: d.productId,
            quantity: d.quantity,
            originalQty: order.details.find(od => od.productId === d.productId)?.originalQty || d.quantity,
            unitPrice: d.unitPrice,
            totalPrice: d.totalPrice,
          })),
        });

        // Recalcular total
        const newTotal = data.details.reduce((sum, d) => sum + d.totalPrice, 0);
        await tx.order.update({
          where: { id },
          data: {
            totalAmount: newTotal,
          },
        });
      }

      // 4. Registrar en historial
      if (changes.length > 0) {
        await tx.orderHistory.create({
          data: {
            orderId: id,
            action: 'EDITED',
            userId,
            changes: JSON.stringify(changes),
          },
        });
      }

      // 5. Retornar pedido actualizado
      return await tx.order.findUnique({
        where: { id },
        include: {
          details: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, stock: true },
              },
            },
          },
          history: {
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    });
  }

  /**
   * Aprobar pedido y convertir en venta (BODEGA/CAJERO/ADMIN)
   * - Libera stock reservado
   * - Consume lotes FIFO
   * - Descuenta stock real
   * - Crea venta
   * - Registra en historial
   */
  async approve(id: number, approveDto: ApproveOrderDto, userId: number) {
    console.log(`🚀 Aprobando pedido ${id}...`);

    return await this.prisma.$transaction(async (tx) => {
      // 1. Obtener pedido
      const order = await tx.order.findUnique({
        where: { id },
        include: {
          details: {
            include: {
              product: true,
            },
          },
          client: true,
        },
      });

      if (!order) {
        throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException(
          `El pedido ya fue ${order.status === OrderStatus.APPROVED ? 'aprobado' : 'cancelado'}`
        );
      }

      // 2. Validar que todavía hay stock disponible
      for (const detail of order.details) {
        const currentStock = detail.product.stock - detail.product.reservedStock;
        if (currentStock < 0) {
          // Esto no debería pasar, pero verificamos
          throw new BadRequestException(
            `Error de consistencia: stock de "${detail.product.name}" está en negativo`
          );
        }
      }

      // 3. Calcular rentabilidad usando FIFO
      const saleDetailsWithProfit = await Promise.all(
        order.details.map(async (detail) => {
          const unitPrice = detail.unitPrice;
          const quantity = detail.quantity;
          
          // Consumir lotes FIFO y obtener costo real
          let realCost = detail.product.purchasePrice; // Fallback
          
          try {
            const fifoResult = await this.batchService.consumeBatchesFIFO(
              detail.productId,
              quantity
            );
            realCost = fifoResult.averageCost;
            console.log(`✅ FIFO: Producto ${detail.product.name}, Costo Real: $${realCost.toFixed(2)}`);
          } catch (error) {
            console.warn(`⚠️ No hay lotes FIFO para ${detail.product.name}, usando costo genérico`);
          }

          const profitAmount = unitPrice - realCost;
          const profitMargin = realCost > 0 ? (profitAmount / realCost) * 100 : 0;

          return {
            productId: detail.productId,
            quantity,
            unitPrice,
            totalPrice: detail.totalPrice,
            purchasePrice: realCost,
            profitAmount,
            profitMargin,
            suggestedPrice: detail.product.suggestedPrice,
          };
        })
      );

      // 4. Validar pagos
      const totalPayments = approveDto.payments.reduce(
        (sum, p) => sum + parseFloat(p.amount), 
        0
      );

      if (Math.abs(totalPayments - order.totalAmount) > 0.01) {
        throw new BadRequestException(
          `La suma de los pagos ($${totalPayments}) no coincide con el total del pedido ($${order.totalAmount})`
        );
      }

      // 5. Crear venta
      const sale = await tx.sale.create({
        data: {
          date: new Date(), // Fecha de confirmación (hoy)
          customerName: order.customerName,
          clientId: order.clientId,
          subtotalAmount: order.totalAmount, // Sin descuento en pedidos
          discountType: null,
          discountValue: null,
          discountAmount: 0,
          totalAmount: order.totalAmount,
          paidAmount: totalPayments,
          isPaid: totalPayments >= order.totalAmount,
          paymentMethod: approveDto.payments[0]?.method || 'Múltiple',
          details: {
            create: saleDetailsWithProfit,
          },
        },
        include: {
          details: true,
        },
      });

      // 6. Crear registros de pago
      await Promise.all(
        approveDto.payments.map(payment =>
          tx.salePayment.create({
            data: {
              saleId: sale.id,
              amount: parseFloat(payment.amount),
              method: payment.method,
              note: payment.note,
              date: new Date(),
            },
          })
        )
      );

      // 7. LIBERAR stock reservado y DESCONTAR stock real
      for (const detail of order.details) {
        await tx.product.update({
          where: { id: detail.productId },
          data: {
            reservedStock: {
              decrement: detail.quantity, // Liberar reserva
            },
            stock: {
              decrement: detail.quantity, // Descontar stock real
            },
          },
        });
      }

      // 8. Actualizar order a APPROVED
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.APPROVED,
          approvedById: userId,
          approvedAt: new Date(),
          saleId: sale.id,
        },
        include: {
          details: true,
          createdBy: {
            select: { name: true },
          },
        },
      });

      // 9. Registrar en historial
      await tx.orderHistory.create({
        data: {
          orderId: id,
          action: 'APPROVED',
          userId,
          previousStatus: 'PENDING',
          newStatus: 'APPROVED',
          changes: `Pedido aprobado y convertido en venta #${sale.id}`,
        },
      });

      console.log(`✅ Pedido ${order.orderNumber} aprobado y convertido en venta #${sale.id}`);

      return {
        order: updatedOrder,
        sale,
      };
    });
  }

  /**
   * Cancelar/eliminar pedido (ADMIN)
   * - Solo si está PENDING
   * - Libera stock reservado
   * - Registra en historial
   */
  async remove(id: number, userId: number) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Obtener pedido
      const order = await tx.order.findUnique({
        where: { id },
        include: {
          details: true,
        },
      });

      if (!order) {
        throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException(
          `Solo se pueden cancelar pedidos pendientes. Estado actual: ${order.status}`
        );
      }

      // 2. LIBERAR stock reservado
      for (const detail of order.details) {
        await tx.product.update({
          where: { id: detail.productId },
          data: {
            reservedStock: {
              decrement: detail.quantity,
            },
          },
        });
      }

      // 3. Actualizar order a CANCELLED
      const cancelledOrder = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
        },
      });

      // 4. Registrar en historial
      await tx.orderHistory.create({
        data: {
          orderId: id,
          action: 'CANCELLED',
          userId,
          previousStatus: order.status,
          newStatus: 'CANCELLED',
          changes: `Pedido cancelado por el usuario`,
        },
      });

      console.log(`✅ Pedido ${order.orderNumber} cancelado y stock liberado`);

      return cancelledOrder;
    });
  }

  /**
   * Obtener historial de cambios de un pedido
   */
  async getHistory(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }

    return await this.prisma.orderHistory.findMany({
      where: { orderId: id },
      include: {
        user: {
          select: { id: true, name: true, username: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtener estadísticas de pedidos
   */
  async getStatistics() {
    const [pending, approved, cancelled, total] = await Promise.all([
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { status: OrderStatus.APPROVED } }),
      this.prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
      this.prisma.order.count(),
    ]);

    const pendingOrders = await this.prisma.order.findMany({
      where: { status: OrderStatus.PENDING },
      include: {
        details: true,
        createdBy: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const totalPendingAmount = pendingOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      total,
      pending,
      approved,
      cancelled,
      pendingOrders: {
        count: pending,
        totalAmount: totalPendingAmount,
        orders: pendingOrders,
      },
    };
  }
}

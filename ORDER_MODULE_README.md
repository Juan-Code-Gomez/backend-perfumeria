# Módulo de Pedidos (Orders)

## 📋 Descripción General

Sistema completo de gestión de pedidos con aprobación de bodega, diseñado para el flujo de trabajo:

**VENDEDOR** crea pedido → **BODEGA/CAJERO** revisa/edita → **BODEGA/CAJERO/ADMIN** aprueba → Sistema crea venta automáticamente

## 🗂️ Estructura de Base de Datos

### Tablas Creadas

#### `orders`
- `id`: ID único del pedido
- `orderNumber`: Número de pedido (OD-0001, OD-0002, etc.)
- `orderDate`: Fecha de creación
- `status`: PENDING | APPROVED | CANCELLED
- `totalAmount`: Monto total
- `customerName`: Nombre del cliente (opcional)
- `clientId`: Relación con tabla Client (opcional)
- `notes`: Observaciones del vendedor
- `createdById`: Usuario que creó el pedido (VENDEDOR)
- `approvedById`: Usuario que aprobó (BODEGA/CAJERO/ADMIN)
- `approvedAt`: Fecha y hora de aprobación
- `saleId`: Relación con venta generada (cuando se aprueba)

#### `order_details`
- `id`: ID único del detalle
- `orderId`: Relación con pedido
- `productId`: Producto solicitado
- `quantity`: Cantidad solicitada (puede editarse)
- `originalQty`: Cantidad original (auditoría)
- `unitPrice`: Precio unitario
- `totalPrice`: Precio total de la línea

#### `order_history`
- `id`: ID único del registro
- `orderId`: Relación con pedido
- `action`: CREATED | EDITED | APPROVED | CANCELLED
- `userId`: Usuario que realizó la acción
- `changes`: JSON con detalles de cambios (para EDITED)
- `notes`: Notas adicionales
- `timestamp`: Fecha y hora de la acción

### Campo Agregado a `products`
- `reservedStock`: Stock reservado por pedidos pendientes (Float, default: 0)

## 🔄 Flujo de Negocio

### 1. Creación de Pedido (VENDEDOR)
```
POST /orders
Roles: VENDEDOR, CAJERO, ADMIN, BODEGA

✅ Valida stock disponible (stock - reservedStock)
✅ Genera número de pedido automático (OD-XXXX)
✅ Crea Order + OrderDetail
✅ RESERVA stock (incrementa reservedStock)
✅ Registra en OrderHistory (CREATED)
```

### 2. Edición de Pedido (CAJERO/ADMIN)
```
PATCH /orders/:id
Roles: CAJERO, ADMIN

✅ Solo pedidos PENDING pueden editarse
✅ Detecta productos agregados/eliminados/modificados
✅ Ajusta stock reservado según cambios
✅ Actualiza detalles del pedido
✅ Registra cambios en OrderHistory (EDITED) con JSON detallado
```

### 3. Aprobación de Pedido (BODEGA/CAJERO/ADMIN)
```
POST /orders/:id/approve
Roles: BODEGA, CAJERO, ADMIN

✅ Valida pagos (suma de pagos = total pedido)
✅ Consume lotes FIFO para calcular costo real
✅ Crea Sale + SaleDetail con profitAmount y profitMargin
✅ Crea SalePayment para cada forma de pago
✅ LIBERA stock reservado (decrementa reservedStock)
✅ DESCUENTA stock real (decrementa stock)
✅ Marca pedido como APPROVED
✅ Registra en OrderHistory (APPROVED)
```

### 4. Cancelación de Pedido (ADMIN)
```
DELETE /orders/:id
Roles: ADMIN

✅ Solo pedidos PENDING pueden cancelarse
✅ LIBERA stock reservado
✅ Marca pedido como CANCELLED
✅ Registra en OrderHistory (CANCELLED)
```

## 📡 Endpoints del API

| Método | Endpoint | Roles | Descripción |
|--------|----------|-------|-------------|
| POST | `/orders` | VENDEDOR, CAJERO, ADMIN, BODEGA | Crear pedido |
| GET | `/orders` | VENDEDOR, CAJERO, ADMIN, BODEGA | Listar pedidos (VENDEDOR solo ve los suyos) |
| GET | `/orders/statistics` | BODEGA, CAJERO, ADMIN | Obtener estadísticas de pedidos |
| GET | `/orders/:id` | VENDEDOR, CAJERO, ADMIN, BODEGA | Ver detalle de pedido |
| GET | `/orders/:id/history` | BODEGA, CAJERO, ADMIN | Ver historial de cambios |
| PATCH | `/orders/:id` | CAJERO, ADMIN | Editar pedido pendiente |
| POST | `/orders/:id/approve` | BODEGA, CAJERO, ADMIN | Aprobar y convertir en venta |
| DELETE | `/orders/:id` | ADMIN | Cancelar pedido |

## 🎯 DTOs

### CreateOrderDto
```typescript
{
  customerName?: string;
  clientId?: number;
  totalAmount: number;
  notes?: string;
  details: [
    {
      productId: number;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }
  ]
}
```

### UpdateOrderDto
```typescript
{
  details?: [
    {
      productId: number;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }
  ]
}
```

### ApproveOrderDto
```typescript
{
  payments: [
    {
      method: string;  // Efectivo, Tarjeta, Transferencia, etc.
      amount: string;
      note?: string;
    }
  ]
}
```

## 🔐 Permisos por Rol

### VENDEDOR
- ✅ Crear pedidos
- ✅ Ver sus propios pedidos
- ❌ Editar pedidos
- ❌ Aprobar pedidos
- ❌ Cancelar pedidos

### BODEGA
- ✅ Crear pedidos
- ✅ Ver todos los pedidos
- ❌ Editar pedidos (solo revisa)
- ✅ **Aprobar pedidos** (rol principal)
- ❌ Cancelar pedidos

### CAJERO
- ✅ Crear pedidos
- ✅ Ver todos los pedidos
- ✅ Editar pedidos pendientes
- ✅ Aprobar pedidos
- ❌ Cancelar pedidos

### ADMIN
- ✅ Crear pedidos
- ✅ Ver todos los pedidos
- ✅ Editar pedidos pendientes
- ✅ Aprobar pedidos
- ✅ **Cancelar pedidos** (único rol)

## 🧮 Cálculo de Costos y Rentabilidad

Al aprobar un pedido:

1. **Consume lotes FIFO** del ProductBatchService
2. Calcula **costo real promedio** basado en lotes consumidos
3. Si no hay lotes FIFO, usa `purchasePrice` genérico
4. Calcula:
   - `profitAmount = unitPrice - realCost`
   - `profitMargin = (profitAmount / realCost) * 100`
5. Guarda estos valores en `SaleDetail`

## 🚀 Integración con Módulos Existentes

### PrismaModule
- Usado para todas las operaciones de base de datos
- Transacciones para garantizar consistencia

### ProductBatchModule
- Método `consumeBatchesFIFO()` para calcular costo real
- FIFO solo se ejecuta al aprobar pedido (no al crearlo)

### AuthModule
- JwtAuthGuard para autenticación
- RolesGuard para control de acceso por rol
- @Roles() decorator en cada endpoint

## 📊 Estadísticas Disponibles

`GET /orders/statistics` retorna:
```typescript
{
  total: number;           // Total de pedidos
  pending: number;         // Pedidos pendientes
  approved: number;        // Pedidos aprobados
  cancelled: number;       // Pedidos cancelados
  pendingOrders: {
    count: number;         // Cantidad de pedidos pendientes
    totalAmount: number;   // Monto total comprometido
    orders: Order[];       // Lista de pedidos pendientes
  }
}
```

## 🔍 Auditoría y Trazabilidad

### OrderHistory registra:
- **CREATED**: Pedido creado, quién lo creó, cuántos productos
- **EDITED**: Cambios realizados con JSON detallado:
  ```json
  {
    "productId": 5,
    "productName": "Perfume X",
    "action": "MODIFIED",
    "from": 10,
    "to": 5
  }
  ```
- **APPROVED**: Aprobación y conversión a venta
- **CANCELLED**: Cancelación con usuario responsable

### originalQty en OrderDetail
- Guarda la cantidad original del pedido
- Permite rastrear si la cantidad fue editada antes de aprobar

## 🧪 Flujo de Prueba Recomendado

### 1. Login como VENDEDOR
```bash
POST /auth/login
{
  "username": "vendedor",
  "password": "vendedor2024!"
}
```

### 2. Crear Pedido
```bash
POST /orders
Authorization: Bearer <token-vendedor>
{
  "customerName": "Cliente Test",
  "totalAmount": 150.00,
  "details": [
    {
      "productId": 1,
      "quantity": 3,
      "unitPrice": 50.00,
      "totalPrice": 150.00
    }
  ]
}
```

### 3. Login como CAJERO y Editar
```bash
PATCH /orders/1
Authorization: Bearer <token-cajero>
{
  "details": [
    {
      "productId": 1,
      "quantity": 2,
      "unitPrice": 50.00,
      "totalPrice": 100.00
    }
  ]
}
```

### 4. Login como BODEGA y Aprobar
```bash
POST /orders/1/approve
Authorization: Bearer <token-bodega>
{
  "payments": [
    {
      "method": "Efectivo",
      "amount": "100.00"
    }
  ]
}
```

### 5. Verificar Resultados
- Ver pedido aprobado: `GET /orders/1`
- Ver venta creada: `GET /sales/<saleId>`
- Ver historial: `GET /orders/1/history`
- Verificar stock actualizado: `GET /products/<productId>`

## ✅ Estado de Implementación

- [x] Modelos de base de datos (Order, OrderDetail, OrderHistory, OrderStatus enum)
- [x] Campo reservedStock en Product
- [x] Rol BODEGA agregado al sistema
- [x] Módulo "pedidos" agregado con permisos
- [x] OrderService completo con toda la lógica
- [x] OrderController con guards y roles
- [x] DTOs con validaciones class-validator
- [x] Compilación exitosa
- [ ] Pruebas funcionales completas
- [ ] Frontend para gestión de pedidos

## 🎨 Próximos Pasos para Frontend

### Componentes a crear:
1. **CreateOrderForm**: Formulario para crear pedidos
2. **OrderList**: Lista de pedidos con filtros por estado
3. **OrderDetail**: Vista detallada con botones de acción según rol
4. **ApproveOrderModal**: Modal para aprobar con formas de pago
5. **OrderHistoryTimeline**: Línea de tiempo con cambios

### Servicios:
- `orderService.ts` con métodos para cada endpoint
- Integración con Redux store para estado global

---

**Autor**: Sistema de Pedidos implementado para perfumería
**Fecha**: 2025
**Versión**: 1.0.0

# Guía de Prueba - Módulo de Facturas con FIFO

## ✅ Estado del Sistema

**MIGRACIÓN COMPLETADA EXITOSAMENTE**
- ✅ Campo `notes` agregado a la tabla `Invoice`
- ✅ Prisma Client regenerado con tipos correctos
- ✅ TypeScript Server reiniciado - errores resueltos
- ✅ Backend compilado sin errores
- ✅ Servidor iniciado en modo desarrollo

## 📋 Resumen del Flujo

El módulo de facturas implementa el siguiente flujo automático:

```
📄 FACTURA PROVEEDOR
    ↓
🛒 COMPRA (Purchase)
    ↓
📦 LOTES FIFO (ProductBatch)
    ↓
📊 ACTUALIZACIÓN INVENTARIO (Product.stock)
```

**TODO EN UNA SOLA TRANSACCIÓN** - Si algo falla, todo se revierte.

## 🔧 Endpoint Disponible

### POST `/api/invoices`

Crea una factura con sus productos y procesa automáticamente el inventario.

**Body (JSON):**
```json
{
  "invoiceNumber": "F-2024-001",
  "supplierId": 1,
  "discount": 50,
  "processInventory": true,
  "items": [
    {
      "productId": 5,
      "quantity": 10,
      "unitCost": 150.50,
      "description": "Perfume Dior Sauvage 100ml",
      "batchNumber": "BATCH-2024-001",
      "expiryDate": "2025-12-31"
    },
    {
      "productId": 8,
      "quantity": 5,
      "unitCost": 200.00,
      "description": "Perfume Chanel N°5 50ml",
      "batchNumber": "BATCH-2024-002",
      "expiryDate": "2026-06-30"
    }
  ]
}
```

## 🧪 Pasos para Probar

### 1. Verificar que hay un proveedor en la BD

```sql
SELECT id, name FROM "Supplier" LIMIT 5;
```

Si no hay proveedores, crear uno:
```sql
INSERT INTO "Supplier" (name, "contactInfo", "createdAt", "updatedAt")
VALUES ('Proveedor Prueba', 'info@proveedor.com', NOW(), NOW())
RETURNING id, name;
```

### 2. Verificar que hay productos en la BD

```sql
SELECT id, name, stock, "purchasePrice" FROM "Product" WHERE "isActive" = true LIMIT 5;
```

### 3. Probar el Endpoint con Thunder Client o Postman

**URL:** `http://localhost:3000/api/invoices`

**Método:** POST

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <tu-token-jwt>
```

**Body de ejemplo (ajusta los IDs según tu BD):**
```json
{
  "invoiceNumber": "F-TEST-001",
  "supplierId": 1,
  "discount": 0,
  "processInventory": true,
  "items": [
    {
      "productId": 1,
      "quantity": 10,
      "unitCost": 100.00,
      "description": "Producto de prueba",
      "batchNumber": "LOTE-001",
      "expiryDate": "2025-12-31"
    }
  ]
}
```

### 4. Verificar los Logs en la Consola

Deberías ver estos emojis en los logs:

```
🔍 Validando 1 productos...
✅ Productos validados
💰 Calculando totales...
   Subtotal: 1000.00
   Descuento: 0.00
   Total: 1000.00
📄 Factura created: F-TEST-001
🛒 Compra created: COMP-xxxxx
📦 Lote creado: LOTE-001 para producto 1 (10 unidades)
✅ Stock actualizado: Producto 1 ahora tiene XX unidades
```

### 5. Verificar en la Base de Datos

```sql
-- Ver la factura creada
SELECT * FROM "Invoice" WHERE "invoiceNumber" = 'F-TEST-001';

-- Ver los items de la factura
SELECT ii.*, p.name as product_name
FROM "InvoiceItem" ii
JOIN "Product" p ON p.id = ii."productId"
WHERE ii."invoiceId" = (SELECT id FROM "Invoice" WHERE "invoiceNumber" = 'F-TEST-001');

-- Ver la compra generada
SELECT * FROM "Purchase" WHERE "supplierId" = 1 ORDER BY "createdAt" DESC LIMIT 1;

-- Ver los lotes FIFO creados
SELECT pb.*, p.name as product_name
FROM "ProductBatch" pb
JOIN "Product" p ON p.id = pb."productId"
WHERE pb."batchNumber" = 'LOTE-001';

-- Ver el stock actualizado del producto
SELECT id, name, stock FROM "Product" WHERE id = 1;
```

## 📊 Respuesta Esperada

```json
{
  "id": 123,
  "invoiceNumber": "F-TEST-001",
  "supplierName": "Proveedor Prueba",
  "amount": 1000.00,
  "paidAmount": 0,
  "status": "PENDING",
  "description": null,
  "notes": null,
  "invoiceDate": "2024-01-15T12:00:00.000Z",
  "dueDate": null,
  "createdAt": "2024-01-15T12:00:00.000Z",
  "updatedAt": "2024-01-15T12:00:00.000Z",
  "hasInventoryImpact": true,
  "inventoryProcessed": true,
  "isHistorical": false,
  "needsReconciliation": false,
  "originalDocument": null,
  "pricesAnalyzed": false,
  "supplierId": 1,
  "InvoiceItem": [
    {
      "id": 456,
      "invoiceId": 123,
      "description": "Producto de prueba",
      "quantity": 10,
      "unitPrice": 100,
      "totalPrice": 1000,
      "productId": 1,
      "shouldCreateProduct": false,
      "affectInventory": true,
      "currentMarketPrice": null,
      "priceVariation": null,
      "profitMargin": null,
      "notes": null,
      "createdAt": "2024-01-15T12:00:00.000Z",
      "updatedAt": "2024-01-15T12:00:00.000Z"
    }
  ],
  "Supplier": {
    "id": 1,
    "name": "Proveedor Prueba",
    "contactInfo": "info@proveedor.com"
  }
}
```

## 🔍 Casos de Prueba

### Caso 1: Factura Simple (1 producto)
- ✅ Crea factura
- ✅ Crea compra
- ✅ Crea 1 lote FIFO
- ✅ Aumenta stock del producto

### Caso 2: Factura Múltiple (varios productos)
- ✅ Crea factura
- ✅ Crea compra con múltiples detalles
- ✅ Crea múltiples lotes FIFO
- ✅ Aumenta stock de todos los productos

### Caso 3: Factura con Descuento
- ✅ Aplica descuento al total
- ✅ Total = Subtotal - Descuento

### Caso 4: Sin Procesar Inventario (`processInventory: false`)
- ✅ Solo crea la factura
- ❌ NO crea compra
- ❌ NO crea lotes
- ❌ NO actualiza stock

### Caso 5: Producto Inexistente
- ❌ Retorna error 404
- ❌ No se crea nada (transacción revertida)

### Caso 6: Proveedor Inexistente
- ❌ Retorna error 404
- ❌ No se crea nada (transacción revertida)

## ⚠️ Errores Comunes

### Error: "Supplier with ID X not found"
**Solución:** Verifica que el `supplierId` exista en la tabla `Supplier`.

### Error: "Product with ID X not found"
**Solución:** Verifica que todos los `productId` en `items` existan en la tabla `Product`.

### Error: "Invoice number already exists"
**Solución:** Usa un número de factura diferente (único).

### Error: "Unauthorized"
**Solución:** Asegúrate de enviar el token JWT en el header `Authorization: Bearer <token>`.

## 🎯 Siguiente Paso: Frontend

Una vez que el backend funcione correctamente, se debe crear:

1. **Formulario de Factura** (`InvoiceForm.tsx`)
   - Input para número de factura
   - Selector de proveedor
   - Tabla dinámica para agregar productos
   - Botón "Procesar Inventario"

2. **Tabla de Items Dinámica**
   - Agregar/eliminar filas
   - Autocompletar productos
   - Calcular totales automáticamente

3. **Vista de Facturas** (`InvoiceList.tsx`)
   - Listar todas las facturas
   - Filtros por proveedor, fecha, estado
   - Ver detalles de factura

## 📝 Notas Técnicas

- **Transacción Atómica:** Todo el proceso está envuelto en `prisma.$transaction()`, si algo falla, nada se guarda.
- **FIFO Automático:** Cada item de la factura crea un lote FIFO con fecha de compra actual.
- **Stock Automático:** El stock se actualiza sumando la cantidad de cada item.
- **Compra Automática:** Se crea automáticamente una compra con estado COMPLETED.
- **Logs Detallados:** Todos los pasos se registran en consola para debugging.

## ✅ Checklist de Validación

- [ ] Endpoint POST `/api/invoices` responde correctamente
- [ ] Se crea el registro en tabla `Invoice`
- [ ] Se crean registros en tabla `InvoiceItem`
- [ ] Se crea registro en tabla `Purchase`
- [ ] Se crean registros en tabla `ProductBatch` (lotes FIFO)
- [ ] El stock de los productos se actualiza correctamente
- [ ] Los logs muestran emojis informativos
- [ ] La transacción se revierte si hay error

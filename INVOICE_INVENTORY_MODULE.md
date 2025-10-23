# 🧾 Módulo de Facturas con Inventario FIFO Integrado

## 📋 Resumen
Sistema completo para registrar facturas de proveedores que automáticamente:
1. Crea la factura con sus productos
2. Genera una compra automática
3. Crea lotes FIFO para cada producto
4. Actualiza el inventario

**Fecha de implementación**: 23 de Octubre, 2025

---

## 🎯 Características Principales

### ✅ **Registro de Facturas**
- Número de factura único
- Vinculación con proveedor
- Fecha de factura y vencimiento
- Descuentos aplicados
- Estado de pago (PENDING, PARTIAL, PAID)
- Notas adicionales

### ✅ **Gestión de Productos**
- Agregar múltiples productos a la factura
- Cantidad, costo unitario por producto
- Descripción personalizada
- Número de lote del proveedor (opcional)
- Fecha de vencimiento del producto (opcional)

### ✅ **Procesamiento Automático de Inventario**
- Crea compra automáticamente vinculada
- Genera lotes FIFO con costos reales
- Actualiza stock de productos
- Trazabilidad completa

### ✅ **Control de Pagos**
- Registro de montos pagados
- Cálculo automático de saldo pendiente
- Estados dinámicos según pagos

---

## 🗂️ Estructura de Datos

### **CreateInvoiceDto**

```typescript
{
  invoiceNumber: string;        // Número único de factura
  supplierId: number;           // ID del proveedor
  discount?: number;            // Descuento aplicado
  paidAmount?: number;          // Monto pagado
  description?: string;         // Descripción general
  notes?: string;               // Notas adicionales
  invoiceDate: string;          // Fecha de la factura
  dueDate?: string;             // Fecha de vencimiento
  processInventory?: boolean;   // Procesar inventario (default: true)
  
  items: [
    {
      productId: number;        // ID del producto
      quantity: number;         // Cantidad comprada
      unitCost: number;         // Costo unitario
      description?: string;     // Descripción del item
      batchNumber?: string;     // Número de lote del proveedor
      expiryDate?: string;      // Fecha de vencimiento
    }
  ]
}
```

---

## 🔄 Flujo de Procesamiento

```
┌──────────────────┐
│ CREAR FACTURA    │
│ POST /invoices   │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ VALIDACIONES                         │
├──────────────────────────────────────┤
│ ✓ Proveedor existe                   │
│ ✓ Todos los productos existen        │
│ ✓ Número de factura único            │
│ ✓ Cantidades y costos válidos        │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ CÁLCULOS AUTOMÁTICOS                 │
├──────────────────────────────────────┤
│ • Subtotal = Σ(cantidad × costo)     │
│ • Total = Subtotal - Descuento       │
│ • Estado = fn(total, pagado)         │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ TRANSACCIÓN ATÓMICA                  │
└────────┬─────────────────────────────┘
         │
         ├─▶ 1. Crear Invoice
         │   └─ Datos principales
         │
         ├─▶ 2. Crear InvoiceItems
         │   └─ Un item por cada producto
         │
         ├─▶ 3. Crear Purchase (si processInventory)
         │   └─ Compra vinculada con detalles
         │
         ├─▶ 4. Crear ProductBatches (FIFO)
         │   └─ Un lote por cada producto
         │
         └─▶ 5. Actualizar Stock
             └─ Incrementar stock de productos
```

---

## 📊 Ejemplo de Uso

### **Caso 1: Factura Simple con 3 Productos**

**Request:**
```http
POST /api/invoices
Content-Type: application/json

{
  "invoiceNumber": "F-2025-001",
  "supplierId": 1,
  "discount": 50000,
  "paidAmount": 500000,
  "invoiceDate": "2025-10-23",
  "dueDate": "2025-11-23",
  "notes": "Primera compra del mes",
  "items": [
    {
      "productId": 1,
      "quantity": 10,
      "unitCost": 25000,
      "description": "Miss Dior 100ml",
      "batchNumber": "LOTE-MD-2025-10",
      "expiryDate": "2027-10-23"
    },
    {
      "productId": 2,
      "quantity": 5,
      "unitCost": 35000,
      "description": "Chanel No. 5 50ml"
    },
    {
      "productId": 3,
      "quantity": 8,
      "unitCost": 28000,
      "description": "Dior Sauvage 100ml"
    }
  ]
}
```

**Cálculos Automáticos:**
```
Producto 1: 10 × $25,000 = $250,000
Producto 2:  5 × $35,000 = $175,000
Producto 3:  8 × $28,000 = $224,000
─────────────────────────────────────
Subtotal:                   $649,000
Descuento:                  -$50,000
─────────────────────────────────────
TOTAL:                      $599,000
Pagado:                     $500,000
Saldo:                       $99,000
Estado:                      PARTIAL
```

**Resultado:**
```
✅ Factura F-2025-001 creada
✅ 3 items agregados
✅ Compra #5 creada automáticamente
✅ 3 lotes FIFO creados:
   📦 Lote #1: Producto 1, 10 unid @ $25,000
   📦 Lote #2: Producto 2, 5 unid @ $35,000
   📦 Lote #3: Producto 3, 8 unid @ $28,000
✅ Stock actualizado:
   • Producto 1: +10 unidades
   • Producto 2: +5 unidades
   • Producto 3: +8 unidades
```

---

### **Caso 2: Factura Sin Procesamiento de Inventario**

Para facturas históricas o que no afectan inventario:

```json
{
  "invoiceNumber": "F-HIST-2024-100",
  "supplierId": 1,
  "invoiceDate": "2024-12-01",
  "processInventory": false,  // ← No procesar inventario
  "items": [...]
}
```

**Resultado:**
```
✅ Factura creada
✅ Items registrados
❌ NO se crea compra
❌ NO se crean lotes
❌ NO se actualiza stock
```

---

## 🔌 Endpoints API

### **1. Crear Factura**
```http
POST /api/invoices
```

**Body:** Ver CreateInvoiceDto arriba

**Response:**
```json
{
  "id": 1,
  "invoiceNumber": "F-2025-001",
  "supplierName": "Distribuidora ABC",
  "supplierId": 1,
  "amount": 599000,
  "paidAmount": 500000,
  "status": "PARTIAL",
  "invoiceDate": "2025-10-23T00:00:00.000Z",
  "dueDate": "2025-11-23T00:00:00.000Z",
  "notes": "Primera compra del mes",
  "Supplier": { ... },
  "InvoiceItem": [
    {
      "id": 1,
      "productId": 1,
      "description": "Miss Dior 100ml",
      "quantity": 10,
      "unitPrice": 25000,
      "totalPrice": 250000,
      "Product": { ... }
    },
    ...
  ]
}
```

---

### **2. Listar Facturas**
```http
GET /api/invoices
GET /api/invoices?status=PENDING
GET /api/invoices?overdue=true
GET /api/invoices?supplierId=1
```

**Response:** Array de facturas con relaciones

---

### **3. Ver Factura Individual**
```http
GET /api/invoices/:id
```

**Response:** Factura completa con supplier, items y productos

---

### **4. Pagar Factura**
```http
POST /api/invoices/:id/pay
```

**Body:**
```json
{
  "amount": 99000
}
```

**Resultado:**
- Incrementa `paidAmount`
- Recalcula `status` automáticamente
- Valida que no se pague más del saldo

---

### **5. Eliminar Factura**
```http
DELETE /api/invoices/:id
```

⚠️ **Nota:** Si la factura ya procesó inventario, considerar validaciones adicionales

---

## 💡 Ventajas del Sistema

### **Para el Negocio**
✅ Un solo proceso para registrar factura e inventario  
✅ Menos errores de transcripción  
✅ Trazabilidad completa factura → compra → lotes  
✅ Control de pagos a proveedores  

### **Para Contabilidad**
✅ Factura vinculada con compra  
✅ Costos reales FIFO desde el origen  
✅ Saldo pendiente automático  
✅ Histórico completo  

### **Para Operaciones**
✅ Proceso rápido y automático  
✅ Stock actualizado inmediatamente  
✅ Información de vencimientos desde factura  
✅ Número de lote del proveedor registrado  

---

## 🔧 Instalación y Configuración

### **Paso 1: Ejecutar Migración SQL**
```bash
psql -U postgres -d perfumeria -f migrations/add-notes-to-invoice.sql
```

### **Paso 2: Regenerar Prisma Client**
```bash
npx prisma generate
```

### **Paso 3: Compilar Backend**
```bash
npm run build
```

### **Paso 4: Reiniciar Servidor**
```bash
npm run start:dev
```

---

## 🧪 Pruebas

### **Test 1: Crear Factura Básica**
```bash
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "invoiceNumber": "TEST-001",
    "supplierId": 1,
    "invoiceDate": "2025-10-23",
    "items": [
      {
        "productId": 1,
        "quantity": 5,
        "unitCost": 20000
      }
    ]
  }'
```

**Verificar:**
1. Factura creada
2. Item de factura creado
3. Compra creada
4. Lote creado
5. Stock incrementado +5

---

### **Test 2: Listar Facturas Pendientes**
```bash
curl http://localhost:3000/api/invoices?status=PENDING \
  -H "Authorization: Bearer TOKEN"
```

---

### **Test 3: Ver Factura con Detalles**
```bash
curl http://localhost:3000/api/invoices/1 \
  -H "Authorization: Bearer TOKEN"
```

---

## 📝 Próximas Mejoras

### **Corto Plazo**
- [ ] Validación de número de factura duplicado por proveedor
- [ ] Endpoint para revertir procesamiento de inventario
- [ ] Webhook para notificar facturas vencidas

### **Mediano Plazo**
- [ ] Subir PDF de factura del proveedor
- [ ] OCR para extraer datos automáticamente
- [ ] Análisis de precios vs mercado

### **Largo Plazo**
- [ ] Integración con sistema contable
- [ ] Reportes de deuda por proveedor
- [ ] Programación de pagos automáticos

---

## ⚠️ Consideraciones Importantes

### **Validaciones**
- ✅ Número de factura único
- ✅ Proveedor debe existir
- ✅ Productos deben existir
- ✅ Pago no puede superar el total

### **Transacciones**
- Todo el proceso usa transacciones atómicas
- Si falla cualquier paso, se revierte todo
- Logs detallados en consola del servidor

### **Estados de Factura**
- **PENDING**: No se ha pagado nada
- **PARTIAL**: Se pagó parcialmente
- **PAID**: Completamente pagada

---

## 📚 Archivos Relacionados

### **Backend**
- `src/invoice/dto/create-invoice.dto.ts` - DTOs actualizados
- `src/invoice/invoice.service.ts` - Lógica de negocio
- `src/invoice/invoice.module.ts` - Módulo con dependencias
- `prisma/schema.prisma` - Modelo Invoice actualizado
- `migrations/add-notes-to-invoice.sql` - Migración SQL

### **Dependencias**
- ProductBatchModule - Para crear lotes FIFO
- PurchaseModule - Para vincular compras
- SupplierModule - Para validar proveedores
- ProductModule - Para validar productos

---

✅ **Sistema implementado y listo para usar**

**Fecha**: 23 de Octubre, 2025  
**Versión**: 1.0.0

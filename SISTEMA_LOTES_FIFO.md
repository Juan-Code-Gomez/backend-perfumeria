# 📦 Sistema de Lotes FIFO - Guía Completa

## 🎯 ¿Qué Problema Resuelve?

### Problema Antes:
- **Producto**: Perfume X
- **Compra 1**: 2 unidades a $22,000
- **Compra 2**: 8 unidades a $28,000
- **Stock total**: 10 unidades
- **Costo en sistema**: $?? (impreciso)

**Cuando vendes 5 unidades, ¿cuál es el costo real?**
❌ Sistema anterior: Usa un solo `purchasePrice` promedio
❌ No sabes qué lote vendiste primero
❌ Ganancias calculadas incorrectamente

### Solución Ahora:
✅ **Sistema de Lotes con FIFO** (First In, First Out)
✅ Cada compra crea un **lote independiente**
✅ Las ventas consumen del **lote más antiguo primero**
✅ **Costo real** calculado automáticamente
✅ **Ganancias precisas** por venta

---

## 🏗️ Arquitectura del Sistema

### Modelo de Base de Datos

```sql
CREATE TABLE product_batches (
  id              SERIAL PRIMARY KEY,
  product_id      INTEGER NOT NULL,
  purchase_id     INTEGER,
  quantity        DOUBLE PRECISION NOT NULL,  -- Cantidad inicial
  remaining_qty   DOUBLE PRECISION NOT NULL,  -- Cantidad disponible
  unit_cost       DOUBLE PRECISION NOT NULL,  -- Costo de este lote
  purchase_date   TIMESTAMP NOT NULL,         -- Para ordenamiento FIFO
  expiry_date     TIMESTAMP,                  -- Fecha de vencimiento (opcional)
  batch_number    VARCHAR(255),               -- Número de lote del proveedor
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

### Relaciones

```
Purchase (Compra)
  ├─> PurchaseDetail (Detalle)
  └─> ProductBatch (Lote) ← NUEVO

Product (Producto)
  └─> ProductBatch[] (Lotes)
```

---

## 🔄 Flujo de Funcionamiento

### 1️⃣ **Compra de Productos**

**Acción**: Registras una compra de 8 perfumes X a $28,000

**Lo que sucede automáticamente:**

```typescript
// 1. Se crea la compra
Purchase #5
  ├─ Proveedor: Distribuidora ABC
  ├─ Fecha: 2025-10-22
  ├─ Total: $224,000
  └─ Detalle:
      └─ Perfume X: 8 unid × $28,000 = $224,000

// 2. Se crea el lote (NUEVO)
ProductBatch #10
  ├─ Producto: Perfume X
  ├─ Compra: #5
  ├─ Cantidad inicial: 8
  ├─ Cantidad disponible: 8
  ├─ Costo unitario: $28,000
  └─ Fecha compra: 2025-10-22

// 3. Se incrementa el stock
Producto: Perfume X
  └─ Stock: 10 → 18 unidades
```

**Consola del servidor:**
```
📦 Lote creado: Producto 1, Cantidad: 8, Costo: $28000
✅ Compra #5 procesada con 1 lotes creados
```

---

### 2️⃣ **Venta de Productos (FIFO)**

**Acción**: Vendes 5 unidades de Perfume X a $45,000 c/u

**Lo que sucede automáticamente:**

```typescript
// Sistema busca lotes disponibles ordenados por fecha (FIFO)
Lotes disponibles:
  1. Lote #2: 2 unid @ $22,000 (más antiguo)
  2. Lote #10: 8 unid @ $28,000

// Consumo FIFO:
Paso 1: Consume 2 unid del Lote #2
  ├─ Cantidad usada: 2
  ├─ Costo: 2 × $22,000 = $44,000
  └─ Lote #2: remaining_qty = 0

Paso 2: Consume 3 unid del Lote #10
  ├─ Cantidad usada: 3
  ├─ Costo: 3 × $28,000 = $84,000
  └─ Lote #10: remaining_qty = 5

// Cálculo final:
Costo total: $44,000 + $84,000 = $128,000
Costo promedio: $128,000 / 5 = $25,600 por unidad

// Ganancia:
Ingreso: 5 × $45,000 = $225,000
Costo real: $128,000
Ganancia: $97,000 ✅ (Precisa!)
```

**Consola del servidor:**
```
📦 Lote #2: Consumidas 2 unidades a $22000 = $44000
📦 Lote #10: Consumidas 3 unidades a $28000 = $84000
✅ FIFO Completado - Total: $128000, Promedio: $25600
```

---

## 🧪 Cómo Probar el Sistema

### Paso 1: Preparar Base de Datos

```bash
# En tu carpeta backend-perfumeria
cd "d:\Proyecto Milan\codigo\backend-perfumeria"

# Ejecutar el script SQL en tu BD local
psql -U postgres -d perfumeria -f migrations/add-product-batches.sql

# O desde DBeaver: copiar y ejecutar el contenido del archivo
```

### Paso 2: Compilar y Ejecutar Backend

```bash
# Cerrar el servidor si está corriendo (para liberar archivos)
# Ctrl+C en la terminal del servidor

# Generar cliente de Prisma
npx prisma generate

# Compilar
npm run build

# Ejecutar
npm run start:dev
```

### Paso 3: Probar con Compras

**API Request:**
```http
POST /api/purchase
Content-Type: application/json
Authorization: Bearer <tu-token>

{
  "supplierId": 1,
  "totalAmount": 224000,
  "paidAmount": 224000,
  "isPaid": true,
  "details": [
    {
      "productId": 1,
      "quantity": 8,
      "unitCost": 28000
    }
  ]
}
```

**Respuesta Esperada:**
```json
{
  "id": 5,
  "supplierId": 1,
  "date": "2025-10-22T...",
  "totalAmount": 224000,
  ...
}
```

**Verificar en Logs:**
```
📦 Lote creado: Producto 1, Cantidad: 8, Costo: $28000
✅ Compra #5 procesada con 1 lotes creados
```

### Paso 4: Verificar Lotes Creados

```http
GET /api/product-batches/product/1
Authorization: Bearer <tu-token>
```

**Respuesta:**
```json
{
  "batches": [
    {
      "id": 10,
      "productId": 1,
      "quantity": 8,
      "remainingQty": 8,
      "unitCost": 28000,
      "purchaseDate": "2025-10-22T...",
      "product": {
        "name": "Perfume X"
      }
    }
  ],
  "summary": {
    "totalBatches": 1,
    "totalQuantity": 8,
    "totalRemaining": 8,
    "totalValue": 224000,
    "averageCost": 28000
  }
}
```

### Paso 5: Probar Venta con FIFO

Nota: Primero necesitas actualizar el servicio de ventas (siguiente paso)

---

## 📊 Endpoints Disponibles

### 1. Ver Lotes de un Producto
```http
GET /api/product-batches/product/:id
```

**Ejemplo:**
```bash
curl -X GET http://localhost:3000/api/product-batches/product/1 \
  -H "Authorization: Bearer <token>"
```

**Respuesta:** Lista de todos los lotes del producto con stock disponible.

---

### 2. Valorización del Inventario
```http
GET /api/product-batches/valuation
```

**Ejemplo:**
```bash
curl -X GET http://localhost:3000/api/product-batches/valuation \
  -H "Authorization: Bearer <token>"
```

**Respuesta:**
```json
{
  "products": [
    {
      "product": { "id": 1, "name": "Perfume X" },
      "totalQty": 10,
      "totalValue": 268000,
      "batches": [...]
    }
  ],
  "summary": {
    "totalProducts": 15,
    "totalValue": 5420000
  }
}
```

---

### 3. Lotes Próximos a Vencer
```http
GET /api/product-batches/expiring?days=30
```

**Ejemplo:**
```bash
curl -X GET "http://localhost:3000/api/product-batches/expiring?days=15" \
  -H "Authorization: Bearer <token>"
```

---

### 4. Lotes Vencidos
```http
GET /api/product-batches/expired
```

---

## 🔍 Consultas SQL Útiles

### Ver todos los lotes de un producto

```sql
SELECT 
  pb.id AS lote_id,
  pb.quantity AS cantidad_inicial,
  pb.remaining_qty AS cantidad_disponible,
  pb.unit_cost AS costo_unitario,
  pb.purchase_date AS fecha_compra,
  (pb.remaining_qty * pb.unit_cost) AS valor_restante,
  p.name AS producto
FROM product_batches pb
JOIN "Product" p ON p.id = pb.product_id
WHERE pb.product_id = 1
ORDER BY pb.purchase_date ASC;
```

### Valorización de inventario

```sql
SELECT 
  p.id,
  p.name AS producto,
  p.stock AS stock_total,
  SUM(pb.remaining_qty) AS stock_en_lotes,
  SUM(pb.remaining_qty * pb.unit_cost) AS valor_inventario,
  ROUND(SUM(pb.remaining_qty * pb.unit_cost) / NULLIF(SUM(pb.remaining_qty), 0), 2) AS costo_promedio
FROM "Product" p
LEFT JOIN product_batches pb ON pb.product_id = p.id AND pb.remaining_qty > 0
WHERE p.is_active = true
GROUP BY p.id, p.name, p.stock
ORDER BY valor_inventario DESC;
```

### Ver historial de consumo (después de ventas)

```sql
SELECT 
  pb.id AS lote_id,
  pb.quantity AS cantidad_inicial,
  pb.remaining_qty AS cantidad_actual,
  (pb.quantity - pb.remaining_qty) AS cantidad_vendida,
  pb.unit_cost AS costo_unitario,
  ((pb.quantity - pb.remaining_qty) * pb.unit_cost) AS costo_vendido,
  p.name AS producto
FROM product_batches pb
JOIN "Product" p ON p.id = pb.product_id
WHERE pb.quantity > pb.remaining_qty
ORDER BY pb.purchase_date ASC;
```

---

## ⚠️ Siguiente Paso: Actualizar Servicio de Ventas

El servicio de compras ya crea lotes automáticamente. Ahora falta actualizar el servicio de ventas para que **consuma de los lotes usando FIFO**.

**Archivo a modificar:** `src/sale/sale.service.ts`

Te voy a crear la actualización en el siguiente paso.

---

## 💡 Beneficios del Sistema

### 1. Costo Real por Venta
```
Antes: Ganancia = Precio venta - Costo promedio (impreciso)
Ahora: Ganancia = Precio venta - Costo real FIFO (preciso)
```

### 2. Valorización Precisa
```
Sabes exactamente cuánto vale tu inventario actual
Ejemplo: $5,420,000 en stock con detalle por producto
```

### 3. Alertas de Vencimiento
```
"Tienes 5 unidades de Perfume Y que vencen en 10 días"
"Valor en riesgo: $140,000"
```

### 4. Análisis de Proveedores
```
"Proveedor A: $22,000 por unidad (más barato)"
"Proveedor B: $28,000 por unidad"
```

### 5. Trazabilidad
```
"Esta venta usó lotes #2 y #10"
"Costo real: $128,000"
"Lotes de compra #1 y #5"
```

---

## 📝 Notas Importantes

1. **Los lotes se crean automáticamente** al registrar compras
2. **No necesitas hacer nada manual** - el sistema gestiona todo
3. **FIFO es automático** - siempre vende lo más antiguo primero
4. **Stock se mantiene sincronizado** con la suma de lotes
5. **No se puede vender más de lo disponible** - validación automática

---

## 🚀 Estado Actual

✅ Modelo `ProductBatch` creado
✅ Servicio `ProductBatchService` implementado
✅ Endpoints REST creados
✅ Servicio de compras actualizado (crea lotes automáticamente)
⏳ Pendiente: Actualizar servicio de ventas para consumir lotes (FIFO)
⏳ Pendiente: Frontend para visualizar lotes

---

**¿Listo para probar?** Ejecuta los pasos anteriores y verás cómo funciona el sistema de lotes! 🎉

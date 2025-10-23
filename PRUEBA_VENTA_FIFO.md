# 🧪 PRUEBA FINAL - VENTA CON SISTEMA FIFO

## ✅ ESTADO ACTUAL DEL INVENTARIO

Actualmente tienes estos lotes en la base de datos:

- **Lote 1 (más antiguo):** 10 unidades @ $25,000 c/u = $250,000
- **Lote 2 (más reciente):** 8 unidades @ $28,000 c/u = $224,000
- **Total disponible:** 18 unidades con valor de $474,000

---

## 🧪 PRUEBA 1: VENTA DE 12 UNIDADES (Consumirá de ambos lotes)

### Payload para crear la venta:

**Endpoint:** `POST http://localhost:3000/api/sales`

**Headers:**
```json
{
  "Authorization": "Bearer TU_TOKEN_JWT",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "date": "2025-01-24T10:00:00.000Z",
  "clientId": 1,
  "totalAmount": 648000,
  "paymentMethod": "cash",
  "status": "completed",
  "details": [
    {
      "productId": 1,
      "quantity": 12,
      "unitPrice": 54000,
      "subtotal": 648000
    }
  ]
}
```

---

## 📊 ¿QUÉ DEBERÍA PASAR CON FIFO?

### Cálculo esperado:
1. **Consume 10 unidades del Lote 1** (el más antiguo) @ $25,000
   - Costo: 10 × $25,000 = $250,000
   - `remainingQty` del Lote 1 → 0 (completamente consumido)

2. **Consume 2 unidades del Lote 2** (el siguiente más antiguo) @ $28,000
   - Costo: 2 × $28,000 = $56,000
   - `remainingQty` del Lote 2 → 6 (quedan 6 unidades)

3. **Costo total real de la venta:** $250,000 + $56,000 = **$306,000**
4. **Costo promedio por unidad:** $306,000 / 12 = **$25,500**

### Beneficio de la venta:
- **Ingreso:** 12 × $54,000 = $648,000
- **Costo real (FIFO):** $306,000
- **Ganancia:** $648,000 - $306,000 = **$342,000**
- **Margen de ganancia:** 52.8%

---

## 📝 LOGS ESPERADOS EN EL BACKEND

Cuando hagas la venta, deberías ver en la consola del backend:

```
💰 FIFO - Consumiendo lotes para Producto 1 (12 unidades)
   Lote 1: Consumió 10 unidades @ $25,000 c/u
   Lote 2: Consumió 2 unidades @ $28,000 c/u
   ✅ Costo total: $306,000 | Costo promedio: $25,500
```

---

## ✅ VERIFICACIONES POST-VENTA

### 1. Verificar los lotes actualizados

**GET** `http://localhost:3000/api/product-batches/product/1`

**Respuesta esperada:**
```json
{
  "batches": [
    {
      "id": 1,
      "productId": 1,
      "quantity": 10,
      "remainingQty": 0,          // ← CONSUMIDO COMPLETAMENTE
      "unitCost": 25000,
      "purchaseDate": "..."
    },
    {
      "id": 2,
      "productId": 1,
      "quantity": 8,
      "remainingQty": 6,          // ← QUEDAN 6 UNIDADES
      "unitCost": 28000,
      "purchaseDate": "..."
    }
  ],
  "summary": {
    "totalBatches": 2,
    "totalQuantity": 18,
    "totalRemaining": 6,          // ← STOCK ACTUAL: 6 unidades
    "totalValue": 168000,         // ← 6 × $28,000
    "averageCost": 28000          // ← Costo promedio del inventario restante
  }
}
```

### 2. Verificar en DBeaver

```sql
-- Ver estado de los lotes
SELECT 
    id,
    product_id,
    quantity AS "Cantidad Inicial",
    remaining_qty AS "Stock Actual",
    unit_cost AS "Costo Unitario",
    (quantity - remaining_qty) AS "Unidades Consumidas"
FROM product_batches 
WHERE product_id = 1;
```

**Resultado esperado:**
```
id | product_id | Cantidad Inicial | Stock Actual | Costo Unitario | Unidades Consumidas
1  | 1          | 10               | 0            | 25000          | 10
2  | 1          | 8                | 6            | 28000          | 2
```

---

## 🧪 PRUEBA 2: SEGUNDA VENTA DE 4 UNIDADES (Solo del Lote 2)

### Payload:

```json
{
  "date": "2025-01-25T10:00:00.000Z",
  "clientId": 1,
  "totalAmount": 216000,
  "paymentMethod": "cash",
  "status": "completed",
  "details": [
    {
      "productId": 1,
      "quantity": 4,
      "unitPrice": 54000,
      "subtotal": 216000
    }
  ]
}
```

### Cálculo esperado:
- **Consume 4 unidades del Lote 2** @ $28,000
- **Costo total:** 4 × $28,000 = $112,000
- **Costo promedio:** $28,000 por unidad
- **Ganancia:** $216,000 - $112,000 = $104,000

### Estado final:
- **Lote 1:** `remainingQty = 0` (ya estaba agotado)
- **Lote 2:** `remainingQty = 2` (quedan 2 unidades)
- **Stock total:** 2 unidades

---

## 🧪 PRUEBA 3: TERCERA VENTA DE 2 UNIDADES (Agota el inventario)

### Payload:

```json
{
  "date": "2025-01-26T10:00:00.000Z",
  "clientId": 1,
  "totalAmount": 108000,
  "paymentMethod": "cash",
  "status": "completed",
  "details": [
    {
      "productId": 1,
      "quantity": 2,
      "unitPrice": 54000,
      "subtotal": 108000
    }
  ]
}
```

### Cálculo esperado:
- **Consume 2 unidades del Lote 2** @ $28,000
- **Costo total:** 2 × $28,000 = $56,000
- **Ganancia:** $108,000 - $56,000 = $52,000

### Estado final:
- **Lote 1:** `remainingQty = 0`
- **Lote 2:** `remainingQty = 0`
- **Stock total:** 0 unidades (inventario agotado)

---

## 📊 RESUMEN DE TODAS LAS VENTAS

| Venta | Unidades | Lotes Consumidos | Costo Real | Ingreso | Ganancia | Margen |
|-------|----------|------------------|------------|---------|----------|--------|
| 1     | 12       | Lote 1 (10) + Lote 2 (2) | $306,000 | $648,000 | $342,000 | 52.8% |
| 2     | 4        | Lote 2 (4) | $112,000 | $216,000 | $104,000 | 48.1% |
| 3     | 2        | Lote 2 (2) | $56,000 | $108,000 | $52,000 | 48.1% |
| **TOTAL** | **18** | - | **$474,000** | **$972,000** | **$498,000** | **51.2%** |

---

## ❌ PRUEBA DE ERROR: INTENTAR VENDER MÁS STOCK DEL DISPONIBLE

### Payload (intenta vender 20 unidades cuando solo hay 18):

```json
{
  "date": "2025-01-24T10:00:00.000Z",
  "clientId": 1,
  "totalAmount": 1080000,
  "paymentMethod": "cash",
  "status": "completed",
  "details": [
    {
      "productId": 1,
      "quantity": 20,
      "unitPrice": 54000,
      "subtotal": 1080000
    }
  ]
}
```

### Error esperado:

```json
{
  "statusCode": 400,
  "message": "Stock insuficiente para el producto Miss Dior. Disponible: 18, Solicitado: 20",
  "error": "Bad Request"
}
```

---

## 🎯 PUNTOS CLAVE A VERIFICAR

1. ✅ **El sistema consume del lote más antiguo primero** (FIFO)
2. ✅ **Calcula el costo real** basado en los lotes consumidos
3. ✅ **Actualiza el `remainingQty`** de cada lote correctamente
4. ✅ **Valida que haya stock suficiente** antes de crear la venta
5. ✅ **Los logs muestran** qué lotes se consumieron y cuánto costaron

---

## 🚀 ¡COMIENZA LA PRUEBA!

1. **Ejecuta la primera venta** de 12 unidades
2. **Verifica en los logs** que se consumieron los lotes correctamente
3. **Consulta el endpoint** GET `/api/product-batches/product/1` para ver el estado
4. **Continúa con las siguientes ventas** para probar el flujo completo

¡Avísame los resultados! 🎉

# 🧪 GUÍA DE PRUEBA - SISTEMA DE LOTES FIFO

## ✅ ESTADO ACTUAL
- ✅ Tabla `product_batches` creada en BD
- ✅ Prisma client generado
- ✅ Backend compilado sin errores
- ✅ Servidor corriendo en http://localhost:3000/api
- ✅ Endpoints de lotes registrados correctamente:
  - `/api/product-batches/product/:id` - Ver lotes de un producto
  - `/api/product-batches/valuation` - Valorización total
  - `/api/product-batches/expiring` - Lotes próximos a vencer
  - `/api/product-batches/expired` - Lotes ya vencidos

---

## 🧪 PRUEBA 1: CREAR COMPRA Y VERIFICAR LOTE AUTOMÁTICO

### Paso 1: Crear una compra
Usa Postman/Thunder Client/Insomnia para hacer esta petición:

**Endpoint:** `POST http://localhost:3000/api/purchases`

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
  "supplierId": 1,
  "purchaseDate": "2025-01-22",
  "status": "completed",
  "paymentMethod": "cash",
  "isPaid": true,
  "paidAmount": 250000,
  "details": [
    {
      "productId": 1,
      "quantity": 10,
      "unitCost": 25000,
      "subtotal": 250000
    }
  ],
  "totalAmount": 250000
}
```

### Paso 2: Ver los logs del backend
En la consola del backend (donde está corriendo `npm run start:dev`) deberías ver:

```
📦 Lote creado: Producto 1, Cantidad: 10, Costo: $25000
✅ Compra #X procesada con 1 lotes creados
```

### Paso 3: Verificar el lote en la base de datos

**Opción A - Usando DBeaver:**
```sql
SELECT * FROM product_batches WHERE product_id = 1;
```

Deberías ver algo como:
```
id | product_id | purchase_id | quantity | remaining_qty | unit_cost | purchase_date | expiry_date | batch_number
1  | 1          | 1           | 10       | 10            | 25000     | 2025-01-22    | NULL        | NULL
```

**Opción B - Usando el endpoint:**
```
GET http://localhost:3000/api/product-batches/product/1
```

**Respuesta esperada:**
```json
{
  "batches": [
    {
      "id": 1,
      "productId": 1,
      "purchaseId": 1,
      "quantity": 10,
      "remainingQty": 10,
      "unitCost": 25000,
      "purchaseDate": "2025-01-22T00:00:00.000Z",
      "expiryDate": null,
      "batchNumber": null,
      "product": {
        "id": 1,
        "name": "Nombre del Producto",
        "sku": "SKU123"
      }
    }
  ],
  "summary": {
    "totalBatches": 1,
    "totalQuantity": 10,
    "totalRemaining": 10,
    "totalValue": 250000,
    "averageCost": 25000
  }
}
```

---

## 🧪 PRUEBA 2: CREAR SEGUNDA COMPRA CON PRECIO DIFERENTE

### Paso 1: Crear otra compra del mismo producto pero con diferente precio
```json
{
  "supplierId": 1,
  "purchaseDate": "2025-01-23",
  "status": "completed",
  "paymentMethod": "cash",
  "isPaid": true,
  "paidAmount": 224000,
  "details": [
    {
      "productId": 1,
      "quantity": 8,
      "unitCost": 28000,
      "subtotal": 224000
    }
  ],
  "totalAmount": 224000
}
```

### Paso 2: Verificar que ahora hay 2 lotes

**GET** `http://localhost:3000/api/product-batches/product/1`

**Respuesta esperada:**
```json
{
  "batches": [
    {
      "id": 1,
      "productId": 1,
      "quantity": 10,
      "remainingQty": 10,
      "unitCost": 25000,
      "purchaseDate": "2025-01-22T00:00:00.000Z"
    },
    {
      "id": 2,
      "productId": 1,
      "quantity": 8,
      "remainingQty": 8,
      "unitCost": 28000,
      "purchaseDate": "2025-01-23T00:00:00.000Z"
    }
  ],
  "summary": {
    "totalBatches": 2,
    "totalQuantity": 18,
    "totalRemaining": 18,
    "totalValue": 474000,
    "averageCost": 26333.33
  }
}
```

**Explicación del summary:**
- `totalBatches: 2` → Tienes 2 compras diferentes
- `totalQuantity: 18` → Total comprado (10 + 8)
- `totalRemaining: 18` → Stock disponible total
- `totalValue: 474000` → Valor del inventario (10×25000 + 8×28000)
- `averageCost: 26333.33` → Costo promedio ponderado (474000 / 18)

---

## 🧪 PRUEBA 3: VERIFICAR VALORIZACIÓN TOTAL DEL INVENTARIO

**GET** `http://localhost:3000/api/product-batches/valuation`

**Respuesta esperada:**
```json
[
  {
    "productId": 1,
    "productName": "Nombre del Producto",
    "productSku": "SKU123",
    "totalQuantity": 18,
    "totalValue": 474000,
    "averageCost": 26333.33
  },
  {
    "productId": 2,
    "productName": "Otro Producto",
    "productSku": "SKU456",
    "totalQuantity": 5,
    "totalValue": 150000,
    "averageCost": 30000
  }
]
```

---

## ❌ SOLUCIÓN DE PROBLEMAS

### Si no aparecen los lotes creados:
1. Verifica que el servidor esté corriendo
2. Revisa los logs del backend para ver los mensajes de "📦 Lote creado"
3. Verifica en DBeaver que la tabla `product_batches` tenga registros
4. Asegúrate de que el `productId` en la compra exista en la tabla `products`

### Si el endpoint devuelve 401 Unauthorized:
1. Asegúrate de estar enviando el token JWT en el header `Authorization: Bearer TU_TOKEN`
2. Verifica que el token no haya expirado
3. Haz login nuevamente: `POST http://localhost:3000/api/auth/login`

### Si el endpoint devuelve 404 Not Found:
1. Verifica que estés usando la URL correcta: `http://localhost:3000/api/product-batches/...`
2. Asegúrate de que el servidor esté corriendo en el puerto 3000
3. Comprueba que el módulo ProductBatch esté cargado en los logs

---

## 📊 PRÓXIMOS PASOS

Una vez que confirmes que los lotes se crean correctamente, el siguiente paso es:

1. **Actualizar el servicio de ventas** para que consuma los lotes usando FIFO
2. **Probar el flujo completo**: Compra → Stock → Venta → Descontar lote más antiguo primero
3. **Ver el costo real** de cada venta basado en el lote consumido

---

## 💡 EJEMPLO COMPLETO DEL FLUJO FIFO

**Escenario:**
1. Compro 10 unidades del Perfume X a $25,000 c/u → Lote 1
2. Compro 8 unidades del Perfume X a $28,000 c/u → Lote 2
3. Vendo 12 unidades del Perfume X

**¿Qué debería pasar?**
- El sistema debe consumir **10 unidades del Lote 1** (el más antiguo) a $25,000
- Luego consumir **2 unidades del Lote 2** a $28,000
- Costo total de la venta: (10 × $25,000) + (2 × $28,000) = $306,000
- Costo promedio por unidad vendida: $306,000 / 12 = $25,500

**Estado final de los lotes:**
- Lote 1: `remainingQty = 0` (consumido completamente)
- Lote 2: `remainingQty = 6` (quedan 6 unidades)

---

¡Prueba el sistema y cuéntame cómo te fue! 🚀

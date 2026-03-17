# FIX: Pagos Múltiples No Se Contaban en Cierre de Caja

## Problema Reportado

Cuando se realizaba una venta con **pago múltiple** (por ejemplo: $50,000 en efectivo + $30,000 en transferencia), estos montos NO se estaban contando en el cierre de caja. Esto causaba que:

- El efectivo no se sumaba correctamente
- Las transferencias no se sumaban correctamente  
- El cierre de caja no cuadraba (tenía diferencias)

## Causa Raíz

El servicio de cierre de caja (`cash-closing.service.ts`) estaba consultando solo el campo `paymentMethod` de la tabla `Sale`, pero cuando hay pagos múltiples:

1. El campo `sale.paymentMethod` podría estar NULL o tener un valor genérico
2. Los pagos individuales están guardados en la tabla `SalePayment` (uno por cada método)
3. El código NO estaba consultando la tabla `SalePayment`

### Ejemplo del Problema

**Venta con pago múltiple:**
- Sale.id = 123
- Sale.totalAmount = $80,000
- Sale.paymentMethod = NULL o "Multiple"
- SalePayment[0] = { method: "Efectivo", amount: $50,000 }
- SalePayment[1] = { method: "Transferencia", amount: $30,000 }

**Código anterior (INCORRECTO):**
```typescript
const cashSales = sales
  .filter((s) => s.paymentMethod === 'Efectivo' && s.isPaid)
  .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
// Resultado: $0 porque sale.paymentMethod !== 'Efectivo'
```

## Solución Implementada

Se modificó el servicio de cierre de caja para:

1. **Incluir la relación con `payments`** al consultar ventas:
   ```typescript
   const sales = await this.prisma.sale.findMany({
     where: { date: { gte: startOfDay, lte: endOfDay }, isPaid: true },
     include: { payments: true }, // ← NUEVO
   });
   ```

2. **Sumar montos por método usando `SalePayment`**:
   ```typescript
   sales.forEach(sale => {
     if (sale.payments && sale.payments.length > 0) {
       // Usar tabla de pagos múltiples
       sale.payments.forEach(payment => {
         const amount = payment.amount || 0;
         const method = payment.method?.toLowerCase() || '';
         
         if (method.includes('efectivo')) {
           cashSales += amount;
         } else if (method.includes('tarjeta')) {
           cardSales += amount;
         } else if (method.includes('transferencia')) {
           transferSales += amount;
         }
       });
     } else {
       // Compatibilidad hacia atrás: usar método único
       // (para ventas antiguas que tienen solo sale.paymentMethod)
     }
   });
   ```

3. **Aplicado en ambos métodos**:
   - `create()` - Crear nuevo cierre de caja
   - `getSummary()` - Obtener resumen del día

## Archivos Modificados

- ✅ `backend-perfumeria/src/cash-closing/cash-closing.service.ts`
  - Método `create()` (líneas ~45-115)
  - Método `getSummary()` (líneas ~260-330)

## Pruebas

### Script de Prueba
Ejecutar para verificar el cálculo:
```bash
cd backend-perfumeria
node test-multi-payment-closing.js
```

Este script:
- Busca ventas con pagos múltiples
- Muestra el desglose de pagos
- Simula el cálculo de cierre de caja
- Verifica que los totales cuadren

### Prueba Manual

1. **Crear una venta con pago múltiple en el POS:**
   - Agregar productos por $100,000
   - Usar botón "Pago Múltiple"
   - Pagar: $60,000 Efectivo + $40,000 Transferencia
   - Completar venta

2. **Hacer cierre de caja:**
   - Ir a módulo "Cierre de Caja"
   - Hacer cierre del día
   - Verificar que aparezca:
     - Efectivo: $60,000
     - Transferencia: $40,000
     - Total: $100,000

## Compatibilidad

✅ **Totalmente compatible hacia atrás**
   - Ventas antiguas (con solo `sale.paymentMethod`) siguen funcionando
   - Ventas nuevas (con `payments[]`) ahora se cuentan correctamente
   - No se requiere migración de datos

## Deployment

### Desarrollo Local
```bash
cd backend-perfumeria
npm run build
npm run start:dev
```

### Producción (Railway)
```bash
git add .
git commit -m "fix: contar pagos múltiples en cierre de caja"
git push origin main
```

Railway desplegará automáticamente el fix.

## Verificación Post-Deployment

1. Crear una venta de prueba con pago múltiple
2. Hacer cierre de caja del día
3. Verificar que los montos por método son correctos
4. Verificar que el total del sistema cuadra

## Notas Técnicas

### Modelo de Datos
```prisma
model Sale {
  id            Int           @id
  totalAmount   Float
  paymentMethod String?       // Solo para compatibilidad
  payments      SalePayment[] // ← Relación con pagos múltiples
}

model SalePayment {
  id     Int    @id
  saleId Int
  amount Float
  method String
  sale   Sale   @relation(fields: [saleId], references: [id])
}
```

### Flujo de Creación de Venta
1. Frontend: Usuario selecciona "Pago Múltiple"
2. Modal: Ingresa $X efectivo + $Y transferencia
3. Backend: Crea venta con `ispaid=true`
4. Backend: Crea registros en `SalePayment` (uno por método)
5. Cierre de Caja: Lee `SalePayment` y suma por método ✅

## Resultado Esperado

✅ Los pagos múltiples ahora se cuentan correctamente en el cierre de caja
✅ El efectivo de pagos múltiples aparece en la sección de efectivo
✅ Las transferencias de pagos múltiples aparecen en la sección de transferencias
✅ El total del sistema cuadra correctamente
✅ No hay diferencias inesperadas en el cierre

## Fecha
**Implementado:** $(Get-Date -Format "yyyy-MM-dd HH:mm")
**Versión:** Backend v1.0.0
**Ámbito:** Módulo de Cierre de Caja

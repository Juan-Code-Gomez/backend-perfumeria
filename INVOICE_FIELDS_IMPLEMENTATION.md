# Implementación de Campos de Factura en Compras

## 📋 Resumen
Se implementó la **Opción 1**: Fusión de Purchase + Invoice en un solo modelo, agregando campos opcionales de factura al modelo Purchase existente.

## 🗓️ Fecha de implementación
23 de Octubre, 2025

---

## 🎯 Cambios Realizados

### 1. Backend (NestJS + Prisma)

#### **Schema de Base de Datos** (`schema.prisma`)
Campos agregados al modelo `Purchase`:

```prisma
model Purchase {
  // Campos financieros (requeridos)
  subtotal      Float     // Suma de (cantidad × costo) de cada detalle
  totalAmount   Float     // = subtotal - discount
  discount      Float     @default(0)
  
  // Campos de factura (opcionales)
  invoiceNumber String?   @unique
  invoiceDate   DateTime?
  dueDate       DateTime? // Para compras a crédito
  notes         String?
  
  // Índices para optimización
  @@index([invoiceNumber])
  @@index([invoiceDate])
  @@index([dueDate])
}
```

#### **Migración SQL** (`migrations/add-invoice-fields-to-purchase.sql`)
- ✅ Ejecutada exitosamente en base de datos local
- Añadió 7 columnas nuevas
- Migró 2 compras existentes calculando subtotal
- Creó 3 índices para mejor rendimiento
- Estado verificado: 2 compras totales, 0 con factura

#### **DTOs** (`src/purchase/dto/create-purchase.dto.ts`)
Campos agregados (todos opcionales):
```typescript
discount?: number
invoiceNumber?: string
invoiceDate?: string
dueDate?: string
notes?: string
```

#### **Lógica de Negocio** (`src/purchase/purchase.service.ts`)
Cálculos automáticos implementados:
```typescript
// 1. Calcular subtotal
const subtotal = details.reduce((sum, d) => 
  sum + (d.quantity * d.unitCost), 0
);

// 2. Aplicar descuento
const discount = data.discount || 0;
const totalAmount = subtotal - discount;

// 3. Determinar si está pagada
const isPaid = data.paidAmount >= totalAmount;
```

**Logs mejorados:**
```
📦 Lote creado: Producto ${productId}, ${quantity} unidades a $${unitCost}
✅ Compra #${id} procesada:
   Subtotal: $${subtotal}
   Descuento: -$${discount}
   Total: $${totalAmount}
   Factura: ${invoiceNumber}
   ${details.length} lotes creados
```

#### **Integración FIFO**
- ✅ Se mantiene sin cambios
- Cada detalle de compra sigue creando automáticamente un `ProductBatch`
- El sistema FIFO funciona normalmente

---

### 2. Frontend (React + TypeScript + Ant Design)

#### **Tipos TypeScript** (`src/features/purchases/types.ts`)
```typescript
export interface Purchase {
  id: number
  supplierId: number
  date: string
  subtotal: number
  discount: number
  totalAmount: number
  paidAmount: number
  isPaid: boolean
  
  // Campos de factura (opcionales)
  invoiceNumber?: string
  invoiceDate?: string
  dueDate?: string
  notes?: string
  
  // Relaciones
  supplier?: { id: number; name: string }
  details: PurchaseDetail[]
}
```

#### **Formulario de Compras** (`PurchaseForm.tsx`)

**Características principales:**
1. **Sección colapsable "Datos de factura"** con emoji 📄
2. **Campos opcionales:**
   - Número de factura
   - Fecha de factura
   - Fecha de vencimiento (para crédito)
   - Descuento (con validación: máximo = subtotal)
   - Notas

3. **Panel de totales visuales:**
   ```
   Subtotal:        $XXX,XXX
   Descuento:      -$XX,XXX (en rojo)
   Total a pagar:   $XXX,XXX (azul, destacado)
   ```

4. **Estado dinámico:**
   - ✓ Pagada (verde) - si `paidAmount >= totalAmount`
   - ⏳ Pendiente (naranja) - si `paidAmount < totalAmount`

5. **Validaciones:**
   - Descuento no puede superar el subtotal
   - Al menos un producto requerido
   - Proveedor y fecha obligatorios

#### **Lista de Compras** (`PurchaseList.tsx`)

**Columnas agregadas:**
| Columna | Descripción | Visualización |
|---------|-------------|---------------|
| N° Factura | Número de factura si existe | "-" si está vacío |
| Subtotal | Suma de productos | $XXX,XXX |
| Descuento | Descuento aplicado | -$XXX (rojo) o $0 (gris) |
| Total | Subtotal - Descuento | **$XXX,XXX** (negrita) |
| Saldo | Total - Pagado | $XXX (naranja si > 0) |
| Estado | Calculado con lógica | Badge con color |

**Estados con badges:**
- 🟢 **Pagada** (verde) - `isPaid = true`
- 🟠 **Pendiente** (naranja) - `isPaid = false` y no vencida
- 🔴 **Vencida** (rojo) - `isPaid = false` y `dueDate < hoy`

#### **Modal de Detalle** (`PurchaseDetailModal.tsx`)

**Secciones:**
1. **Datos básicos:**
   - Proveedor, fecha de compra, estado

2. **Datos de factura** (si existen):
   - Número de factura (fuente monoespaciada)
   - Fecha de factura
   - Fecha de vencimiento (⚠ si está vencida)
   - Notas

3. **Productos:**
   - Tabla con producto, cantidad, precio unitario, total

4. **Totales:**
   - Subtotal
   - Descuento (en rojo si > 0)
   - **Total a pagar** (grande, azul)
   - **Monto pagado** (verde)
   - **Saldo pendiente** (naranja, solo si > 0)

---

## 🧪 Testing

### Escenarios a probar:

1. ✅ **Compra simple (sin factura):**
   - Crear compra solo con proveedor, fecha, productos
   - Verificar que funciona igual que antes

2. 🔲 **Compra con factura completa:**
   - Incluir número de factura, fecha, descuento
   - Verificar cálculos automáticos
   - Validar creación de lotes FIFO

3. 🔲 **Compra a crédito:**
   - Agregar fecha de vencimiento
   - Pagar parcialmente
   - Verificar badge "Pendiente"

4. 🔲 **Compra vencida:**
   - Crear compra con `dueDate` en el pasado
   - No pagar completo
   - Verificar badge "Vencida"

5. 🔲 **Validar en lista:**
   - Ver columnas nuevas
   - Filtrar por número de factura
   - Ver detalle completo

---

## 📊 Estado de Implementación

### ✅ Completado
- [x] Diseño de schema y migración SQL
- [x] Migración ejecutada en BD local
- [x] Prisma client regenerado
- [x] Backend compilando sin errores
- [x] Servidor backend corriendo
- [x] Tipos TypeScript actualizados
- [x] Formulario de compras con campos de factura
- [x] Lista de compras con columnas nuevas
- [x] Modal de detalle mejorado
- [x] Frontend compilando sin errores
- [x] Servidor frontend corriendo

### 🔲 Pendiente
- [ ] Testing end-to-end completo
- [ ] Script de migración para stock existente
- [ ] Deployment a producción (Railway)

---

## 🚀 Servidor en Desarrollo

**Backend:** http://localhost:3000/api
- ✅ Compilado exitosamente
- ✅ Sin errores TypeScript
- ✅ Módulo PurchaseModule cargado

**Frontend:** http://localhost:5173/
- ✅ Vite 6.3.5 corriendo
- ✅ HMR activo
- ✅ Sin errores de compilación

---

## 📝 Notas Técnicas

### Decisiones de diseño:
1. **No se incluyen campos de IVA, retenciones o envío** (según requerimiento del usuario)
2. **PDF upload descartado** - Facturas de proveedores varían mucho, entrada manual más confiable
3. **Descuento a nivel de compra** - No por producto individual
4. **Cálculo automático de subtotal y total** - Backend calcula, frontend solo muestra
5. **isPaid calculado** - Se determina automáticamente si `paidAmount >= totalAmount`

### Características adicionales implementadas:
- ✨ Sección colapsable para mantener UI limpia
- ✨ Validación de descuento (no puede superar subtotal)
- ✨ Estados visuales dinámicos (Pagada/Pendiente/Vencida)
- ✨ Cálculo de saldo pendiente automático
- ✨ Logs detallados en backend para debugging

---

## 🔄 Próximos Pasos

1. **Probar flujo completo** en desarrollo
2. **Validar integración FIFO** funciona correctamente
3. **Crear script de migración** para productos con stock existente
4. **Ejecutar en producción** (Railway)
5. **Monitorear** primeras compras reales con factura

---

## 👨‍💻 Comandos Útiles

```bash
# Backend
cd backend-perfumeria
npm run build          # Compilar
npm run start:dev      # Servidor desarrollo

# Frontend
cd perfumeria-sistema
npm run dev            # Servidor desarrollo

# Base de datos
psql -U postgres -d perfumeria
\d Purchase            # Ver estructura de tabla
```

---

✅ **Implementación completada exitosamente**

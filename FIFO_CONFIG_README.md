# Configuración FIFO/No-FIFO en Inventario

## 📋 Resumen

Se ha implementado un parámetro configurable que permite activar o desactivar el modelo FIFO (First In, First Out) para el manejo de inventario y precios de productos.

## 🎯 Problema Resuelto

**Problema reportado:** Los precios de los productos no se actualizan cuando llegan facturas con precios diferentes (más caros o más baratos).

**Causa:** El sistema usaba exclusivamente el modelo FIFO con lotes, donde cada compra crea un lote con su propio costo, pero el campo `purchasePrice` del producto nunca se actualizaba.

## ✨ Solución Implementada

### 1. Nuevo Parámetro de Configuración

Se agregó el campo `useFifoInventory` a la configuración de la empresa:

- **Ubicación:** Configuración del Sistema → Configuración de Inventario
- **Valor por defecto:** `true` (mantiene comportamiento actual)
- **Accesible desde:** Panel de administración, pestaña "Sistema"

### 2. Dos Modos de Operación

#### Modo FIFO (useFifoInventory = true) - **PREDETERMINADO**

✅ **Comportamiento:**
- Se crean lotes para cada compra
- El costo se calcula usando el lote más antiguo (FIFO)
- Ideal para negocios con productos perecederos o que requieren trazabilidad
- El `purchasePrice` del producto NO se actualiza

📦 **Ejemplo:**
```
Compra 1: 10 unidades a $5.000
Compra 2: 10 unidades a $6.000

Venta de 5 unidades:
- Costo usado: $5.000 (del lote más antiguo)
- Quedan 5 unidades del lote 1 y 10 del lote 2
```

#### Modo Precio Último (useFifoInventory = false)

✅ **Comportamiento:**
- NO se crean lotes de inventario
- El `purchasePrice` del producto se actualiza con cada factura
- Se registra historial de cambios de precios en tabla `ProductPrice`
- Más simple y directo para negocios con alta rotación

💰 **Ejemplo:**
```
Compra 1: 10 unidades a $5.000
- purchasePrice: $5.000

Compra 2: 10 unidades a $6.000
- purchasePrice: $6.000 ← ACTUALIZADO

Stock total: 20 unidades
Precio de compra actual: $6.000
```

## 🔧 Archivos Modificados

### Backend

1. **prisma/schema.prisma**
   - Agregado campo `useFifoInventory` a modelo `CompanyConfig`

2. **src/purchase/purchase.service.ts**
   - Modificado método `create()` para verificar configuración
   - Implementada lógica condicional:
     - Si FIFO = true: Crea lotes (comportamiento original)
     - Si FIFO = false: Actualiza precios y registra historial

### Frontend

3. **src/features/company-config/companyConfigSlice.ts**
   - Agregado campo `useFifoInventory` a interfaces

4. **src/pages/company-config/CompanyConfig.tsx**
   - Agregada sección "Configuración de Inventario"
   - Switch para activar/desactivar FIFO
   - Tooltips explicativos

### Migración

5. **add-fifo-config.sql**
   - Script SQL para agregar el campo a la base de datos

6. **apply-fifo-config-migration.js**
   - Script Node.js para aplicar la migración

## 📦 Instalación y Migración

### Opción 1: Desarrollo Local

```bash
cd backend-perfumeria
node apply-fifo-config-migration.js
```

### Opción 2: Producción (Railway)

```bash
# En Railway CLI o terminal de producción
psql $DATABASE_URL -f add-fifo-config.sql
```

### Opción 3: Prisma Migrate (Recomendado)

```bash
cd backend-perfumeria
npx prisma migrate dev --name add-fifo-config
npx prisma generate
```

## 🎮 Uso del Sistema

### 1. Activar/Desactivar FIFO

1. Ir a **Configuración** en el menú lateral
2. Pestaña **Sistema**
3. Sección **Configuración de Inventario**
4. Activar/desactivar el switch "Usar Modelo FIFO"
5. Guardar cambios

### 2. Comportamiento al Registrar Facturas

**Con FIFO activado:**
```
📦 Lote FIFO creado: Producto 123, Cantidad: 50, Costo: $5.500
✅ Compra #456 procesada (Modo: FIFO)
```

**Con FIFO desactivado:**
```
💰 Precio actualizado: Perfume Dior Sauvage | 
    Antes: $85.000 | Ahora: $82.000 | 
    Cambio: -$3.000 (-3.5%)
✅ Compra #456 procesada (Modo: Precio Último)
```

## 🎯 Recomendaciones de Uso

### Usar FIFO cuando:
- ✅ Productos con fecha de vencimiento
- ✅ Necesitas trazabilidad por lote
- ✅ Precios varían significativamente entre compras
- ✅ Reportes de utilidad deben ser precisos por lote

### Usar Precio Último cuando:
- ✅ Alta rotación de inventario
- ✅ Precios relativamente estables
- ✅ No necesitas control por lote
- ✅ Simplicidad sobre precisión absoluta

## ⚠️ Consideraciones Importantes

1. **Cambiar de modo no afecta datos existentes**
   - Los lotes ya creados permanecen en la BD
   - Los precios ya actualizados no se revierten

2. **Historial de precios**
   - En modo "Precio Último", se guarda historial en tabla `ProductPrice`
   - Útil para auditorías y análisis de tendencias

3. **Costos de venta**
   - Modo FIFO: Usa costo del lote consumido
   - Modo Precio Último: Usa `purchasePrice` actual del producto

4. **Migración desde FIFO a No-FIFO**
   - Los lotes existentes no se eliminan
   - Las nuevas compras actualizarán precios
   - Puedes volver a activar FIFO en cualquier momento

## 📊 Logging y Monitoreo

El sistema registra información detallada en consola:

```
✅ Compra #123 procesada (Modo: Precio Último):
   Subtotal: $250,000
   Total: $250,000
   Factura: F-2024-001
   3 productos procesados

💰 Precio actualizado: Perfume A | Antes: $50,000 | Ahora: $48,000 | Cambio: -$2,000 (-4.0%)
💰 Precio actualizado: Perfume B | Antes: $35,000 | Ahora: $37,500 | Cambio: +$2,500 (+7.1%)
💰 Precio actualizado: Perfume C | Antes: $45,000 | Ahora: $45,000 | Cambio: $0 (0.0%)
```

## 🐛 Troubleshooting

### El switch no aparece en Configuración
- Verificar que se aplicó la migración SQL
- Regenerar el cliente Prisma: `npx prisma generate`
- Recargar el frontend

### Los precios no se actualizan
- Verificar que `useFifoInventory` está en `false`
- Revisar logs del backend al crear compra
- Verificar permisos de la tabla `ProductPrice`

### Error al aplicar migración
```bash
# Si el campo ya existe
ERROR: column "useFifoInventory" of relation "company_config" already exists
```
**Solución:** El campo ya fue agregado, todo está bien.

## 📚 Referencias

- **Modelo FIFO:** Primera entrada, primera salida. Control por lotes.
- **Precio Último:** Actualización directa del precio de compra.
- **Tabla ProductPrice:** Historial de cambios de precios con fecha y proveedor.

---

**Fecha de implementación:** 2026-03-03  
**Versión:** 1.0.0

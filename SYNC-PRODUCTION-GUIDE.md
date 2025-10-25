# 🔄 GUÍA DE SINCRONIZACIÓN SEGURA - PRODUCCIÓN

## 📋 Resumen

Este script sincroniza **TODA** la base de datos de producción con tu schema local actual, sin perder ningún dato.

### ✅ Lo que HACE:
- Crea tablas faltantes (InvoiceItem, InvoicePayment, system_parameters, etc.)
- Agrega columnas faltantes a tablas existentes
- Crea índices para optimizar rendimiento
- Agrega valores al enum ExpenseCategory (SUPPLIER_PAYMENT)
- Establece foreign keys faltantes

### ❌ Lo que NO HACE:
- NO borra tablas existentes
- NO elimina datos
- NO modifica datos existentes
- NO elimina columnas

## 🎯 Cambios Detectados por Prisma

Prisma detectó las siguientes diferencias entre local y producción:

### Tablas Nuevas (7):
1. `InvoiceItem` - Ítems de facturas
2. `InvoicePayment` - Pagos de facturas  
3. `company_config` - Configuración de empresa
4. `module_permissions` - Permisos por módulo
5. `product_batches` - Sistema FIFO de inventario
6. `system_modules` - Módulos del sistema
7. `system_parameters` - Parámetros del sistema

### Tablas Modificadas:
- **User**: + companyCode
- **Supplier**: nit ahora nullable
- **Purchase**: + subtotal, discount, invoiceNumber, invoiceDate, dueDate, notes
- **Invoice**: + hasInventoryImpact, inventoryProcessed, isHistorical, needsReconciliation, notes, originalDocument, pricesAnalyzed, supplierId

### Enums Actualizados:
- **ExpenseCategory**: + SUPPLIER_PAYMENT

## 🚀 Métodos de Ejecución

### Opción 1: Script Automático Node.js (Recomendado)

```powershell
cd backend-perfumeria
node execute-sync-production.js
```

**Ventajas:**
- ✅ Interactivo (pide confirmación)
- ✅ Regenera Prisma Client automáticamente
- ✅ Muestra errores claros

### Opción 2: pgAdmin (Visual)

1. Abrir **pgAdmin**
2. Conectar a la base de datos de **producción**
3. Click derecho en la BD → **Query Tool**
4. **File → Open** → Seleccionar `sync-production-safe.sql`
5. **Ejecutar** (F5 o botón ▶️)
6. Verificar que aparezca "SINCRONIZACIÓN COMPLETADA EXITOSAMENTE ✓"

### Opción 3: psql desde Terminal

```powershell
# Opción A: Si tienes psql en el PATH
psql -U tu_usuario -d tu_base_datos -h tu_servidor -f sync-production-safe.sql

# Opción B: Usando la DATABASE_URL completa
psql "postgresql://usuario:password@host:port/database" -f sync-production-safe.sql
```

### Opción 4: DBeaver

1. Abrir **DBeaver**
2. Conectar a producción
3. **SQL Editor → Open SQL Script**
4. Seleccionar `sync-production-safe.sql`
5. **Execute SQL Script** (Ctrl+Enter)

## 📊 Verificaciones Automáticas

El script incluye verificaciones al final que muestran:

1. **Tablas creadas:**
   ```sql
   InvoiceItem
   InvoicePayment
   company_config
   module_permissions
   product_batches
   system_modules
   system_parameters
   ```

2. **Valores del enum ExpenseCategory:**
   ```
   ALQUILER
   OTRO
   SERVICIOS
   SUMINISTROS
   SUPPLIER_PAYMENT  ← Nuevo
   ```

3. **Columnas agregadas a Invoice:**
   - hasInventoryImpact
   - inventoryProcessed
   - isHistorical
   - notes
   - supplierId

4. **Columnas agregadas a Purchase:**
   - subtotal
   - discount
   - invoiceNumber
   - invoiceDate
   - dueDate

## ✅ Post-Migración

Después de ejecutar el script:

### 1. Regenerar Prisma Client

```powershell
cd backend-perfumeria
npx prisma generate
```

### 2. Reiniciar Backend en Producción

```powershell
# Detener el servidor
# Iniciar nuevamente
npm run start:prod
```

### 3. Verificar Funcionalidades

Probar en producción:
- ✅ Módulo de Facturas
- ✅ Sistema FIFO de inventario
- ✅ Pagos de facturas
- ✅ Compras con invoice tracking
- ✅ Parámetros del sistema

## 🔍 Troubleshooting

### Error: "permission denied for schema public"
**Solución:** El usuario de la BD necesita permisos. Ejecutar como superusuario:
```sql
GRANT ALL ON SCHEMA public TO tu_usuario;
```

### Error: "relation already exists"
**Solución:** ✅ Esto es NORMAL. El script usa `IF NOT EXISTS`, así que saltará lo que ya existe.

### Error: "enum label already exists"
**Solución:** ✅ NORMAL. El script verifica antes de agregar valores al enum.

### Error: "psql: command not found"
**Soluciones:**
1. Usar pgAdmin (Opción 2)
2. Instalar PostgreSQL client tools
3. Usar DBeaver (Opción 4)

### Error: "could not connect to server"
**Verificar:**
- ✅ Credenciales correctas en `.env`
- ✅ Servidor PostgreSQL corriendo
- ✅ Firewall permite conexión
- ✅ Host y puerto correctos

## 📝 Comparación: Script Anterior vs. Nuevo

### `migration-production-invoices.sql` (Anterior)
- ❌ Solo módulo de facturas
- ❌ Solo 3 tablas
- ⚠️ Puede estar desactualizado

### `sync-production-safe.sql` (Nuevo) ✅
- ✅ **TODO** el sistema completo
- ✅ 7 tablas nuevas
- ✅ Todas las columnas faltantes
- ✅ Todos los índices
- ✅ Generado desde schema.prisma actual
- ✅ 100% sincronizado con local

## 🎯 ¿Cuándo Usar Cada Script?

### Usar `sync-production-safe.sql` cuando:
- ✅ Quieres sincronizar TODO de una vez
- ✅ No estás seguro qué falta en producción
- ✅ Has hecho muchos cambios en local
- ✅ Primera vez que migras a producción
- ✅ **RECOMENDADO para tu caso actual**

### Usar scripts específicos cuando:
- ⚠️ Solo quieres agregar una función específica
- ⚠️ Ya tienes todo sincronizado
- ⚠️ Sabes exactamente qué tabla crear

## 🚨 Importante

### Antes de Ejecutar:
1. ✅ Hacer backup de la base de datos de producción
2. ✅ Verificar que DATABASE_URL apunta a producción
3. ✅ Confirmar que el backend está detenido (opcional pero recomendado)

### Después de Ejecutar:
1. ✅ Verificar mensajes de éxito
2. ✅ Regenerar Prisma Client
3. ✅ Reiniciar backend
4. ✅ Probar módulos clave

## 💾 Backup Recomendado

Antes de ejecutar, crear backup:

```powershell
# Opción A: pg_dump
pg_dump -U usuario -d base_datos -F c -f backup_antes_sync.dump

# Opción B: En pgAdmin
# Click derecho en BD → Backup → Guardar archivo
```

## 📞 Soporte

Si encuentras problemas:

1. **Revisar logs del script** - Buscar mensajes de error específicos
2. **Verificar permisos** - Usuario debe tener CREATE, ALTER
3. **Probar en pgAdmin** - Interfaz visual más clara
4. **Revisar DATABASE_URL** - Confirmar conexión correcta

---

**Versión:** 2.0
**Fecha:** 2025-10-25
**Generado desde:** schema.prisma completo
**Seguridad:** ✅ Idempotente (seguro ejecutar múltiples veces)
**Destrucción de datos:** ❌ NO (solo agrega, no elimina)

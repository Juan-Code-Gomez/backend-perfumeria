# 🔄 SINCRONIZACIÓN COMPLETA PRODUCCIÓN - SISTEMA DE PERFUMERÍA

## ⚡ TL;DR - Inicio Rápido

```powershell
# OPCIÓN MÁS FÁCIL: Asistente interactivo que hace TODO
node full-sync-assistant.js
```

**O si prefieres paso a paso:**

```powershell
# 1. (Opcional pero recomendado) Crear backup automático
node create-backup.js

# 2. Ejecutar sincronización completa
node execute-sync-production.js
```

**Eso es todo.** El resto de este documento son detalles y opciones alternativas.

---

## 🎯 Propósito

Este directorio contiene **scripts seguros** para sincronizar tu base de datos de producción con todos los cambios que has hecho en desarrollo local, **sin perder ningún dato**.

## 📁 Archivos Incluidos

### 1. Scripts de Migración

| Archivo | Descripción | Uso |
|---------|-------------|-----|
| `sync-production-safe.sql` | ⭐ **RECOMENDADO** - Sincronización completa y segura | Sincroniza TODO el sistema |
| `migration-production-invoices.sql` | Solo módulo de facturas (3 tablas) | Solo si necesitas facturas específicamente |
| `migration-full-sync.sql` | Generado por Prisma (puede no ser idempotente) | Uso avanzado |

### 2. Scripts de Ejecución (Node.js)

| Archivo | Descripción | Comando |
|---------|-------------|---------|
| `full-sync-assistant.js` | 🌟 **ASISTENTE TODO-EN-UNO** - Te guía paso a paso | `node full-sync-assistant.js` |
| `create-backup.js` | 💾 Crea backup automático antes de migrar | `node create-backup.js` |
| `execute-sync-production.js` | ⭐ Ejecuta sync-production-safe.sql automáticamente | `node execute-sync-production.js` |
| `check-production-diff.js` | 🔍 Verifica diferencias antes de migrar | `node check-production-diff.js` |

### 3. Documentación

| Archivo | Contenido |
|---------|-----------|
| `SYNC-PRODUCTION-GUIDE.md` | Guía completa de sincronización |
| `GUIA-MIGRACION-PRODUCCION.md` | Guía específica para facturas |

## 🚀 Flujo de Trabajo Recomendado

### ⭐ Opción 1: Todo Automático (RECOMENDADO)

```powershell
cd backend-perfumeria

# Paso único: Backup + Migración automática
node create-backup.js
# Te preguntará si ejecutar la migración después del backup
```

### 🎯 Opción 2: Paso a Paso

#### Paso 0: Crear Backup (Recomendado)

```powershell
node create-backup.js
```

#### Paso 1: Verificar Diferencias (Opcional)

```powershell
node check-production-diff.js
```

**Esto te mostrará:**
- ✅ Qué tablas faltan
- ✅ Qué columnas hay que agregar
- ✅ Qué índices crear
- ❌ Sin modificar la base de datos aún

#### Paso 2: Ejecutar Sincronización

**Opción A: Automático**
```powershell
node execute-sync-production.js
```

**Opción B: Manual con pgAdmin**
1. Abrir pgAdmin
2. Query Tool
3. Abrir `sync-production-safe.sql`
4. Ejecutar (F5)

**Opción C: psql**
```powershell
psql "tu_database_url" -f sync-production-safe.sql
```

#### Paso 3: Verificar y Reiniciar

```powershell
# Regenerar Prisma Client
npx prisma generate

# Reiniciar el backend en producción
npm run start:prod
```

## 📊 ¿Qué Incluye la Sincronización Completa?

### Tablas Nuevas (7):
1. ✅ **InvoiceItem** - Ítems de facturas con FIFO
2. ✅ **InvoicePayment** - Pagos y abonos a facturas
3. ✅ **company_config** - Configuración de empresa
4. ✅ **module_permissions** - Sistema de permisos
5. ✅ **product_batches** - Sistema FIFO de inventario
6. ✅ **system_modules** - Módulos del sistema
7. ✅ **system_parameters** - Parámetros configurables

### Modificaciones a Tablas Existentes:

#### User
- `+ companyCode` (multi-tenant)

#### Supplier
- `* nit` → nullable

#### Purchase
- `+ subtotal`
- `+ discount`
- `+ invoiceNumber` (unique)
- `+ invoiceDate`
- `+ dueDate`
- `+ notes`

#### Invoice
- `+ hasInventoryImpact`
- `+ inventoryProcessed`
- `+ isHistorical`
- `+ needsReconciliation`
- `+ notes`
- `+ originalDocument`
- `+ pricesAnalyzed`
- `+ supplierId` (FK → Supplier)

### Enums Actualizados:
- **ExpenseCategory**: + `SUPPLIER_PAYMENT`

## ⚡ Comparación de Scripts

| Característica | `sync-production-safe.sql` | `migration-production-invoices.sql` |
|----------------|----------------------------|-------------------------------------|
| Tablas cubiertas | **7 nuevas** + modificaciones | 3 (solo facturas) |
| Idempotente (seguro re-ejecutar) | ✅ Sí | ✅ Sí |
| Verificaciones IF NOT EXISTS | ✅ Todas | ✅ Todas |
| Sistema completo | ✅ Sí | ❌ Solo facturas |
| Actualizado | ✅ Generado hoy | ⚠️ Versión anterior |
| Recomendado para producción | ⭐ **SÍ** | Solo si ya tienes lo demás |

## 🛡️ Seguridad

### ✅ Garantías de Seguridad:

1. **NO elimina datos** - Solo agrega/modifica estructura
2. **Idempotente** - Seguro ejecutar múltiples veces
3. **Transaccional** - Todo en un BEGIN/COMMIT
4. **Verificaciones previas** - IF NOT EXISTS en todo
5. **Sin destructivo** - No hay DROP TABLE/DATABASE

### ⚠️ Recomendaciones:

1. **Hacer backup** antes de ejecutar (siempre)
2. **Probar primero** en ambiente de staging si es posible
3. **Revisar logs** después de la ejecución
4. **Verificar funcionalidad** antes de usuarios finales

## 🔍 Verificación Post-Migración

El script incluye consultas automáticas de verificación:

```sql
-- Verificar tablas creadas
SELECT table_name FROM information_schema.tables 
WHERE table_name IN (
  'InvoiceItem', 'InvoicePayment', 'company_config', 
  'module_permissions', 'product_batches', 
  'system_modules', 'system_parameters'
);

-- Verificar enum actualizado
SELECT enumlabel FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid  
WHERE t.typname = 'ExpenseCategory';
```

## 📝 Checklist de Migración

```
☐ 1. Hacer backup de producción
☐ 2. Verificar DATABASE_URL en .env
☐ 3. Ejecutar check-production-diff.js (opcional)
☐ 4. Ejecutar sync-production-safe.sql
☐ 5. Verificar mensajes de éxito
☐ 6. Regenerar Prisma Client (npx prisma generate)
☐ 7. Reiniciar backend en producción
☐ 8. Probar módulos clave:
    ☐ Facturas
    ☐ Compras con FIFO
    ☐ Pagos de facturas
    ☐ Sistema de parámetros
☐ 9. Verificar logs del servidor
☐ 10. Confirmar con usuarios que todo funciona
```

## 🆘 Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| "permission denied" | Ejecutar como superusuario o dar permisos |
| "relation already exists" | ✅ Normal, el script lo salta automáticamente |
| "psql: command not found" | Usar pgAdmin (más fácil) |
| "could not connect" | Verificar DATABASE_URL y firewall |
| Cambios no se reflejan | Regenerar Prisma Client y reiniciar backend |

## 📞 Soporte

1. Revisar `SYNC-PRODUCTION-GUIDE.md` - Guía completa detallada
2. Ejecutar `check-production-diff.js` - Diagnóstico automático
3. Revisar logs de PostgreSQL
4. Verificar permisos de usuario de BD

## 🎯 Casos de Uso

### Caso 1: Primera vez desplegando a producción
✅ **Usar:** `sync-production-safe.sql`
📝 **Por qué:** Cubre todo el sistema de una vez

### Caso 2: Solo necesito el módulo de facturas
⚠️ **Usar:** `migration-production-invoices.sql`
📝 **Nota:** Asegúrate de que las demás tablas ya existan

### Caso 3: No estoy seguro qué falta
🔍 **Primero:** `node check-production-diff.js`
✅ **Luego:** `sync-production-safe.sql`

### Caso 4: Producción está muy desactualizada
✅ **Usar:** `sync-production-safe.sql`
📝 **Por qué:** Sincroniza todo sin importar cuánto falte

## 📊 Impacto Estimado

- **Downtime requerido:** ~30 segundos (solo para migración)
- **Tiempo de ejecución:** 5-10 segundos
- **Reinicio de backend:** ~5 segundos
- **Total:** < 1 minuto

## 🎉 Después de la Migración

Tu sistema en producción tendrá:

✅ **Módulo de Facturas Completo**
- Creación con procesamiento FIFO
- Pagos y abonos
- Tracking de proveedores
- Estados (PENDING/PARTIAL/PAID)

✅ **Sistema FIFO de Inventario**
- Lotes por compra
- Control de costos por lote
- Fechas de vencimiento

✅ **Sistema de Parámetros**
- Configuración dinámica
- Sin recompilar código

✅ **Sistema de Permisos**
- Control por módulo
- Configuración granular

✅ **Configuración de Empresa**
- Logo, NIT, datos fiscales
- Personalización completa

---

**Versión:** 2.0
**Fecha de creación:** 2025-10-25
**Última actualización:** 2025-10-25
**Estado:** ✅ Listo para producción
**Pruebas:** ✅ Validado en desarrollo

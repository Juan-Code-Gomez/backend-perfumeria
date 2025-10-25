# 🚀 Solución: Aplicar Fixes en Múltiples Bases de Datos

## ✅ Estado Actual
- ✅ Fix funcionando en base de datos principal
- ✅ Script probado y validado
- ⏳ Pendiente: Aplicar en las otras 3 bases de datos de Railway

---

## 📝 INSTRUCCIONES PARA LAS 3 BASES DE DATOS RESTANTES

### Opción A: Automático (RECOMENDADO) 🤖

#### Paso 1: Obtener las URLs de Railway

Para cada base de datos en Railway:
1. Ve al Dashboard de Railway
2. Selecciona el servicio de PostgreSQL
3. Ve a la pestaña "Variables"
4. Copia el valor de `DATABASE_URL`

#### Paso 2: Configurar el archivo .env

Edita tu archivo `.env` local y agrega:

```env
# Base de datos principal (ya está)
DATABASE_URL="postgresql://postgres:SJBYEwPzlxYkrgMupzDOWYTAUXICMCHT@shinkansen.proxy.rlwy.net:21931/railway"

# Cliente 2 - Pega la URL aquí
DATABASE_URL_CLIENT_2="postgresql://postgres:XXXXXXX@XXXXXX.railway.app:XXXX/railway"

# Cliente 3 - Pega la URL aquí
DATABASE_URL_CLIENT_3="postgresql://postgres:XXXXXXX@XXXXXX.railway.app:XXXX/railway"

# Cliente 4 - Pega la URL aquí
DATABASE_URL_CLIENT_4="postgresql://postgres:XXXXXXX@XXXXXX.railway.app:XXXX/railway"
```

#### Paso 3: Ejecutar el script

```bash
node apply-fix-multi-db.js
```

El script:
- ✅ Conectará a cada base de datos
- ✅ Aplicará todos los fixes
- ✅ Verificará que se aplicaron correctamente
- ✅ Mostrará un resumen final

**Resultado esperado:**
```
✅ Exitosos: 4/4
   ✓ Producción Principal
   ✓ Cliente 2
   ✓ Cliente 3
   ✓ Cliente 4
```

---

### Opción B: Manual (Base por base) 🛠️

Si prefieres aplicar el fix manualmente en cada base de datos:

#### Paso 1: Conectarte a Railway Database

**Opción 1 - Desde el navegador:**
1. Ve al Dashboard de Railway
2. Selecciona el servicio PostgreSQL
3. Click en "Query" o "Data"
4. Verás un editor SQL

**Opción 2 - Desde tu terminal:**
```bash
# Usa la DATABASE_URL del cliente
psql "postgresql://postgres:PASSWORD@HOST:PORT/railway"
```

#### Paso 2: Ejecutar los comandos SQL

Copia y pega estos comandos uno por uno:

```sql
-- Tabla Purchase
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "subtotal" DOUBLE PRECISION;
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "discount" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT;
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "invoiceDate" TIMESTAMP(3);
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3);
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Índices
CREATE INDEX IF NOT EXISTS "Purchase_invoiceNumber_key" ON "Purchase"("invoiceNumber") WHERE "invoiceNumber" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Purchase_invoiceDate_idx" ON "Purchase"("invoiceDate") WHERE "invoiceDate" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Purchase_dueDate_idx" ON "Purchase"("dueDate") WHERE "dueDate" IS NOT NULL;

-- Actualizar datos existentes
UPDATE "Purchase" SET "subtotal" = "totalAmount" WHERE "subtotal" IS NULL;

-- Tabla Invoice
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "notes" TEXT;
```

#### Paso 3: Verificar

Ejecuta esta query para verificar:

```sql
-- Verificar Purchase
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'Purchase' 
AND column_name IN ('subtotal', 'discount', 'invoiceNumber', 'invoiceDate', 'dueDate', 'notes')
ORDER BY column_name;

-- Debe retornar 6 filas

-- Verificar Invoice
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'Invoice' 
AND column_name = 'notes';

-- Debe retornar 1 fila
```

---

## 🎯 Para Nuevos Clientes (Prevención)

### Método 1: Durante el Deploy en Railway

Agrega esto a tu comando de inicio en Railway:

```bash
npx prisma migrate deploy && node apply-fix-multi-db.js && npm run start:prod
```

O crea un script en `package.json`:

```json
{
  "scripts": {
    "deploy:railway": "prisma migrate deploy && node setup-new-client.js && npm run start:prod"
  }
}
```

### Método 2: Script de Setup Manual

Cuando crees un nuevo cliente, ejecuta:

```bash
node setup-new-client.js
```

Este script hace:
1. ✅ Verifica conexión a la BD
2. ✅ Aplica migraciones de Prisma
3. ✅ Aplica fix de columnas faltantes
4. ✅ Genera Prisma Client
5. ✅ Inicializa parámetros del sistema

---

## ✅ Verificación Post-Aplicación

Después de aplicar el fix en cada base de datos, verifica que los endpoints funcionen:

### Localmente (desde tu máquina):

```bash
# Cambiar la DATABASE_URL a la del cliente
# Luego ejecutar:
node test-dashboard-debug.js
```

### En producción (desde el navegador o Postman):

```
GET https://cliente1-backend.railway.app/api/dashboard/debug
GET https://cliente2-backend.railway.app/api/dashboard/debug
GET https://cliente3-backend.railway.app/api/dashboard/debug
GET https://cliente4-backend.railway.app/api/dashboard/debug
```

**Todos deben retornar:**
- Status: `200 OK`
- Body: `{ "success": true, ... }`
- Sin errores de columnas faltantes

---

## 📁 Archivos del Fix

| Archivo | Uso |
|---------|-----|
| `apply-fix-multi-db.js` | ⭐ **Usa este para aplicar en múltiples BDs** |
| `setup-new-client.js` | Para inicializar un cliente nuevo desde cero |
| `fix-all-missing-columns.sql` | Script SQL de referencia (no ejecutar directamente) |
| `RESUMEN-SOLUCION.md` | Este archivo |

---

## 🚨 Notas Importantes

- ✅ Los scripts son **idempotentes** (se pueden ejecutar múltiples veces)
- ✅ Usan `IF NOT EXISTS` (no dan error si las columnas ya existen)
- ✅ No borran ni modifican datos existentes
- ✅ Incluyen verificación automática
- ⚠️  Guarda un backup antes de aplicar (opcional pero recomendado)

---

## 📞 ¿Problemas?

### Error: "No hay bases de datos configuradas"
**Solución:** Verifica que hayas agregado las variables `DATABASE_URL_CLIENT_X` en tu `.env`

### Error: "Connection refused"
**Solución:** 
- Verifica que la URL sea correcta
- Verifica que la base de datos esté activa en Railway
- Prueba conectarte manualmente con `psql`

### Error: "Column already exists"
**No es problema:** El script maneja esto automáticamente con `IF NOT EXISTS`

### Algunos clientes funcionan, otros no
**Solución:** Revisa los logs del script para ver qué específicamente falló en cada uno

---

## 🎉 Resultado Final Esperado

Después de completar estos pasos:
- ✅ 4 bases de datos con todas las columnas necesarias
- ✅ Dashboard funcionando en todos los clientes
- ✅ Módulo de Facturas funcionando en todos los clientes
- ✅ Script documentado para futuros clientes
- ✅ Proceso automatizado para prevenir el problema

---

**💡 RECOMENDACIÓN:** Usa la Opción A (automático) para las 3 bases de datos restantes. Es más rápido y menos propenso a errores.

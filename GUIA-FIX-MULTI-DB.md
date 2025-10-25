# 🔧 Guía: Aplicar Fixes en Múltiples Bases de Datos

## 📋 Problema Detectado

La migración baseline marcó todas las migraciones como aplicadas, pero algunas bases de datos en Railway no tienen todas las columnas necesarias.

**Columnas faltantes:**
- `Purchase`: subtotal, discount, invoiceNumber, invoiceDate, dueDate, notes (6 columnas)
- `Invoice`: notes (1 columna)

---

## 🚀 Solución Rápida: Aplicar Fix en Múltiples Bases de Datos

### Paso 1: Configurar las URLs de las bases de datos

Edita tu archivo `.env` y agrega las URLs de las otras bases de datos:

```env
# Base de datos principal
DATABASE_URL="postgresql://postgres:password@host:21931/railway"

# Otras bases de datos de clientes
DATABASE_URL_CLIENT_2="postgresql://postgres:password@host2:21931/railway"
DATABASE_URL_CLIENT_3="postgresql://postgres:password@host3:21931/railway"
DATABASE_URL_CLIENT_4="postgresql://postgres:password@host4:21931/railway"
```

### Paso 2: Ejecutar el script

```bash
node apply-fix-multi-db.js
```

El script:
- ✅ Se conecta a cada base de datos
- ✅ Aplica el fix SQL (idempotente, se puede ejecutar múltiples veces)
- ✅ Verifica que todas las columnas se agregaron
- ✅ Muestra un resumen de éxitos y fallos

---

## 🛠️ Alternativa: Aplicar Fix Manualmente en Railway

Si prefieres aplicar el fix directamente desde Railway:

### 1. Ir al Dashboard de Railway
1. Selecciona el servicio de PostgreSQL del cliente
2. Ve a la pestaña "Data"
3. Abre la consola de PostgreSQL

### 2. Copiar y pegar el script SQL
Copia el contenido completo de `fix-all-missing-columns.sql` y pégalo en la consola.

### 3. Verificar
El script mostrará mensajes de confirmación al finalizar.

---

## 🔄 Solución Permanente: Migración Post-Baseline

Para evitar este problema en **nuevos clientes**, crea una migración que incluya todos estos campos:

### Opción 1: Migración Manual (RECOMENDADO)

```bash
# Crear migración vacía
npx prisma migrate dev --name add_missing_columns_post_baseline --create-only
```

Luego edita el archivo creado en `prisma/migrations/XXXXXX_add_missing_columns_post_baseline/migration.sql`:

```sql
-- Copiar el contenido de fix-all-missing-columns.sql
```

### Opción 2: Incluir en el Script de Inicialización

Crea un script `init-new-client.js` que:
1. Ejecute `prisma migrate deploy`
2. Ejecute el fix de columnas faltantes
3. Genere el Prisma Client
4. Inicialice datos por defecto

---

## 📝 Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `fix-all-missing-columns.sql` | Script SQL idempotente con todos los fixes |
| `apply-fix-multi-db.js` | Script Node.js para aplicar en múltiples BDs |
| `.env.databases.example` | Ejemplo de configuración de URLs |

---

## ✅ Checklist de Aplicación

- [ ] Configurar URLs en `.env`
- [ ] Ejecutar `node apply-fix-multi-db.js`
- [ ] Verificar que todas las BDs muestran ✅
- [ ] Probar endpoints de Dashboard e Invoices en cada cliente
- [ ] Hacer commit del fix SQL para versionarlo
- [ ] Documentar en el README del proyecto

---

## 🆘 Troubleshooting

### Error: "No hay bases de datos configuradas"
**Solución:** Agrega las variables `DATABASE_URL_CLIENT_X` en tu `.env`

### Error: "Connection refused"
**Solución:** Verifica que la URL de Railway sea correcta y que la base de datos esté activa

### Error: "Column already exists"
**No hay problema:** El script usa `ADD COLUMN IF NOT EXISTS`, es seguro ejecutarlo múltiples veces

---

## 🎯 Para Nuevos Clientes (Prevención)

### Método 1: Script de Setup Completo

Crea `setup-new-client.sh`:

```bash
#!/bin/bash
echo "🚀 Configurando nuevo cliente..."

# 1. Aplicar migraciones
npx prisma migrate deploy

# 2. Aplicar fix de columnas (por si acaso)
npx prisma db execute --file=./fix-all-missing-columns.sql

# 3. Generar Prisma Client
npx prisma generate

# 4. Seed datos iniciales
node prisma/seed.js

echo "✅ Cliente configurado exitosamente"
```

### Método 2: Incluir en el Despliegue de Railway

Agrega en `railway.toml`:

```toml
[deploy]
startCommand = "sh -c 'npx prisma migrate deploy && npx prisma db execute --file=./fix-all-missing-columns.sql && npm run start:prod'"
```

---

## 📊 Monitoreo

Después de aplicar los fixes, verifica estos endpoints:

```bash
# Dashboard
curl https://cliente-backend.railway.app/api/dashboard/debug

# Invoices
curl https://cliente-backend.railway.app/api/invoices/debug
```

Ambos deben retornar `200 OK` sin errores de columnas faltantes.

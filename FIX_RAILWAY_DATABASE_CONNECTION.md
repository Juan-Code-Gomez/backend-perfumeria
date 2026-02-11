# 🔧 Solución: Error de Conexión a Base de Datos en Railway

## ❌ Error Actual
```
PrismaClientInitializationError: Can't reach database server at `trolley.proxy.rlwy.net:45234`
Error Code: P1001
```

## ✅ Solución

### Paso 1: Verificar que la Base de Datos existe y está activa

1. Ve a tu proyecto en Railway: https://railway.app
2. Busca el proyecto del backend
3. **Verifica que existe un servicio PostgreSQL:**
   - Si NO existe → Debes crear uno (ver Paso 1.1)
   - Si existe → Verifica que esté activo (ver Paso 1.2)

#### Paso 1.1: Crear Base de Datos PostgreSQL (si no existe)

```bash
# En el dashboard de Railway:
1. Click en "+ New" → "Database" → "PostgreSQL"
2. Espera a que se provisione (1-2 minutos)
3. Una vez creada, anota la información de conexión
```

#### Paso 1.2: Verificar que la BD está activa

1. Click en el servicio PostgreSQL
2. Verifica que el estado sea "Active" (no "Paused" o "Sleeping")
3. Ve a la pestaña "Variables"
4. Copia el valor de `DATABASE_URL`

### Paso 2: Configurar Variables de Entorno en Railway

1. En tu proyecto de Railway, click en el **servicio del backend** (no la base de datos)
2. Ve a la pestaña **"Variables"**
3. Agrega/actualiza estas variables:

```env
# Variable CRÍTICA - Debe venir de la base de datos PostgreSQL
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Si la base de datos está en el mismo proyecto, Railway puede auto-referenciarla
# De lo contrario, copia la URL completa desde el servicio PostgreSQL

# Otras variables necesarias:
JWT_SECRET=tu-secreto-super-seguro-aqui-cambiar-en-produccion
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://perfumeria-sistema.vercel.app
DEFAULT_CURRENCY=COP
TAX_RATE=0.19
LOW_STOCK_THRESHOLD=5
```

### Paso 3: Verificar la Referencia Automática (Recomendado)

Railway puede auto-referenciar servicios del mismo proyecto:

1. En el servicio del **backend**, pestaña **"Variables"**
2. Click en **"+ New Variable"** → **"Add Reference"**
3. Selecciona tu servicio PostgreSQL
4. Selecciona la variable `DATABASE_URL`
5. Esto creará: `DATABASE_URL=${{Postgres.DATABASE_URL}}`

### Paso 4: Verificar la URL de Conexión

Si usas una URL manual, debe tener este formato:

```
postgresql://postgres:PASSWORD@HOST:PORT/railway
```

**Ejemplo:**
```
postgresql://postgres:wGcAKDSKDggpmWPulURTqPDEYOPovsPy@trolley.proxy.rlwy.net:45234/railway
```

**Componentes:**
- `postgres` = usuario
- `wGcAKD...` = password
- `trolley.proxy.rlwy.net` = host
- `45234` = puerto
- `railway` = nombre de la base de datos

### Paso 5: Verificar que Prisma se genera correctamente

Asegúrate de que tu `package.json` tiene el script `postinstall`:

```json
{
  "scripts": {
    "build": "nest build",
    "postinstall": "prisma generate"
  }
}
```

Esto garantiza que Prisma Client se regenere en cada despliegue.

### Paso 6: Redesplegar

Una vez configuradas las variables:

1. **Opción A - Automático:** Railway re-desplegará automáticamente
2. **Opción B - Manual:** 
   - Ve a "Deployments"
   - Click en los 3 puntos del último deployment
   - Selecciona "Redeploy"

### Paso 7: Verificar Logs

Después del despliegue:

1. Ve a la pestaña **"Deployments"**
2. Click en el deployment más reciente
3. Revisa los logs:
   - ✅ Debe mostrar: "Prisma schema loaded from prisma/schema.prisma"
   - ✅ Debe mostrar: "🚀 Application is running on port 3000"
   - ❌ NO debe mostrar: "Can't reach database server"

## 🔍 Diagnóstico Adicional

### Verificar conectividad desde tu máquina local

Si quieres probar la conexión desde tu computadora:

```powershell
# Windows PowerShell
cd "d:\Proyecto Milan\codigo\backend-perfumeria"

# Configura la URL (reemplaza con tu URL real de Railway)
$env:DATABASE_URL="postgresql://postgres:PASSWORD@trolley.proxy.rlwy.net:PORT/railway"

# Prueba la conexión con Prisma
npx prisma db pull
```

Si esto funciona, significa que la URL es correcta y el problema está en Railway.

### Verificar que el schema está sincronizado

```powershell
# Ver el estado actual de la BD
npx prisma db pull

# Aplicar migraciones pendientes (si las hay)
npx prisma migrate deploy
```

## ⚠️ Problemas Comunes

### 1. "P1001: Can't reach database server"
- **Causa:** Base de datos no existe, está pausada, o URL incorrecta
- **Solución:** Verifica Pasos 1 y 2

### 2. "P1017: Server has closed the connection"
- **Causa:** Conexión inestable o límite de conexiones
- **Solución:** Railway Free tier tiene límites. Considera upgrade.

### 3. Base de datos vacía después de desplegar
- **Causa:** Nueva base de datos sin schema
- **Solución:** Ejecuta migraciones:
  ```bash
  # Desde tu máquina local con DATABASE_URL de Railway
  npx prisma migrate deploy
  ```

### 4. Variables de entorno no se aplican
- **Causa:** No se re-desplegó después de cambiar variables
- **Solución:** Fuerza un nuevo deployment (Paso 6)

## 📊 Estado Esperado

Después de aplicar esta solución:

- ✅ Backend se conecta exitosamente a PostgreSQL
- ✅ Prisma Client se genera correctamente
- ✅ Aplicación inicia en puerto 3000
- ✅ Frontend puede hacer peticiones al backend
- ✅ Logs no muestran errores de conexión

## 🆘 Si el Problema Persiste

1. **Copia los logs completos** del deployment fallido
2. **Verifica en Railway Dashboard:**
   - Servicio PostgreSQL existe y está "Active"
   - Variable `DATABASE_URL` está configurada en el backend
   - El backend y la BD están en el mismo proyecto
3. **Intenta crear una nueva base de datos** PostgreSQL en Railway y actualizar la referencia

## 📝 Checklist Final

- [ ] Base de datos PostgreSQL existe en Railway
- [ ] Base de datos está en estado "Active"
- [ ] Variable `DATABASE_URL` configurada en el backend
- [ ] Variable apunta al servicio correcto (referencia o URL completa)
- [ ] Otras variables de entorno configuradas (JWT_SECRET, etc.)
- [ ] Script `postinstall` existe en package.json
- [ ] Backend re-desplegado después de configurar variables
- [ ] Logs muestran conexión exitosa
- [ ] Aplicación inicia correctamente

---

**Última actualización:** Febrero 2026

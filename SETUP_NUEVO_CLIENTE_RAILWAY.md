# 🏪 SETUP DE NUEVO CLIENTE EN RAILWAY

## 📋 INFORMACIÓN DEL NUEVO AMBIENTE

### URLs:
- **Frontend**: https://perfumeria-sistema-production-1f4b.up.railway.app
- **Backend**: https://backend-perfumeria-production-2dce.up.railway.app

### Base de Datos:
```
# URL Externa (para conexiones remotas)
postgresql://postgres:wGcAKDSKDggpmWPulURTqPDEYOPovsPy@trolley.proxy.rlwy.net:45234/railway

# URL Interna (para servicios dentro de Railway)
postgresql://postgres:wGcAKDSKDggpmWPulURTqPDEYOPovsPy@postgres.railway.internal:5432/railway
```

---

## ✅ PASO 1: CONFIGURAR VARIABLES DE ENTORNO EN RAILWAY

Ve al servicio **backend-perfumeria** en Railway y agrega estas variables:

### Variables Requeridas:

```bash
# Base de datos (usar URL INTERNA para mejor performance)
DATABASE_URL=postgresql://postgres:wGcAKDSKDggpmWPulURTqPDEYOPovsPy@postgres.railway.internal:5432/railway

# JWT (usar el mismo secreto o generar uno nuevo)
JWT_SECRET=perfumeria-super-secret-key-2024-milan-proyecto-backend-secure-12345
JWT_EXPIRES_IN=7d

# Configuración del servidor
PORT=3000
NODE_ENV=production

# ⚠️ IMPORTANTE: Timezone para Colombia
TZ=America/Bogota
```

### Pasos en Railway Dashboard:

1. Railway Dashboard → Proyecto → Servicio **backend-perfumeria**
2. Pestaña **"Variables"**
3. Agregar cada variable (click en "New Variable")
4. Railway hará redeploy automático

---

## ✅ PASO 2: CREAR TABLAS EN LA BASE DE DATOS

Tienes **3 opciones** para crear las tablas:

### **OPCIÓN A: Desde Railway CLI (Recomendado)** ⭐

```bash
# 1. Instalar Railway CLI (si no lo tienes)
npm install -g @railway/cli

# 2. Login
railway login

# 3. Conectar al proyecto
railway link

# Cuando te pregunte, selecciona:
# - Proyecto: Tu proyecto nuevo
# - Servicio: backend-perfumeria

# 4. Ejecutar setup completo (crea tablas + datos iniciales)
railway run npm run setup:new-client
```

Este comando ejecuta:
- `prisma migrate deploy` - Crea todas las tablas
- `prisma db seed` - Inserta datos iniciales
- `npm run build` - Compila el proyecto

---

### **OPCIÓN B: Desde Local (Alternativa)**

```bash
# 1. Configurar la URL de la base de datos temporal
export DATABASE_URL="postgresql://postgres:wGcAKDSKDggpmWPulURTqPDEYOPovsPy@trolley.proxy.rlwy.net:45234/railway"

# En Windows PowerShell:
$env:DATABASE_URL="postgresql://postgres:wGcAKDSKDggpmWPulURTqPDEYOPovsPy@trolley.proxy.rlwy.net:45234/railway"

# 2. Ejecutar migraciones
npx prisma migrate deploy

# 3. Ejecutar seed (datos iniciales)
npx prisma db seed

# 4. Verificar
npx prisma studio
```

---

### **OPCIÓN C: Script Automatizado**

Crea un archivo `setup-client-trolley.ps1`:

```powershell
# Setup para cliente en Railway (BD: trolley)

Write-Host "🚀 Configurando nueva base de datos para cliente..." -ForegroundColor Green

# Configurar URL de BD
$env:DATABASE_URL="postgresql://postgres:wGcAKDSKDggpmWPulURTqPDEYOPovsPy@trolley.proxy.rlwy.net:45234/railway"

Write-Host "📦 Ejecutando migraciones de Prisma..." -ForegroundColor Yellow
npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migraciones completadas" -ForegroundColor Green
    
    Write-Host "🌱 Insertando datos iniciales (seed)..." -ForegroundColor Yellow
    npx prisma db seed
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Seed completado" -ForegroundColor Green
        Write-Host "🎉 Base de datos configurada correctamente" -ForegroundColor Green
    } else {
        Write-Host "❌ Error en seed" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Error en migraciones" -ForegroundColor Red
}
```

Ejecutar:
```powershell
.\setup-client-trolley.ps1
```

---

## ✅ PASO 3: CONFIGURAR CORS EN EL BACKEND

Edita `src/main.ts` para agregar la nueva URL del frontend:

```typescript
app.enableCors({
  origin: [
    'https://perfumeria-sistema.vercel.app',
    'https://perfumeria-sistema-production.up.railway.app',
    'https://perfumeria-sistema-production-1f4b.up.railway.app', // ← NUEVO
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

Hacer commit y push:
```bash
git add src/main.ts
git commit -m "feat: agregar CORS para nuevo cliente (1f4b)"
git push origin main
```

Railway hará redeploy automático.

---

## ✅ PASO 4: CONFIGURAR FRONTEND

En el servicio **perfumeria-sistema** de Railway:

### Variables:
```bash
# URL del backend
VITE_API_URL=https://backend-perfumeria-production-2dce.up.railway.app/api
```

Railway hará redeploy del frontend automáticamente.

---

## ✅ PASO 5: VERIFICAR QUE TODO FUNCIONE

### 1. **Verificar Backend**

```bash
# Health check
curl https://backend-perfumeria-production-2dce.up.railway.app/api

# Debe responder algo como:
# {"message": "API Running"} o similar
```

### 2. **Verificar Base de Datos**

```bash
# Ver tablas creadas (desde local)
export DATABASE_URL="postgresql://postgres:wGcAKDSKDggpmWPulURTqPDEYOPovsPy@trolley.proxy.rlwy.net:45234/railway"
npx prisma studio

# Debe abrir Prisma Studio y mostrar todas las tablas:
# - User, Role, UserRole
# - Product, Category, Unit
# - Sale, Purchase, Expense
# - etc.
```

### 3. **Probar Login en Frontend**

Abre: https://perfumeria-sistema-production-1f4b.up.railway.app/login

Credenciales por defecto (del seed):
```
Usuario: admin
Contraseña: Admin123!
```

Si entras correctamente, ¡todo está funcionando! ✅

---

## 📊 DATOS INICIALES QUE SE CREAN (SEED)

El comando `prisma db seed` crea automáticamente:

### 1. **Roles**:
- SUPER_ADMIN
- ADMIN
- VENDEDOR
- USER

### 2. **Usuario Administrador**:
- Usuario: `admin`
- Contraseña: `Admin123!`
- Rol: SUPER_ADMIN

### 3. **Módulos del Sistema** (con permisos):
- Dashboard
- Productos
- Ventas
- Compras
- Clientes
- etc.

### 4. **Categorías de ejemplo** (opcional):
- Perfumes
- Colonias
- etc.

### 5. **Unidades de medida**:
- Unidad
- Litro
- Mililitro
- etc.

---

## 🔍 VERIFICACIÓN DETALLADA

### Checklist Final:

```
✅ Variables de entorno configuradas en Railway
✅ TZ=America/Bogota agregado
✅ Migraciones ejecutadas (todas las tablas creadas)
✅ Seed ejecutado (datos iniciales insertados)
✅ CORS configurado con la nueva URL del frontend
✅ Frontend apunta al backend correcto (VITE_API_URL)
✅ Login funciona desde el frontend
✅ Dashboard carga correctamente
```

---

## 🚨 TROUBLESHOOTING

### Problema 1: "No se puede conectar a la base de datos"

**Solución**:
- Verificar que la URL de la base de datos sea correcta
- Usar URL **INTERNA** en Railway (postgres.railway.internal)
- Usar URL **EXTERNA** desde tu computadora local

### Problema 2: "Error: Migration failed"

**Solución**:
```bash
# Ver estado de migraciones
npx prisma migrate status

# Si hay problemas, resetear (⚠️ SOLO en BD nueva)
npx prisma migrate reset --skip-seed
npx prisma migrate deploy
npx prisma db seed
```

### Problema 3: "Usuario admin no existe"

**Solución**:
```bash
# Ejecutar seed nuevamente
npx prisma db seed
```

### Problema 4: "CORS error en frontend"

**Solución**:
- Verificar que agregaste la URL del frontend en `src/main.ts`
- Hacer commit y push
- Esperar redeploy de Railway

### Problema 5: "Fechas incorrectas"

**Solución**:
- Verificar que `TZ=America/Bogota` esté en las variables de Railway
- Reiniciar el servicio backend

---

## 📞 COMANDOS ÚTILES

```bash
# Ver logs del backend en Railway
railway logs --service backend-perfumeria

# Ejecutar comando en Railway
railway run <comando>

# Conectar a la base de datos
railway connect postgres

# Ver variables configuradas
railway variables
```

---

## 🎯 ORDEN RECOMENDADO

1. ✅ Configurar variables de entorno en Railway
2. ✅ Ejecutar `railway run npm run setup:new-client` (crea todo)
3. ✅ Agregar CORS para el nuevo frontend
4. ✅ Configurar VITE_API_URL en el frontend
5. ✅ Probar login en el frontend

**Tiempo estimado**: 10-15 minutos ⚡

---

**Fecha**: 20 de Enero, 2026
**Cliente**: Nuevo ambiente - Railway (trolley)
**Estado**: 📝 Pendiente de configuración

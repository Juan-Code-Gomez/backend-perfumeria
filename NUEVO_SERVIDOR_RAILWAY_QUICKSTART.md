# 🚀 Guía Rápida: Configurar Nuevo Servidor en Railway

## 📋 Resumen
Esta guía te ayudará a configurar un nuevo servidor de prueba o producción en Railway sin errores de base de datos.

## ✅ Proceso Correcto

### 1. Crear Servicios en Railway

1. **Base de Datos PostgreSQL**
   - Crear nuevo servicio PostgreSQL
   - Copiar la DATABASE_URL generada

2. **Backend**
   - Conectar repositorio GitHub
   - Configurar variables de entorno

3. **Frontend**
   - Conectar repositorio GitHub
   - Configurar variables de entorno

### 2. Variables de Entorno del Backend

```env
# Base de datos (Railway genera esto automáticamente)
DATABASE_URL=postgresql://postgres:xxxxx@xxxxx.proxy.rlwy.net:xxxxx/railway

# JWT
JWT_SECRET=tu-secret-super-seguro-aqui

# Puerto
PORT=3000

# Configuración de aplicación
NODE_ENV=production
```

### 3. Configurar Railway.json (Backend)

Asegúrate de que el backend tenga este archivo `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm run railway:start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 4. Scripts Automáticos

El script `railway-auto-deploy.js` ahora hace todo automáticamente:

✅ Detecta si es base de datos nueva o existente
✅ Aplica migraciones de Prisma
✅ Crea tabla `company_config` si no existe
✅ Genera Prisma Client

**No necesitas hacer nada manual**, Railway ejecutará todo en el primer deploy.

## 🔧 Si Algo Sale Mal

### Error: "Table company_config does not exist"

Si ves este error, ejecuta localmente:

```bash
# 1. Ir al directorio del backend
cd backend-perfumeria

# 2. Ejecutar script de migración (reemplaza la URL con tu DATABASE_URL)
node migrate-test-server.js

# 3. Ejecutar seed
node migrate-test-server-seed.js
```

### Verificar Estado de la Base de Datos

```bash
node check-test-server-status.js
```

Este script te mostrará:
- Migraciones aplicadas
- Tablas existentes en la base de datos

## 📝 Credenciales por Defecto

Después del seed:
- **Usuario**: admin
- **Password**: admin123

⚠️ **IMPORTANTE**: Cambia estas credenciales inmediatamente en producción.

## 🎯 Checklist Post-Deployment

- [ ] Backend responde en `/api/health`
- [ ] Frontend carga correctamente
- [ ] Puedes hacer login con admin/admin123
- [ ] Configuración de compañía existe (ir a Configuración)
- [ ] Puedes crear un producto de prueba
- [ ] Puedes crear una venta de prueba

## 📞 Contacto

Si encuentras problemas no cubiertos en esta guía, busca en los logs de Railway:
1. Ve al servicio del backend
2. Click en "Logs"
3. Busca el error específico

## 🔄 Actualizar Servidor Existente

Para servidores existentes, Railway detectará automáticamente:
- Aplicará solo las migraciones nuevas
- No sobrescribirá datos existentes
- Actualizará el código automáticamente

## 🛠️ Scripts Útiles

### Migrar Servidor Específico

Edita `migrate-test-server.js` y actualiza la DATABASE_URL, luego:

```bash
node migrate-test-server.js
node migrate-test-server-seed.js
```

### Ver Estado de BD

```bash
node check-test-server-status.js
```

### Crear Tabla Company Config Manualmente

```bash
node create-company-config-table.js
```

## ✨ Mejoras Implementadas

1. **Auto-detección**: El sistema detecta si es BD nueva o existente
2. **Auto-fix**: Crea `company_config` automáticamente si falta
3. **Logs mejorados**: Colores y timestamps en todos los logs
4. **Idempotencia**: Los scripts pueden ejecutarse múltiples veces sin problemas

## 📚 Documentos Relacionados

- `RAILWAY_DEPLOYMENT_GUIDE.md` - Guía completa de deployment
- `DEPLOY-AUTOMATICO.md` - Detalles técnicos del auto-deployment
- `SETUP_NUEVO_CLIENTE_RAILWAY.md` - Configuración inicial de clientes

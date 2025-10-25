# 🚀 DESPLIEGUE AUTOMÁTICO CON MIGRACIONES - PRODUCCIÓN

## 🎯 Problema Solucionado

**Antes:** Tenías que ejecutar SQL manualmente en cada base de datos  
**Ahora:** Las migraciones se ejecutan automáticamente al desplegar ✅

---

## 📋 Cómo Funciona

### Para Bases de Datos EXISTENTES (ya en producción)

1. **Primera vez (SOLO UNA VEZ por cada cliente):**
   ```bash
   npx prisma migrate resolve --applied 20251025161155_baseline_complete_schema
   ```
   
   Esto le dice a Prisma: "Esta base de datos ya tiene este schema, no lo vuelvas a aplicar"

2. **Regenerar Prisma Client:**
   ```bash
   npx prisma generate
   ```

3. **¡Listo!** Ya están sincronizados.

---

### Para Bases de Datos NUEVAS (nuevos clientes)

Simplemente ejecuta:
```bash
npx prisma migrate deploy
```

Esto aplicará **TODAS** las migraciones automáticamente, incluyendo la baseline.

---

## 🔄 Flujo de Trabajo Futuro

### 1. Cuando Haces un Cambio en el Schema

```bash
# En desarrollo (local)
npx prisma migrate dev --name descripcion_del_cambio
```

Esto:
- Crea una nueva migración
- La aplica a tu BD de desarrollo
- Regenera el Prisma Client

### 2. Antes de Deployar

```bash
# Verificar que todo compila
npm run build
```

### 3. Al Deployar a Producción

**Opción A: En el script de deployment (package.json)**
```json
{
  "scripts": {
    "deploy": "npx prisma migrate deploy && npm run build && npm run start:prod"
  }
}
```

**Opción B: Manualmente**
```bash
npx prisma migrate deploy
npm run build
npm run start:prod
```

---

## 📦 Configuración por Tipo de Cliente

### Cliente con BD Existente (ya tiene datos)

```bash
# Conectar a su BD en .env
DATABASE_URL="postgresql://user:pass@host:port/database"

# Marcar baseline como aplicado (solo primera vez)
npx prisma migrate resolve --applied 20251025161155_baseline_complete_schema

# Aplicar migraciones nuevas (si las hay)
npx prisma migrate deploy

# Iniciar aplicación
npm run start:prod
```

### Cliente con BD Nueva (primera instalación)

```bash
# Conectar a su BD en .env
DATABASE_URL="postgresql://user:pass@host:port/database"

# Aplicar TODAS las migraciones (incluyendo baseline)
npx prisma migrate deploy

# Iniciar aplicación
npm run start:prod
```

---

## 🎯 Ejemplo Real: 3 Clientes

### Cliente A (ya en producción desde hace 1 mes)
```bash
# Solo primera vez:
npx prisma migrate resolve --applied 20251025161155_baseline_complete_schema

# Futuros deployments:
npx prisma migrate deploy
```

### Cliente B (nuevo, se instala hoy)
```bash
# Primera instalación:
npx prisma migrate deploy
# ✅ Obtiene TODO el schema actualizado automáticamente
```

### Cliente C (ya existe pero desactualizado)
```bash
# Opción 1: Marcar baseline + aplicar nuevas
npx prisma migrate resolve --applied 20251025161155_baseline_complete_schema
npx prisma migrate deploy

# Opción 2: Ejecutar sync-production-safe.sql una vez, luego:
npx prisma migrate resolve --applied 20251025161155_baseline_complete_schema
# Futuros deploys: npx prisma migrate deploy
```

---

## 🔧 Scripts Automatizados

He creado scripts que hacen todo esto por ti:

### `deploy-to-production.sh` (para cada cliente)

```bash
#!/bin/bash
# Script de deployment automático

echo "🚀 Desplegando a producción..."

# 1. Aplicar migraciones
echo "📦 Aplicando migraciones de BD..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
  echo "❌ Error en migraciones"
  exit 1
fi

# 2. Generar Prisma Client
echo "🔄 Generando Prisma Client..."
npx prisma generate

# 3. Build de la aplicación
echo "🔨 Compilando aplicación..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Error en compilación"
  exit 1
fi

# 4. Reiniciar servicio
echo "♻️  Reiniciando servicio..."
pm2 restart perfumeria-backend || npm run start:prod

echo "✅ Deployment completado"
```

### `setup-new-client.sh` (para clientes nuevos)

```bash
#!/bin/bash
# Setup para un cliente completamente nuevo

echo "🎯 Configurando nuevo cliente..."

# 1. Verificar .env
if [ ! -f .env ]; then
  echo "❌ Falta archivo .env"
  exit 1
fi

# 2. Aplicar migraciones (desde cero)
echo "📦 Creando schema de BD..."
npx prisma migrate deploy

# 3. Seed inicial (usuarios, roles, etc.)
echo "🌱 Cargando datos iniciales..."
npx prisma db seed

# 4. Generar Prisma Client
echo "🔄 Generando Prisma Client..."
npx prisma generate

# 5. Build
echo "🔨 Compilando..."
npm run build

# 6. Iniciar
echo "🚀 Iniciando aplicación..."
pm2 start ecosystem.config.js

echo "✅ Cliente configurado y listo"
```

---

## 📝 Actualizar package.json

Agrega estos scripts a tu `package.json`:

```json
{
  "scripts": {
    "migrate:dev": "prisma migrate dev",
    "migrate:deploy": "prisma migrate deploy",
    "migrate:status": "prisma migrate status",
    "migrate:resolve": "prisma migrate resolve",
    "deploy": "prisma migrate deploy && npm run build && pm2 restart perfumeria-backend",
    "deploy:new": "prisma migrate deploy && npm run build && npm run start:prod",
    "setup:existing": "prisma migrate resolve --applied 20251025161155_baseline_complete_schema && prisma generate",
    "setup:new": "prisma migrate deploy && prisma db seed && npm run build"
  }
}
```

---

## ✅ Ventajas de Este Sistema

### ✅ **Automático**
- No más scripts SQL manuales
- No más errores humanos
- Consistencia garantizada

### ✅ **Versionado**
- Cada cambio tiene su migración
- Historial completo en Git
- Rollback posible

### ✅ **Multi-Cliente**
- Mismo código para todos
- Cada cliente se actualiza independientemente
- Sin conflictos entre versiones

### ✅ **Seguro**
- Prisma verifica antes de aplicar
- Transaccional (rollback automático si falla)
- No duplica migraciones

---

## 🎯 Checklist para Cada Cliente

```
☐ 1. Configurar DATABASE_URL en .env
☐ 2. ¿BD existente o nueva?
    ☐ Existente → npx prisma migrate resolve --applied 20251025161155_baseline_complete_schema
    ☐ Nueva → Ir directo al paso 3
☐ 3. npx prisma migrate deploy
☐ 4. npx prisma generate
☐ 5. npm run build
☐ 6. npm run start:prod
☐ 7. Verificar funcionamiento
```

---

## 🆘 Troubleshooting

### "Migration already applied"
✅ **Normal** - Significa que la migración ya se aplicó, continúa con el deploy.

### "Migration failed"
❌ **Revisar:**
1. Credenciales de BD correctas
2. Permisos de usuario (CREATE, ALTER)
3. Logs de PostgreSQL

### "Drift detected"
⚠️ **Significa:** La BD tiene cambios que no están en las migraciones.

**Solución:**
```bash
# Opción 1: Ejecutar sync-production-safe.sql una vez
# Luego:
npx prisma migrate resolve --applied 20251025161155_baseline_complete_schema

# Opción 2: Reset (CUIDADO: borra datos)
npx prisma migrate reset
```

---

## 📊 Comparación: Antes vs Ahora

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| Deployment | Manual, SQL scripts | `npx prisma migrate deploy` |
| Nuevos clientes | Ejecutar múltiples scripts | Un comando |
| Consistencia | Depende de ejecución manual | Garantizada |
| Historial | Archivos SQL sueltos | Git + Migrations |
| Rollback | Complicado | `prisma migrate resolve` |
| Multi-cliente | Ejecutar en cada uno | Automatizado |

---

## 🎉 Resumen

**Para tus clientes existentes (UNA SOLA VEZ):**
```bash
npx prisma migrate resolve --applied 20251025161155_baseline_complete_schema
```

**Para nuevos clientes:**
```bash
npx prisma migrate deploy
```

**Para futuros cambios:**
```bash
# Desarrollo
npx prisma migrate dev --name nombre_cambio

# Producción (todos los clientes)
npx prisma migrate deploy
```

**¡Ya no necesitas tocar SQL manualmente nunca más!** 🎉

---

**Versión:** 1.0  
**Fecha:** 2025-10-25  
**Estado:** ✅ Sistema de migraciones activo

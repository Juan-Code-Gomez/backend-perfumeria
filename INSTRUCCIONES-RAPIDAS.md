# ============================================
# INSTRUCCIONES DE USO
# ============================================

## 🎯 OPCIÓN 1: Aplicar Fix en las 3 Bases de Datos Actuales

### Paso 1: Configurar las URLs
Edita el archivo `.env` y agrega las URLs de tus 3 bases de datos de Railway:

```env
# Base de datos principal (ya configurada)
DATABASE_URL="postgresql://postgres:SJBYEwPzlxYkrgMupzDOWYTAUXICMCHT@shinkansen.proxy.rlwy.net:21931/railway"

# Las otras 3 bases de datos - REEMPLAZA CON TUS URLs REALES
DATABASE_URL_CLIENT_2="postgresql://usuario:password@host.railway.app:puerto/railway"
DATABASE_URL_CLIENT_3="postgresql://usuario:password@host.railway.app:puerto/railway"
DATABASE_URL_CLIENT_4="postgresql://usuario:password@host.railway.app:puerto/railway"
```

### Paso 2: Ejecutar el script
```bash
node apply-fix-multi-db.js
```

El script aplicará automáticamente el fix en las 4 bases de datos.

---

## 🎯 OPCIÓN 2: Aplicar Fix Base por Base desde Railway

Si prefieres hacerlo manualmente en cada base de datos:

### 1. Entra al Dashboard de Railway
2. Selecciona el servicio PostgreSQL
3. Ve a la pestaña "Query" o "Data"
4. Copia y pega el contenido completo de `fix-all-missing-columns.sql`
5. Ejecuta el script

Repite para cada una de las 3 bases de datos.

---

## 🎯 OPCIÓN 3: Para Nuevos Clientes (Prevención)

Cuando despliegues un nuevo cliente en Railway:

### Método A: Script de Setup
```bash
node setup-new-client.js
```

### Método B: Comando Manual
```bash
npx prisma migrate deploy
npx prisma db execute --file=./fix-all-missing-columns.sql --schema=./prisma/schema.prisma
npx prisma generate
```

### Método C: Agregar al package.json
```json
{
  "scripts": {
    "setup:client": "node setup-new-client.js",
    "migrate:safe": "prisma migrate deploy && prisma db execute --file=./fix-all-missing-columns.sql --schema=./prisma/schema.prisma"
  }
}
```

Luego ejecuta:
```bash
npm run setup:client
```

---

## ✅ Verificación

Después de aplicar el fix, verifica que funciona:

### Localmente (conectado a producción):
```bash
node test-dashboard-debug.js
```

### En producción (desde navegador o Postman):
```
GET https://tu-backend.railway.app/api/dashboard/debug
GET https://tu-backend.railway.app/api/invoices/debug
```

Ambos deben retornar status 200 sin errores.

---

## 📁 Archivos Incluidos

| Archivo | Propósito |
|---------|-----------|
| `fix-all-missing-columns.sql` | Script SQL con todos los fixes |
| `apply-fix-multi-db.js` | Aplicar en múltiples BDs automáticamente |
| `setup-new-client.js` | Inicializar un cliente nuevo completo |
| `GUIA-FIX-MULTI-DB.md` | Documentación completa |
| `INSTRUCCIONES-RAPIDAS.md` | Este archivo |

---

## 🚨 Importante

- ✅ El script SQL es **idempotente** (se puede ejecutar múltiples veces sin problemas)
- ✅ Usa `ADD COLUMN IF NOT EXISTS` (no da error si la columna ya existe)
- ✅ Incluye verificación automática al final
- ✅ No borra ni modifica datos existentes

---

## 📞 Soporte

Si tienes problemas:
1. Verifica que las URLs de las bases de datos sean correctas
2. Verifica que las bases de datos estén activas en Railway
3. Revisa los logs del script para ver el error específico

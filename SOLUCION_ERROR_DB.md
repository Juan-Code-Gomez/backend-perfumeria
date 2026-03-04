# 🚨 SOLUCIÓN URGENTE: Error de Base de Datos en Clientes

## ❌ Error Actual

```
The column `company_config.useFifoInventory` does not exist in the current database.
```

**Causa:** El código nuevo se desplegó con cambios en el schema de Prisma, pero las bases de datos NO tienen el nuevo campo.

---

## ✅ SOLUCIÓN INMEDIATA (Aplicar YA)

### Opción 1: Railway CLI - Aplicar a Cada Cliente (RECOMENDADO)

Para cada proyecto de cliente en Railway:

```bash
# 1. Conectar al proyecto del cliente
railway link

# 2. Aplicar auto-migración
railway run node auto-migrate.js

# 3. Reiniciar el servicio
railway restart
```

### Opción 2: Reiniciar con Auto-Migrate (Después de subir cambios)

Si ya subiste los cambios de package.json y auto-migrate.js:

```bash
# Para cada cliente
railway link [project-id]
railway restart
```

El auto-migrate se ejecutará automáticamente al iniciar.

### Opción 3: SQL Directo

```bash
railway link [project-id]
railway run psql $DATABASE_URL
```

Luego ejecutar:
```sql
ALTER TABLE company_config 
ADD COLUMN IF NOT EXISTS "useFifoInventory" BOOLEAN NOT NULL DEFAULT true;
```

---

## 🛡️ SOLUCIÓN PERMANENTE (Ya Implementada)

He creado un sistema automático de migraciones que previene este problema en el futuro:

### 1. Auto-Migrate System

**Archivo:** `auto-migrate.js`

- Se ejecuta automáticamente en cada deploy
- Verifica qué migraciones faltan
- Las aplica antes de iniciar el servidor
- Es **idempotente** (seguro ejecutar múltiples veces)
- NO rompe el deploy si algo falla

### 2. Package.json Actualizado

Los siguientes comandos ahora incluyen auto-migrate:
```json
{
  "start:prod": "node pre-start.js",
  "railway:start": "node auto-migrate.js && node dist/src/main.js",
  "railway:start:production": "node auto-migrate.js && node dist/src/main.js"
}
```

### 3. Cómo Agregar Nuevas Migraciones

Cuando agregues un nuevo campo al schema en el futuro:

**Paso 1:** Edita `auto-migrate.js` y agrega la nueva migración:

```javascript
const migrations = [
  // ... migraciones existentes ...
  {
    name: 'add_newField',
    description: 'Agregar nuevo campo',
    check: async (prisma) => {
      try {
        await prisma.$queryRaw`SELECT "newField" FROM table_name LIMIT 1`;
        return true;
      } catch {
        return false;
      }
    },
    apply: async (prisma) => {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE table_name 
        ADD COLUMN IF NOT EXISTS "newField" TYPE DEFAULT value;
      `);
      console.log('   ✅ Campo newField agregado');
    }
  }
];
```

**Paso 2:** Commit y push. La migración se aplicará automáticamente en el próximo deploy.

---

## 🔄 FLUJO DE TRABAJO CORRECTO

### ❌ Antes (Causaba errores):
```
1. Modificar schema.prisma
2. Commit y push
3. Railway hace deploy
4. ❌ Error: campo no existe
5. Aplicar migración manualmente
```

### ✅ Ahora (Automático):
```
1. Modificar schema.prisma
2. Agregar migración a auto-migrate.js
3. Commit y push
4. Railway hace deploy
5. ✅ Auto-migrate aplica cambios
6. ✅ Servidor inicia sin errores
```

---

## 📋 CHECKLIST PARA FUTURAS MIGRACIONES

Cuando agregues cambios al schema:

- [ ] Modificar `prisma/schema.prisma`
- [ ] Agregar migración a `auto-migrate.js`
- [ ] Crear script SQL en caso de emergencia (`add-[feature].sql`)
- [ ] Probar localmente: `node auto-migrate.js`
- [ ] Commit y push
- [ ] Verificar logs de Railway: debe decir "✅ Migración aplicada"

---

## 🔍 VERIFICAR QUE FUNCIONA

Después de aplicar la solución, verifica los logs de Railway:

```
🔄 Ejecutando auto-migraciones...

✅ Conexión a base de datos exitosa

📝 Verificando: add_useFifoInventory
   Descripción: Agregar campo useFifoInventory a company_config
   🔧 Aplicando migración...
   ✅ Campo useFifoInventory agregado
   ✅ Migración aplicada exitosamente

════════════════════════════════════════════════════════════
📊 RESUMEN DE AUTO-MIGRACIONES
════════════════════════════════════════════════════════════
✅ Aplicadas:  1
⏭️  Saltadas:   0
📝 Total:      1
════════════════════════════════════════════════════════════
✅ Sistema listo para iniciar

[Nest] 123  - 03/04/2026, 3:05:00 AM     LOG [NestFactory] Starting Nest application...
```

---

## 🆘 SI AÚN HAY PROBLEMAS

1. **Verificar que el campo existe:**
   ```bash
   railway run psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'company_config' AND column_name = 'useFifoInventory';"
   ```

2. **Aplicar manualmente:**
   ```bash
   railway run node apply-fifo-config-multi-db.js
   ```

3. **Logs detallados:**
   ```bash
   railway logs
   ```

---

## 📞 RESUMEN DE COMANDOS DE EMERGENCIA

### Para un solo cliente:
```bash
railway link
railway run node auto-migrate.js
railway restart
```

### Para todos los clientes (con .env configurado):
```bash
cd backend-perfumeria
node apply-fifo-config-multi-db.js
```

---

## 💡 VENTAJAS DEL NUEVO SISTEMA

✅ **Automático:** Las migraciones se aplican en cada deploy  
✅ **Seguro:** Verifica antes de aplicar  
✅ **Idempotente:** Seguro ejecutar múltiples veces  
✅ **No-bloqueante:** Si falla, el servidor sigue iniciando  
✅ **Multi-cliente:** Funciona con múltiples bases de datos  
✅ **Traceable:** Logs claros de qué se aplicó  

---

**Fecha:** 2026-03-04  
**Última actualización:** Sistema auto-migrate implementado

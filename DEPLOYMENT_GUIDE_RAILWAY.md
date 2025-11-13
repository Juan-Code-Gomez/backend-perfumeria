# 🚀 GUÍA DE DESPLIEGUE A PRODUCCIÓN - RAILWAY
## Mejoras en Sistema de Cierre de Caja

### 📋 RESUMEN DE CAMBIOS

**Problema resuelto:** El sistema no permitía registrar múltiples cierres de caja en el mismo día debido a constraints únicos en la base de datos.

**Solución implementada:**
- ✅ Eliminados constraints únicos de `CashSession(date, isActive)`
- ✅ Eliminado constraint único de `CashClosing.date`
- ✅ Ahora se permite múltiples sesiones y cierres por día
- ✅ Cada cierre tiene timestamp único con fecha y hora
- ✅ Mejorada la UI con tabla mostrando todos los cierres del día

---

## 🔧 PASOS DE DESPLIEGUE

### PASO 1: Preparar la Base de Datos de Producción ⚠️

**IMPORTANTE: Este paso debe ejecutarse ANTES de desplegar el código**

#### Opción A: Usando el Script Automatizado (RECOMENDADO)

1. **Obtener la URL de conexión de Railway:**
   - Ve a tu proyecto en Railway
   - Click en tu base de datos PostgreSQL
   - Copia la `DATABASE_URL` (Connection String)

2. **Ejecutar el script de migración:**
   ```powershell
   # En PowerShell (Windows)
   cd "d:\Proyecto Milan\codigo\backend-perfumeria"
   
   # Establecer la URL de la base de datos
   $env:DATABASE_URL = "postgresql://postgres:TU_PASSWORD@RAILWAY_HOST:PORT/railway"
   
   # Ejecutar el script
   node scripts/production-migration-remove-constraints.js
   ```

3. **Verificar que el script completó exitosamente:**
   - Debe mostrar: "✅ ¡Migración completada exitosamente!"
   - Debe mostrar: "✅ Todos los constraints problemáticos fueron eliminados"

#### Opción B: Ejecución Manual desde Railway Dashboard

Si prefieres ejecutar SQL directamente en Railway:

1. **Conectarse a la base de datos:**
   - En Railway, abre el servicio de PostgreSQL
   - Click en "Data" o "Query"

2. **Ejecutar estos comandos SQL:**
   ```sql
   -- Verificar constraints existentes
   SELECT conname, pg_get_constraintdef(oid) as definition
   FROM pg_constraint
   WHERE conrelid IN ('"CashSession"'::regclass, '"CashClosing"'::regclass)
     AND contype = 'u'
     AND (conname LIKE '%date%' OR conname LIKE '%isActive%');

   -- Eliminar constraints de CashSession
   ALTER TABLE "CashSession" DROP CONSTRAINT IF EXISTS "CashSession_date_isActive_key";
   ALTER TABLE "CashSession" DROP CONSTRAINT IF EXISTS "unique_active_session_per_date";

   -- Eliminar constraints de CashClosing
   ALTER TABLE "CashClosing" DROP CONSTRAINT IF EXISTS "CashClosing_date_key";

   -- Verificación final
   SELECT conname 
   FROM pg_constraint
   WHERE conrelid IN ('"CashSession"'::regclass, '"CashClosing"'::regclass)
     AND contype = 'u'
     AND (conname LIKE '%date%' OR conname LIKE '%isActive%');
   
   -- Si no devuelve filas, ¡la migración fue exitosa!
   ```

---

### PASO 2: Actualizar el Schema de Prisma

Ya está actualizado en el código, pero verifica que `prisma/schema.prisma` tenga:

```prisma
model CashSession {
  // ... otros campos ...
  
  @@index([date, sessionNumber])
  @@index([isActive])
  // ❌ NO debe tener: @@unique([date, isActive])
}

model CashClosing {
  id            Int          @id @default(autoincrement())
  date          DateTime     // ❌ NO debe tener: @unique
  // ... otros campos ...
}
```

---

### PASO 3: Desplegar Backend a Railway

1. **Commit y push de los cambios:**
   ```powershell
   cd "d:\Proyecto Milan\codigo\backend-perfumeria"
   
   git add .
   git commit -m "feat: permitir múltiples cierres de caja por día - eliminar constraints únicos"
   git push origin main
   ```

2. **Railway desplegará automáticamente** (si tienes auto-deploy configurado)
   - Verifica en Railway que el despliegue inicie
   - Espera a que el build complete exitosamente

3. **Verificar que Prisma genere correctamente:**
   - En los logs de Railway, busca: "✔ Generated Prisma Client"
   - No debe haber errores de Prisma

---

### PASO 4: Desplegar Frontend

1. **Commit y push de los cambios del frontend:**
   ```powershell
   cd "d:\Proyecto Milan\codigo\perfumeria-sistema"
   
   git add .
   git commit -m "feat: UI mejorada para múltiples cierres por día con botón PDF"
   git push origin main
   ```

2. **Vercel/Railway desplegará automáticamente**
   - Espera a que el build complete

---

### PASO 5: Pruebas en Producción

Una vez desplegado, realiza estas pruebas:

1. **✅ Abrir sesión de caja**
   - Verifica que se puede abrir la caja correctamente

2. **✅ Registrar primer cierre**
   - Realiza un cierre de caja normal
   - Verifica que se crea el cierre
   - Verifica que la sesión se cierra correctamente

3. **✅ Abrir nueva sesión el mismo día**
   - Abre la caja nuevamente
   - Verifica que NO arroja error de "unique constraint"

4. **✅ Registrar segundo cierre del mismo día**
   - Realiza otro cierre de caja
   - Verifica que se registra exitosamente
   - Verifica que ambos cierres aparecen en la tabla

5. **✅ Descargar PDF de un cierre**
   - Click en el botón PDF de cualquier cierre
   - Verifica que el PDF se descarga correctamente

---

## 🔒 ROLLBACK (Por si algo sale mal)

Si necesitas revertir los cambios:

### Opción 1: Revertir código (RECOMENDADO)

```powershell
# Backend
cd "d:\Proyecto Milan\codigo\backend-perfumeria"
git revert HEAD
git push origin main

# Frontend
cd "d:\Proyecto Milan\codigo\perfumeria-sistema"
git revert HEAD
git push origin main
```

### Opción 2: Restaurar constraints (NO RECOMENDADO)

Solo si realmente necesitas volver al comportamiento anterior:

```sql
-- Restaurar constraint en CashSession
ALTER TABLE "CashSession" 
ADD CONSTRAINT "CashSession_date_isActive_key" 
UNIQUE ("date", "isActive");

-- Restaurar constraint en CashClosing
ALTER TABLE "CashClosing" 
ADD CONSTRAINT "CashClosing_date_key" 
UNIQUE ("date");
```

---

## 📊 MONITOREO POST-DESPLIEGUE

Cosas a monitorear las primeras 24-48 horas:

1. **Logs de errores en Railway:**
   - Busca errores relacionados con "unique constraint"
   - Busca errores en `/api/cash-session/close`
   - Busca errores en `/api/cash-closing`

2. **Reportes de usuarios:**
   - Pregunta si pueden hacer múltiples cierres sin problemas
   - Verifica que los PDFs se generan correctamente

3. **Performance:**
   - Verifica que las consultas no se hayan ralentizado
   - Los índices en `date` y `sessionNumber` deben mantener la performance

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error: "Unique constraint failed"
**Causa:** El script de migración no se ejecutó correctamente en producción
**Solución:** Ejecutar PASO 1 nuevamente

### Error: "Prisma Client validation error"
**Causa:** El Prisma Client no se regeneró correctamente
**Solución:** 
```bash
# En Railway, forzar rebuild:
# Settings > Deploy > Redeploy
```

### Error al cerrar sesión: "Cannot update CashSession"
**Causa:** Código anterior desplegado antes de migrar DB
**Solución:** Ejecutar PASO 1, luego forzar redeploy del backend

### PDFs no se descargan
**Causa:** Endpoint no accesible o error en el servicio
**Solución:** 
- Verificar logs de Railway
- Verificar que el servicio `cash-closing-report.service.ts` esté funcionando
- Probar endpoint manualmente: `GET /api/cash-closing/report/pdf/2025-11-13`

---

## ✅ CHECKLIST DE DESPLIEGUE

Usa esta lista para verificar cada paso:

- [ ] PASO 1.A - Script de migración ejecutado exitosamente
- [ ] PASO 1.B - Constraints eliminados (verificado con query)
- [ ] PASO 2 - Schema de Prisma verificado (sin @@unique)
- [ ] PASO 3 - Backend desplegado en Railway
- [ ] PASO 3 - Build completado sin errores
- [ ] PASO 3 - Prisma Client generado correctamente
- [ ] PASO 4 - Frontend desplegado
- [ ] PASO 4 - Build completado sin errores
- [ ] PASO 5.1 - Prueba: Abrir sesión ✓
- [ ] PASO 5.2 - Prueba: Primer cierre del día ✓
- [ ] PASO 5.3 - Prueba: Segunda sesión mismo día ✓
- [ ] PASO 5.4 - Prueba: Segundo cierre mismo día ✓
- [ ] PASO 5.5 - Prueba: Descarga de PDF ✓
- [ ] Monitoreo - Logs revisados (sin errores)
- [ ] Monitoreo - Usuarios probando exitosamente

---

## 📞 CONTACTO DE SOPORTE

Si encuentras algún problema durante el despliegue:

1. Revisa los logs de Railway primero
2. Verifica que PASO 1 se completó exitosamente
3. Prueba el endpoint manualmente con Postman/Insomnia
4. Revisa esta guía nuevamente

---

## 📝 NOTAS ADICIONALES

- **No hay riesgo de pérdida de datos:** Este cambio solo elimina restricciones, no modifica datos existentes
- **Compatible con datos antiguos:** Los cierres anteriores seguirán funcionando normalmente
- **Mejora operativa:** Ahora los usuarios pueden tener múltiples turnos por día
- **Rendimiento:** Los índices se mantienen, no hay degradación de performance

---

**Fecha de creación:** 13 de Noviembre, 2025
**Versión:** 1.0
**Autor:** Sistema de Cierre de Caja - Proyecto Milan

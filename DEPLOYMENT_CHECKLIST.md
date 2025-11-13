# ✅ CHECKLIST DE DESPLIEGUE - CIERRE DE CAJA MÚLTIPLE

## ANTES DE EMPEZAR
- [ ] Tengo acceso a Railway Dashboard
- [ ] Tengo acceso al repositorio de Git
- [ ] Hice backup de la base de datos (opcional pero recomendado)
- [ ] Avisé a usuarios que habrá mantenimiento breve

---

## PASO 1: MIGRAR BASE DE DATOS (15 minutos)

### Opción Rápida - Script Automatizado
- [ ] 1.1. Abrir Railway > PostgreSQL > Connect
- [ ] 1.2. Copiar la "Postgres Connection URL"
- [ ] 1.3. Abrir `migrate-production.ps1`
- [ ] 1.4. Pegar la URL en línea 10 (reemplazar "TU_URL_AQUI")
- [ ] 1.5. Guardar el archivo
- [ ] 1.6. Ejecutar: `.\migrate-production.ps1`
- [ ] 1.7. Verificar mensaje: "✅ ¡Migración completada!"

### Alternativa - SQL Manual en Railway
- [ ] 1.1. Railway > PostgreSQL > Query
- [ ] 1.2. Ejecutar:
```sql
ALTER TABLE "CashSession" DROP CONSTRAINT IF EXISTS "CashSession_date_isActive_key";
ALTER TABLE "CashClosing" DROP CONSTRAINT IF EXISTS "CashClosing_date_key";
```
- [ ] 1.3. Verificar que no hay errores

**⚠️ NO CONTINUAR si este paso falló**

---

## PASO 2: DESPLEGAR BACKEND (10 minutos)

- [ ] 2.1. Abrir PowerShell en carpeta backend
- [ ] 2.2. Ejecutar: `git status` (ver cambios pendientes)
- [ ] 2.3. Ejecutar: `git add .`
- [ ] 2.4. Ejecutar: `git commit -m "feat: permitir múltiples cierres de caja por día"`
- [ ] 2.5. Ejecutar: `git push origin main`
- [ ] 2.6. Abrir Railway Dashboard
- [ ] 2.7. Verificar que el deployment inició automáticamente
- [ ] 2.8. Esperar a ver: "✅ Deploy successful"
- [ ] 2.9. Ver logs y verificar: "✔ Generated Prisma Client"

**⚠️ Si el deploy falla, revisar logs y corregir**

---

## PASO 3: DESPLEGAR FRONTEND (10 minutos)

- [ ] 3.1. Abrir PowerShell en carpeta frontend
- [ ] 3.2. Ejecutar: `git status`
- [ ] 3.3. Ejecutar: `git add .`
- [ ] 3.4. Ejecutar: `git commit -m "feat: UI mejorada para múltiples cierres con botón PDF"`
- [ ] 3.5. Ejecutar: `git push origin main`
- [ ] 3.6. Verificar deployment en Vercel/Railway
- [ ] 3.7. Esperar a ver: "✅ Build successful"

---

## PASO 4: VERIFICAR EN PRODUCCIÓN (15 minutos)

### Test 1: Abrir Sesión
- [ ] 4.1. Ir a la app en producción
- [ ] 4.2. Ir a "Cierres de Caja"
- [ ] 4.3. Click en "Abrir Caja"
- [ ] 4.4. Ingresar saldo inicial (ej: $100,000)
- [ ] 4.5. Click "Abrir Sesión"
- [ ] 4.6. Verificar: Alert verde "🔓 Caja Abierta"

### Test 2: Primer Cierre del Día
- [ ] 4.7. Click en "Registrar Cierre"
- [ ] 4.8. Ingresar saldo final (ej: $150,000)
- [ ] 4.9. Click "Completar Cierre de Caja"
- [ ] 4.10. Verificar: Mensaje "Cierre registrado correctamente"
- [ ] 4.11. Verificar: El cierre aparece en la tabla

### Test 3: Segunda Sesión Mismo Día ⭐ (LO NUEVO)
- [ ] 4.12. Click en "Abrir Caja" nuevamente
- [ ] 4.13. Ingresar saldo inicial (ej: $150,000)
- [ ] 4.14. Click "Abrir Sesión"
- [ ] 4.15. ✅ VERIFICAR: NO aparece error "unique constraint"
- [ ] 4.16. Verificar: Alert verde "🔓 Caja Abierta"

### Test 4: Segundo Cierre Mismo Día ⭐ (LO NUEVO)
- [ ] 4.17. Click en "Registrar Cierre"
- [ ] 4.18. Ingresar saldo final (ej: $200,000)
- [ ] 4.19. Click "Completar Cierre de Caja"
- [ ] 4.20. ✅ VERIFICAR: NO aparece error "unique constraint"
- [ ] 4.21. Verificar: Mensaje "Cierre registrado correctamente"
- [ ] 4.22. ✅ VERIFICAR: Ahora hay 2 cierres en la tabla del mismo día

### Test 5: Descargar PDF ⭐ (LO NUEVO)
- [ ] 4.23. En la tabla de cierres, buscar columna "🔧 Acciones"
- [ ] 4.24. Click en el botón PDF de cualquier cierre
- [ ] 4.25. ✅ VERIFICAR: El PDF se descarga automáticamente
- [ ] 4.26. Abrir el PDF y verificar que tiene todos los datos

---

## PASO 5: MONITOREO (24-48 horas)

### Primeras 2 horas
- [ ] 5.1. Revisar logs de Railway cada 30 minutos
- [ ] 5.2. Buscar errores relacionados con "constraint"
- [ ] 5.3. Buscar errores en endpoints `/cash-session` y `/cash-closing`

### Primer día
- [ ] 5.4. Preguntar a usuarios si todo funciona bien
- [ ] 5.5. Verificar que pueden hacer múltiples cierres
- [ ] 5.6. Verificar que los PDFs se generan correctamente

### Segundo día
- [ ] 5.7. Revisar métricas de uso
- [ ] 5.8. Verificar que no hay degradación de performance
- [ ] 5.9. Confirmar que no hay quejas de usuarios

---

## ✅ RESULTADO ESPERADO

Después de completar todos los pasos:

✅ Los usuarios pueden abrir y cerrar la caja múltiples veces al día
✅ No aparecen errores de "unique constraint"
✅ Cada cierre se muestra en la tabla con fecha y hora
✅ Los PDFs se descargan correctamente desde la tabla
✅ El sistema es más flexible para múltiples turnos

---

## 🆘 SI ALGO SALE MAL

### Error en PASO 1 (Migración DB)
➡️ Revisar la URL de conexión
➡️ Verificar que tienes permisos en Railway
➡️ Intentar con opción SQL manual

### Error en PASO 2 (Deploy Backend)
➡️ Revisar logs de Railway
➡️ Verificar que el build completó
➡️ Buscar error específico en logs

### Error en PASO 4 (Tests)
Si aparece "unique constraint" en Test 3 o 4:
➡️ La migración no se aplicó correctamente
➡️ Volver a PASO 1
➡️ Usar opción SQL manual

### Rollback Completo
Si necesitas revertir TODOS los cambios:
```powershell
# Backend
git revert HEAD
git push origin main

# Frontend  
git revert HEAD
git push origin main
```

---

## 📞 AYUDA

- Guía completa: Ver `DEPLOYMENT_GUIDE_RAILWAY.md`
- Script de verificación: `verify-production-deployment.js`
- Logs de Railway: Railway Dashboard > Deployments > View Logs

---

**Fecha:** 13 Nov 2025
**Duración estimada:** 45-60 minutos
**Riesgo:** ⚠️ BAJO (no hay pérdida de datos)

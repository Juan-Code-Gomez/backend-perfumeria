# 📚 GUÍA DE ARCHIVOS DE DESPLIEGUE

Este directorio contiene varios archivos para ayudarte a desplegar los cambios del sistema de cierre de caja a producción en Railway. Aquí te explico cuál usar según tu situación.

---

## 🎯 ¿POR DÓNDE EMPIEZO?

### Si es tu primera vez desplegando:
👉 **Empieza aquí:** `DESPLIEGUE_RESUMEN.md`
- Resumen ejecutivo de 5 minutos
- Te dice exactamente qué hacer
- Versión simplificada

### Si quieres una guía paso a paso:
👉 **Usa esto:** `DEPLOYMENT_CHECKLIST.md`
- Lista de verificación completa
- Marca cada paso mientras avanzas
- Incluye troubleshooting básico

### Si necesitas todos los detalles:
👉 **Lee esto:** `DEPLOYMENT_GUIDE_RAILWAY.md`
- Guía completa y detallada
- Explica el porqué de cada paso
- Incluye troubleshooting avanzado
- Instrucciones de rollback

---

## 📂 DESCRIPCIÓN DE ARCHIVOS

### Documentos de Guía

| Archivo | Nivel | Cuándo usar |
|---------|-------|-------------|
| `DESPLIEGUE_RESUMEN.md` | ⭐ Básico | Primera vez o referencia rápida |
| `DEPLOYMENT_CHECKLIST.md` | ⭐⭐ Intermedio | Cuando despliegas siguiendo pasos |
| `DEPLOYMENT_GUIDE_RAILWAY.md` | ⭐⭐⭐ Avanzado | Cuando necesitas detalles completos |
| `SQL_EMERGENCY_COMMANDS.md` | 🆘 Emergencia | Cuando algo sale mal con la BD |
| `README_DEPLOYMENT.md` | 📚 Referencia | Este archivo - índice de todo |

### Scripts de Migración

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `migrate-production.ps1` | PowerShell | Script rápido - editar URL y ejecutar |
| `production-migration-remove-constraints.js` | Node.js | Script completo con validaciones |
| `verify-production-deployment.js` | Node.js | Verificar que todo funcionó |
| `clean-and-fix-cash-tables.js` | Node.js | Usado en desarrollo (no en prod) |

---

## 🚀 FLUJOS DE TRABAJO

### Flujo Rápido (30 min) - Recomendado

```
1. Lee: DESPLIEGUE_RESUMEN.md
2. Ejecuta: migrate-production.ps1
3. Haz: git push (backend)
4. Haz: git push (frontend)
5. Ejecuta: verify-production-deployment.js
```

### Flujo Completo (60 min) - Primera Vez

```
1. Lee: DEPLOYMENT_GUIDE_RAILWAY.md
2. Sigue: DEPLOYMENT_CHECKLIST.md
3. Ejecuta: production-migration-remove-constraints.js
4. Despliega: Backend
5. Despliega: Frontend
6. Verifica: verify-production-deployment.js
7. Monitorea: Logs de Railway por 24h
```

### Flujo de Emergencia - Algo salió mal

```
1. Revisa: Logs de Railway
2. Consulta: SQL_EMERGENCY_COMMANDS.md
3. Si persiste: DEPLOYMENT_GUIDE_RAILWAY.md (sección Rollback)
```

---

## 📖 GUÍA DE USO POR SITUACIÓN

### Situación 1: "Nunca he desplegado a Railway"
```
1. DESPLIEGUE_RESUMEN.md          - Leer completo
2. DEPLOYMENT_CHECKLIST.md        - Seguir paso a paso
3. migrate-production.ps1         - Ejecutar
4. verify-production-deployment.js - Verificar
```

### Situación 2: "Ya he desplegado antes"
```
1. DESPLIEGUE_RESUMEN.md          - Referencia rápida
2. migrate-production.ps1         - Ejecutar
3. git push                       - Desplegar
```

### Situación 3: "Algo salió mal durante el despliegue"
```
1. Logs de Railway                - Ver error exacto
2. DEPLOYMENT_GUIDE_RAILWAY.md    - Sección troubleshooting
3. SQL_EMERGENCY_COMMANDS.md      - Si es error de BD
```

### Situación 4: "Necesito hacer rollback"
```
1. DEPLOYMENT_GUIDE_RAILWAY.md    - Sección "Rollback"
2. git revert HEAD                - Revertir código
3. SQL_EMERGENCY_COMMANDS.md      - Si necesitas restaurar BD
```

---

## 🔧 SCRIPTS - CUÁNDO USAR CADA UNO

### `migrate-production.ps1` ⭐ Recomendado
**Cuándo:** Migración normal a producción
**Cómo:**
```powershell
# 1. Edita el archivo y pega la URL de Railway
# 2. Ejecuta:
.\migrate-production.ps1
```
**Ventajas:** Simple, rápido, fácil de usar

### `production-migration-remove-constraints.js`
**Cuándo:** Necesitas más control o información detallada
**Cómo:**
```powershell
$env:DATABASE_URL = "postgresql://..."
node scripts/production-migration-remove-constraints.js
```
**Ventajas:** Más verbose, muestra todo el proceso

### `verify-production-deployment.js`
**Cuándo:** DESPUÉS de desplegar, para verificar
**Cómo:**
```powershell
$env:DATABASE_URL = "postgresql://..."
node scripts/verify-production-deployment.js
```
**Ventajas:** Detecta problemas antes que los usuarios

### `clean-and-fix-cash-tables.js`
**Cuándo:** SOLO en desarrollo local
**Cómo:** No usar en producción
**Ventajas:** Limpia datos de prueba

---

## ⚠️ ADVERTENCIAS IMPORTANTES

### ❌ NO HACER:
- No ejecutar `clean-and-fix-cash-tables.js` en producción (elimina datos)
- No modificar SQL_EMERGENCY_COMMANDS.md sin entender bien SQL
- No saltarte PASO 1 (migración de BD) - causará errores
- No desplegar sin leer al menos DESPLIEGUE_RESUMEN.md

### ✅ SÍ HACER:
- Leer DESPLIEGUE_RESUMEN.md primero
- Ejecutar migración ANTES de desplegar código
- Verificar con verify-production-deployment.js
- Monitorear logs después del despliegue
- Avisar a usuarios sobre el mantenimiento

---

## 📊 DIAGRAMA DE FLUJO

```
┌─────────────────────┐
│  ¿Primera vez?      │
└──────┬──────────────┘
       │
   ┌───┴───┐
   │  SÍ   │
   └───┬───┘
       │
       ├─→ Lee: DESPLIEGUE_RESUMEN.md
       ├─→ Sigue: DEPLOYMENT_CHECKLIST.md
       └─→ Ejecuta: Scripts en orden
   
   ┌───┴───┐
   │  NO   │
   └───┬───┘
       │
       ├─→ DESPLIEGUE_RESUMEN.md (repaso)
       ├─→ migrate-production.ps1
       └─→ git push

┌─────────────────────┐
│  Después del push   │
└──────┬──────────────┘
       │
       ├─→ Railway despliega auto
       ├─→ Espera "Deploy successful"
       └─→ Ejecuta: verify-production-deployment.js

┌─────────────────────┐
│  ¿Todo bien?        │
└──────┬──────────────┘
       │
   ┌───┴───┐
   │  SÍ   │──→ Prueba en producción ──→ ✅ Listo
   └───────┘
   
   ┌───┴───┐
   │  NO   │──→ SQL_EMERGENCY_COMMANDS.md ──→ Corrige
   └───────┘                                        │
       │                                            │
       └────────────────────────────────────────────┘
```

---

## 🎓 CONSEJOS

### Para principiantes:
1. Lee TODO el DESPLIEGUE_RESUMEN.md antes de empezar
2. Ten Railway abierto en otra pestaña
3. Ejecuta en ambiente de prueba primero si es posible
4. Haz el despliegue fuera de horario laboral

### Para experimentados:
1. DESPLIEGUE_RESUMEN.md es suficiente
2. Usa migrate-production.ps1 para rapidez
3. Monitorea logs durante las primeras 2 horas
4. Mantén SQL_EMERGENCY_COMMANDS.md a mano

### Para emergencias:
1. No entres en pánico
2. Revisa los logs primero
3. Consulta SQL_EMERGENCY_COMMANDS.md
4. Si no funciona, haz rollback (DEPLOYMENT_GUIDE_RAILWAY.md)

---

## 📞 RECURSOS ADICIONALES

- **Railway Docs:** https://docs.railway.app/
- **Prisma Docs:** https://www.prisma.io/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/

---

## ✅ CHECKLIST ULTRA-RÁPIDO

Si ya sabes qué hacer, esto es todo lo que necesitas:

- [ ] Lee DESPLIEGUE_RESUMEN.md
- [ ] Ejecuta migrate-production.ps1
- [ ] git push backend
- [ ] git push frontend  
- [ ] Ejecuta verify-production-deployment.js
- [ ] Prueba en producción
- [ ] Monitorea logs 24h

---

**Última actualización:** 13 Nov 2025
**Mantenido por:** Equipo de Desarrollo - Proyecto Milan

---

## 🤝 CONTRIBUCIONES

Si encuentras algo confuso o crees que falta información:
1. Documenta el problema
2. Actualiza el archivo correspondiente
3. Haz commit con descripción clara

---

¡Buena suerte con tu despliegue! 🚀

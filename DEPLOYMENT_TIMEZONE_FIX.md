# 🚀 Guía de Despliegue - Fix de Zona Horaria

## 📋 Resumen de Cambios

Se implementó una solución robusta para el problema de desfase de fechas en Railway.

### ✅ Archivos Creados:
1. `src/common/utils/timezone.util.ts` - Utilidades de timezone
2. `TIMEZONE_FIX.md` - Documentación completa
3. `scripts/verify-timezone-fix.js` - Script de verificación
4. `scripts/fix-existing-dates.ts` - Script de corrección de datos (opcional)

### ✅ Archivos Modificados:
1. `src/expense/expense.service.ts` - Gastos
2. `src/sale/sale.service.ts` - Ventas
3. `src/purchase/purchase.service.ts` - Compras
4. `src/cash-closing/cash-closing.service.ts` - Cierres de caja

---

## 🔧 Pasos para Desplegar

### 1️⃣ **Verificar Cambios Localmente**

```bash
# Compilar el proyecto
npm run build

# Ejecutar tests de verificación (después de compilar)
node scripts/verify-timezone-fix.js

# Iniciar servidor en desarrollo
npm run start:dev

# Probar creación de gasto con fecha específica
# POST http://localhost:3000/api/expenses
# {
#   "date": "2024-10-15",
#   "amount": 50000,
#   "description": "Test timezone",
#   "category": "SERVICIOS",
#   "paymentMethod": "EFECTIVO"
# }
```

### 2️⃣ **Commit y Push**

```bash
# Agregar todos los cambios
git add .

# Commit con mensaje descriptivo
git commit -m "fix: Solucionar desfase de fechas por zona horaria en Railway

- Agregadas utilidades de timezone en src/common/utils/timezone.util.ts
- Actualizados servicios de gastos, ventas, compras y cierre de caja
- Documentación completa en TIMEZONE_FIX.md
- Scripts de verificación y corrección de datos"

# Push a Railway
git push origin main
```

### 3️⃣ **Configurar Variables en Railway** (Opcional pero Recomendado)

1. Ir a Railway Dashboard
2. Seleccionar el proyecto
3. Ir a **Variables**
4. Agregar:
   ```
   TZ=America/Bogota
   ```
5. Click en **Deploy** para aplicar cambios

### 4️⃣ **Verificar Deployment**

```bash
# Ver logs en Railway
railway logs --follow

# Buscar en los logs:
# - "🎯 Parsed date object"
# - Verificar que no hay errores de compilación
```

### 5️⃣ **Probar en Producción**

```bash
# Crear gasto de prueba
POST https://tu-app.railway.app/api/expenses
{
  "date": "2024-10-15",
  "amount": 50000,
  "description": "Test timezone producción",
  "category": "SERVICIOS",
  "paymentMethod": "EFECTIVO"
}

# Verificar que la fecha se guardó correctamente
GET https://tu-app.railway.app/api/expenses

# La fecha debe ser exactamente "2024-10-15", NO "2024-10-14"
```

---

## 🔄 Corrección de Datos Existentes (OPCIONAL)

Si ya tienes datos con fechas incorrectas:

```bash
# En Railway, conectarse al proyecto
railway link

# Ejecutar script de corrección
railway run npx ts-node scripts/fix-existing-dates.ts

# IMPORTANTE: Hacer backup de la BD antes
```

**⚠️ ADVERTENCIA**: Solo ejecuta esto si tienes datos con fechas incorrectas y DESPUÉS de hacer backup.

---

## ✅ Checklist Post-Deployment

- [ ] Código desplegado en Railway
- [ ] Variable `TZ=America/Bogota` configurada
- [ ] Crear gasto de prueba con fecha específica
- [ ] Verificar que la fecha se guarda correctamente
- [ ] Probar crear venta con fecha
- [ ] Probar crear compra con fecha
- [ ] Probar filtros por rango de fechas
- [ ] Verificar dashboard ejecutivo
- [ ] Verificar reportes financieros

---

## 🧪 Casos de Prueba

### Test 1: Crear Gasto
```json
POST /api/expenses
{
  "date": "2024-10-15",
  "amount": 50000,
  "description": "Test fecha",
  "category": "SERVICIOS",
  "paymentMethod": "EFECTIVO"
}
```
✅ **Esperado**: Fecha guardada = 2024-10-15

### Test 2: Filtrar Gastos por Rango
```http
GET /api/expenses?dateFrom=2024-10-01&dateTo=2024-10-31
```
✅ **Esperado**: Devuelve todos los gastos de octubre

### Test 3: Crear Venta
```json
POST /api/sales
{
  "date": "2024-10-15",
  "customerName": "Test Cliente",
  "totalAmount": 100000,
  "paidAmount": 100000,
  "isPaid": true,
  "paymentMethod": "EFECTIVO",
  "details": [...]
}
```
✅ **Esperado**: Fecha guardada = 2024-10-15

### Test 4: Dashboard del Día
```http
GET /api/dashboard/executive-summary
```
✅ **Esperado**: Muestra datos del día actual correctamente

---

## 🔍 Troubleshooting

### Problema: La fecha sigue desfasada
**Solución**:
1. Verificar que el código se desplegó correctamente
2. Agregar variable `TZ=America/Bogota` en Railway
3. Hacer redeploy manual
4. Ver logs para verificar parseo de fechas

### Problema: Error al compilar
**Solución**:
```bash
# Limpiar y reconstruir
rm -rf dist node_modules
npm install
npm run build
```

### Problema: Dates existentes incorrectas
**Solución**:
```bash
# Ejecutar script de corrección
railway run npx ts-node scripts/fix-existing-dates.ts
```

---

## 📞 Soporte

Si encuentras problemas:

1. Revisar logs en Railway: `railway logs`
2. Verificar que las utilidades se importaron correctamente
3. Confirmar que la variable TZ está configurada
4. Probar localmente primero

---

## 📊 Impacto Esperado

### Antes ❌
- Gasto del 1 de octubre → Se guardaba como 30 de septiembre
- Reportes mensuales incorrectos
- Cierres de caja del día equivocado

### Después ✅
- Gasto del 1 de octubre → Se guarda como 1 de octubre
- Reportes precisos
- Cierres de caja correctos
- Filtros por fecha funcionan perfectamente

---

## 🎯 Próximos Pasos

1. **Desplegar cambios** siguiendo esta guía
2. **Verificar** que funciona en producción
3. **Informar a usuarios** si hubo datos afectados
4. **Monitorear** los primeros días

---

**Fecha de Creación**: Octubre 2025  
**Versión**: 1.0  
**Estado**: Listo para Desplegar ✅

# 🕐 SOLUCIÓN DEFINITIVA AL PROBLEMA DE TIMEZONE EN RAILWAY

## 🔴 PROBLEMA

**Síntomas**:
- Ventas muy temprano (7-8 AM) se guardan con fecha de **ayer**
- Ventas muy tarde (11 PM - 12 AM) se guardan con fecha de **mañana**

**Causa**:
- Railway usa **UTC (GMT+0)** por defecto
- Colombia usa **COT (GMT-5)** 
- Diferencia de **5 horas** causa el desfase

---

## ✅ SOLUCIÓN EN 3 PASOS

### **📍 PASO 1: Configurar Variable de Entorno en Railway (CRÍTICO)**

#### **Opción A: Desde Railway Dashboard (Recomendado)**

1. Ve a tu proyecto en Railway: https://railway.app
2. Selecciona tu servicio (backend)
3. Ve a la pestaña **"Variables"**
4. Click en **"New Variable"**
5. Agrega:
   ```
   Variable Name: TZ
   Value: America/Bogota
   ```
6. Click en **"Add"**
7. Railway automáticamente hará **redeploy**

#### **Opción B: Desde Railway CLI**

```bash
# Conectar al proyecto
railway link

# Agregar variable
railway variables set TZ=America/Bogota

# Ver variables
railway variables
```

---

### **📍 PASO 2: Verificar el Deployment**

Después del redeploy automático, verifica los logs:

```bash
# Ver logs en vivo
railway logs --follow

# O desde el dashboard: Project → Service → Deployments → View Logs
```

Busca que no haya errores de compilación.

---

### **📍 PASO 3: Probar en Producción**

#### **Test 1: Crear una venta temprano (antes de 5 AM UTC = antes de 12 AM COT)**

```bash
# Supongamos que son las 7 AM en Colombia
POST https://tu-api.railway.app/api/sales
{
  "customerName": "Test Timezone",
  "totalAmount": 50000,
  "paidAmount": 50000,
  "isPaid": true,
  "paymentMethod": "Efectivo",
  "details": [
    {
      "productId": 1,
      "quantity": 1,
      "unitPrice": 50000
    }
  ]
}

# Verificar que la fecha es HOY (no ayer)
GET https://tu-api.railway.app/api/sales
```

#### **Test 2: Verificar Dashboard**

```bash
GET https://tu-api.railway.app/api/dashboard/executive-summary

# Debe mostrar:
# - Ventas de hoy correctamente
# - Fecha actual del servidor
```

---

## 🔍 CÓMO FUNCIONA

### **Antes (Sin TZ configurado)** ❌

```
Usuario en Colombia: 7:00 AM (2026-01-19)
Servidor Railway (UTC): 12:00 PM (2026-01-18) ⚠️ DÍA ANTERIOR
Base de datos PostgreSQL: Guarda 2026-01-18 ❌
```

### **Después (Con TZ=America/Bogota)** ✅

```
Usuario en Colombia: 7:00 AM (2026-01-19)
Servidor Railway (COT): 7:00 AM (2026-01-19) ✅ FECHA CORRECTA
Base de datos PostgreSQL: Guarda 2026-01-19 ✅
```

---

## 🎯 QUÉ HACE LA VARIABLE TZ

La variable `TZ=America/Bogota` configura:

1. **Node.js**: `new Date()` devuelve la hora de Colombia
2. **PostgreSQL**: Timestamps se interpretan en hora de Colombia
3. **date-fns**: Funciones como `startOfDay()`, `endOfDay()` usan hora local
4. **Sistema operativo**: Toda la aplicación usa COT como referencia

---

## ✅ VERIFICACIÓN ADICIONAL

### **Script de Prueba Local**

Crea un archivo temporal para probar:

```javascript
// test-timezone.js
console.log('🕐 Configuración de Timezone:');
console.log('TZ variable:', process.env.TZ);
console.log('Fecha actual:', new Date().toString());
console.log('Hora local:', new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' }));
console.log('ISO String:', new Date().toISOString());

const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);
console.log('Inicio del día:', startOfDay.toString());

const endOfDay = new Date();
endOfDay.setHours(23, 59, 59, 999);
console.log('Fin del día:', endOfDay.toString());
```

```bash
# En Railway
railway run node test-timezone.js

# Debe mostrar:
# TZ variable: America/Bogota
# Fecha actual: Sun Jan 19 2026 07:30:00 GMT-0500 (Colombia Standard Time)
```

---

## 🚨 IMPORTANTE

### **¿Por qué no modificar el código?**

El código **YA ESTÁ CORRECTO**. Tienes utilidades de timezone implementadas:
- `parseLocalDate()` en `src/common/utils/timezone.util.ts`
- Usado en ventas, compras, gastos, cierre de caja

El problema NO es el código, es la **configuración del servidor**.

### **Ventajas de usar TZ en lugar de modificar código**

1. ✅ **Más limpio**: No necesitas parsear fechas manualmente en todos lados
2. ✅ **Más seguro**: Toda la app (incluidas librerías externas) usa la misma zona
3. ✅ **Más mantenible**: Un solo lugar de configuración
4. ✅ **Compatible**: Funciona con date-fns, Prisma, PostgreSQL
5. ✅ **Estándar**: Así es como se debe configurar timezone en Node.js

---

## 📊 CASOS DE PRUEBA

### **Caso 1: Venta a las 2 AM (COT)**

```
Hora Colombia: 2:00 AM - 19/01/2026
Hora UTC: 7:00 AM - 19/01/2026

CON TZ=America/Bogota:
✅ Se guarda: 19/01/2026

SIN TZ (UTC):
❌ Se guardaría: 19/01/2026 (correcto por suerte)
```

### **Caso 2: Venta a las 8 PM (COT)**

```
Hora Colombia: 8:00 PM - 19/01/2026
Hora UTC: 1:00 AM - 20/01/2026

CON TZ=America/Bogota:
✅ Se guarda: 19/01/2026

SIN TZ (UTC):
❌ Se guardaría: 20/01/2026 (DÍA SIGUIENTE)
```

### **Caso 3: Venta a las 11:30 PM (COT)**

```
Hora Colombia: 11:30 PM - 19/01/2026
Hora UTC: 4:30 AM - 20/01/2026

CON TZ=America/Bogota:
✅ Se guarda: 19/01/2026

SIN TZ (UTC):
❌ Se guardaría: 20/01/2026 (DÍA SIGUIENTE)
```

---

## 🎓 EXPLICACIÓN TÉCNICA

### **¿Qué hace PostgreSQL con las fechas?**

PostgreSQL guarda las fechas como **TIMESTAMP** en UTC internamente, PERO:
- Cuando Node.js con `TZ=America/Bogota` envía `new Date()`
- Prisma convierte la fecha local a UTC automáticamente
- PostgreSQL guarda en UTC
- Al leer, Prisma convierte de UTC a la zona local (COT)

**Resultado**: Todo funciona transparentemente con la zona horaria correcta.

---

## 📞 SOPORTE

Si después de configurar `TZ=America/Bogota` el problema persiste:

1. **Verificar que el redeploy se completó**:
   - Railway Dashboard → Deployments → Estado: "Success"

2. **Verificar variable está activa**:
   ```bash
   railway variables
   # Debe aparecer: TZ=America/Bogota
   ```

3. **Ver logs durante una venta**:
   ```bash
   railway logs --follow
   # Buscar: "🎯 Parsed date object"
   ```

4. **Reiniciar servicio manualmente**:
   - Railway Dashboard → Service → Settings → Restart

---

## ✅ CHECKLIST FINAL

- [ ] Variable `TZ=America/Bogota` agregada en Railway
- [ ] Redeploy completado exitosamente
- [ ] Logs no muestran errores
- [ ] Test de venta en horario temprano (7-8 AM)
- [ ] Test de venta en horario nocturno (11 PM - 12 AM)
- [ ] Dashboard muestra fecha correcta
- [ ] Reportes filtran por fecha correctamente

---

## 🎉 RESULTADO ESPERADO

Después de aplicar la solución:

✅ Ventas a cualquier hora del día se guardan con la **fecha correcta**
✅ Dashboard muestra datos del **día actual en Colombia**
✅ Reportes filtran correctamente por **fechas locales**
✅ Cierre de caja agrupa ventas del **día correcto**
✅ No más quejas de fechas incorrectas

---

**Última actualización**: 19 de Enero, 2026
**Autor**: Sistema de Gestión Perfumería Milan

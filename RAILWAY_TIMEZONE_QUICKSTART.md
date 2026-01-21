# 🚂 GUÍA RÁPIDA: Configurar Timezone en Railway

## ⚡ SOLUCIÓN EN 3 MINUTOS

### 🎯 PASO 1: Ir a Railway Dashboard

1. Abre tu navegador
2. Ve a: https://railway.app
3. Inicia sesión
4. Selecciona el proyecto del backend

---

### 🎯 PASO 2: Configurar Variable TZ

```
📍 Railway Dashboard
   └── 🎯 Selecciona tu servicio (backend-perfumeria)
       └── 📋 Click en pestaña "Variables"
           └── ➕ Click en "New Variable"
               ├── Variable Name: TZ
               ├── Value: America/Bogota
               └── Click "Add"
```

**Screenshot esperado:**
```
Variables
┌─────────────────────────────────────────┐
│ DATABASE_URL  postgresql://postgres...  │
│ JWT_SECRET    perfumeria-super...       │
│ PORT          3000                       │
│ TZ            America/Bogota     ← NUEVO│
└─────────────────────────────────────────┘
```

---

### 🎯 PASO 3: Esperar Redeploy

Railway automáticamente hará redeploy. Verás:

```
🔄 Deploying...
⚙️  Building...
✅ Build completed
🚀 Deploying...
✅ Deployed successfully
```

**Tiempo estimado**: 2-5 minutos

---

### ✅ PASO 4: Verificar (Opcional)

#### Opción A: Desde Railway CLI

```bash
# Instalar CLI si no lo tienes
npm install -g @railway/cli

# Login
railway login

# Conectar al proyecto
railway link

# Ver variables
railway variables
```

Debes ver:
```
Variables for backend-perfumeria:
  DATABASE_URL = postgresql://...
  JWT_SECRET = perfumeria-...
  PORT = 3000
  TZ = America/Bogota  ← DEBE APARECER
```

#### Opción B: Ejecutar Script de Prueba

```bash
# Ejecutar en Railway
railway run node scripts/test-timezone-railway.js
```

Debes ver:
```
📌 1. VARIABLE DE ENTORNO:
   TZ = America/Bogota  ✅

🌍 3. INFORMACIÓN DE TIMEZONE:
   ¿Es UTC-5? ✅ SÍ

✅ 8. VERIFICACIÓN FINAL:
   ¿Variable TZ configurada? ✅ SÍ
   ¿Offset correcto (UTC-5)? ✅ SÍ

🎉 ¡CONFIGURACIÓN CORRECTA!
```

---

### 🧪 PASO 5: Probar con una Venta Real

**Test en horario temprano (7-9 AM)**:

```bash
# Desde Postman o tu frontend
POST https://tu-backend.railway.app/api/sales
{
  "customerName": "Test Timezone",
  "totalAmount": 10000,
  "paidAmount": 10000,
  "isPaid": true,
  "paymentMethod": "Efectivo",
  "details": [
    {
      "productId": 1,
      "quantity": 1,
      "unitPrice": 10000
    }
  ]
}
```

✅ **Resultado esperado**: La venta debe guardarse con la fecha de HOY (no ayer)

**Test en horario nocturno (11 PM - 12 AM)**:

Hacer la misma prueba después de las 11 PM

✅ **Resultado esperado**: La venta debe guardarse con la fecha de HOY (no mañana)

---

## 🎓 ¿POR QUÉ FUNCIONA?

### Antes (sin TZ):
```
Cliente en Colombia: 8:00 AM (19 Enero 2026)
          ↓
Railway (UTC): 1:00 PM (19 Enero 2026)  
          ↓
PostgreSQL: Guarda 2026-01-19 ✅ (por suerte)

Cliente en Colombia: 11:00 PM (19 Enero 2026)
          ↓
Railway (UTC): 4:00 AM (20 Enero 2026) ⚠️ DÍA SIGUIENTE
          ↓
PostgreSQL: Guarda 2026-01-20 ❌ FECHA INCORRECTA
```

### Después (con TZ=America/Bogota):
```
Cliente en Colombia: 8:00 AM (19 Enero 2026)
          ↓
Railway (COT): 8:00 AM (19 Enero 2026) ✅ MISMA ZONA
          ↓
PostgreSQL: Guarda 2026-01-19 ✅ CORRECTO

Cliente en Colombia: 11:00 PM (19 Enero 2026)
          ↓
Railway (COT): 11:00 PM (19 Enero 2026) ✅ MISMA ZONA
          ↓
PostgreSQL: Guarda 2026-01-19 ✅ CORRECTO
```

---

## 🚨 TROUBLESHOOTING

### Problema 1: No aparece el botón "New Variable"

**Solución**: Asegúrate de estar en la pestaña "Variables" del servicio correcto (no en el proyecto general)

### Problema 2: El redeploy falla

**Solución**: 
1. Ver logs: Railway Dashboard → Deployments → View Logs
2. Si hay error de compilación, no es por la variable TZ
3. Verificar que el código compile localmente: `npm run build`

### Problema 3: La fecha sigue incorrecta

**Solución**:
1. Verificar que la variable se agregó: `railway variables`
2. Reiniciar manualmente: Railway Dashboard → Settings → Restart
3. Esperar 2-3 minutos después del restart
4. Probar nuevamente

---

## 📞 VERIFICACIÓN FINAL

✅ Variable `TZ=America/Bogota` en Railway
✅ Redeploy completado sin errores
✅ Test de venta a las 8 AM → fecha correcta
✅ Test de venta a las 11 PM → fecha correcta
✅ Dashboard muestra fecha actual de Colombia

---

## 🎉 LISTO

Una vez configurado, el problema de fechas desaparecerá **permanentemente**.

No necesitas modificar código. La configuración se aplica a:
- ✅ Todas las ventas
- ✅ Todas las compras
- ✅ Todos los gastos
- ✅ Todos los reportes
- ✅ Dashboard
- ✅ Cierre de caja

**Tiempo total**: 3-5 minutos ⚡

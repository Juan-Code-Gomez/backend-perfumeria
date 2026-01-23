# 🚀 Migrar Configuración de Tickets a Todos los Clientes

## ✅ Pasos a seguir:

### 1. Agregar URLs de Clientes

Edita el archivo `.env` y agrega las URLs de TODOS tus clientes:

```env
# Cliente principal (ya existe)
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:PORT/railway

# Otros clientes (agregar aquí)
DATABASE_URL_TROLLEY=postgresql://postgres:PASSWORD@trolley.proxy.rlwy.net:45234/railway
DATABASE_URL_CLIENTE3=postgresql://postgres:PASSWORD@HOST3:PORT3/railway
DATABASE_URL_CLIENTE4=postgresql://postgres:PASSWORD@HOST4:PORT4/railway
```

### 2. Ejecutar Migración

```bash
node migrate-all-clients.js
```

### 3. Verificar Resultado

El script mostrará:
- ✅ Bases de datos actualizadas correctamente
- ⚠️ Bases que ya tenían las columnas (se omiten)
- ❌ Errores (si los hay)

## 🔍 ¿Cómo obtener las URLs de Railway?

1. Ve a Railway Dashboard
2. Selecciona el servicio de base de datos del cliente
3. Ve a la pestaña "Connect"
4. Copia la URL que dice "Postgres Connection URL"

## 📝 Ejemplo de URL:

```
postgresql://postgres:ABCdef123XYZ@container.proxy.rlwy.net:12345/railway
                     ↑             ↑                          ↑
                  Password        Host                      Port
```

## ⚠️ IMPORTANTE

- **NO** compartas estas URLs públicamente
- Cada cliente tiene su propia URL única
- Guarda las URLs de forma segura
- Ejecuta el script solo UNA VEZ por cliente

## 🎯 ¿Qué hace la migración?

Agrega 10 nuevos campos a la tabla `company_config`:
- showLogo, showNIT, showAddress, showPhone, showEmail, showWebsite
- ticketWidth (58mm/80mm)
- fontSize (small/medium/large)
- includeVendor, includeCashSession

## 🔄 Si algo sale mal:

El script es seguro y NO romperá nada:
- Si las columnas ya existen, las omite
- Si hay error de conexión, lo reporta y continúa con el siguiente
- Puedes ejecutarlo múltiples veces sin problema

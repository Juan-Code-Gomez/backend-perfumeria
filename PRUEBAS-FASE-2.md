# 🧪 Pruebas de la Fase 2 - Reportes Financieros

## 📋 Plan de Pruebas

### 1. 🔐 Autenticación
Para probar los endpoints protegidos, necesitamos:
- Crear un usuario de prueba
- Hacer login y obtener el token JWT
- Usar el token para acceder a los endpoints

### 2. 📊 Endpoints a Probar

#### Dashboard Mejorado:
- `GET /api/dashboard/summary` - Dashboard principal (requiere datos)
- `GET /api/dashboard/rentabilidad` - Análisis de rentabilidad
- `GET /api/dashboard/productos-menos-rentables` - Productos menos rentables

#### Reportes Financieros:
- `GET /api/reports/inventario-valorizado` - Valoración del inventario
- `GET /api/reports/cuentas-por-cobrar-pagar` - Estado de cuentas
- `GET /api/reports/analisis-abc` - Clasificación ABC de productos
- `GET /api/reports/ganancias-periodo` - Análisis de ganancias

### 3. 🎯 Estrategia de Pruebas

#### Fase A: Endpoints sin datos (estructura vacía)
- Probar que los endpoints respondan correctamente
- Verificar formato de respuesta
- Confirmar autenticación funciona

#### Fase B: Con datos mínimos de prueba
- Crear datos básicos: categorías, productos, ventas
- Probar reportes con datos reales
- Validar cálculos

## 🚀 Comandos de Prueba

### Registro de Usuario:
```powershell
$registerBody = @{
    email = "admin@perfumeria.com"
    password = "admin123"
    name = "Administrador"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
```

### Login:
```powershell
$loginBody = @{
    email = "admin@perfumeria.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = ($response.Content | ConvertFrom-Json).access_token
```

### Prueba de Dashboard:
```powershell
$headers = @{ "Authorization" = "Bearer $token" }
Invoke-WebRequest -Uri "http://localhost:3000/api/dashboard/summary" -Headers $headers
```

### Prueba de Reportes:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/reports/inventario-valorizado" -Headers $headers
Invoke-WebRequest -Uri "http://localhost:3000/api/reports/analisis-abc" -Headers $headers
```

## 📊 Resultados Esperados

### Dashboard Summary (sin datos):
```json
{
  "success": true,
  "data": {
    "resumenFinanciero": {
      "hoy": { "ventas": 0, "gastos": 0, "gananciasBrutas": 0, "cantidadVentas": 0 },
      "mes": { "ventas": 0, "gastos": 0, "gananciasBrutas": 0, "cantidadVentas": 0 }
    },
    "inventario": { "valorTotal": { "costo": 0, "venta": 0 }, "alertasStockBajo": 0 },
    "cuentas": { "porCobrar": 0, "porPagar": 0, "flujoNeto": 0 },
    "productosMasVendidos": []
  }
}
```

### Inventario Valorizado (sin datos):
```json
{
  "success": true,
  "data": {
    "valorTotal": 0,
    "totalProductos": 0,
    "valorPorCategoria": [],
    "productosConMayorValor": [],
    "metricasInventario": {
      "rotacionPromedio": 0,
      "diasPromedioVenta": 0,
      "valorPromedioUnitario": 0
    }
  }
}
```

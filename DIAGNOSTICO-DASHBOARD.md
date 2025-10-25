# 🔍 GUÍA DE DIAGNÓSTICO - ERROR EN DASHBOARD

## ❌ Error Actual

```json
{
  "statusCode": 400,
  "timestamp": "2025-10-25T17:34:54.978Z",
  "path": "/api/dashboard/executive-summary",
  "method": "GET",
  "error": "Database Error",
  "message": "Error en la base de datos"
}
```

---

## 🎯 DIAGNÓSTICO PASO A PASO

### Opción 1: Diagnóstico Local (Más Rápido)

#### 1.1 Conectar a la BD de Producción

```bash
# En tu .env local, TEMPORALMENTE cambia DATABASE_URL a la de producción
# Copia la URL desde Railway Dashboard → Variables → DATABASE_URL
```

#### 1.2 Ejecutar Script de Diagnóstico

```bash
node diagnose-dashboard.js
```

Este script verificará:
- ✓ Conexión a BD
- ✓ Tablas existentes
- ✓ Datos en tablas críticas (Sale, Expense, Product, etc.)
- ✓ Migraciones aplicadas
- ✓ Consultas del dashboard

**Busca líneas con ✗ (error) para identificar el problema**

---

### Opción 2: Ver Logs de Railway (Más Detallado)

#### 2.1 Logs en Tiempo Real

1. Ve a: https://railway.app
2. Selecciona el proyecto del cliente con error
3. Click en "Deployments"
4. Click en el deployment activo (verde)
5. Busca líneas con **"Error"** o **"Database Error"**

#### 2.2 Qué buscar en los logs:

```
❌ Error: relation "Sale" does not exist
   → Falta tabla Sale en la BD

❌ Error: column "paidAmount" does not exist  
   → Falta columna en alguna tabla

❌ Error: Cannot reach database server
   → DATABASE_URL incorrecta

❌ Error: P2002: Unique constraint failed
   → Problema de datos duplicados

❌ Error: P2021: Table does not exist
   → Migración no se aplicó correctamente
```

---

## 🔧 POSIBLES CAUSAS Y SOLUCIONES

### Causa 1: Migraciones Incompletas

**Síntoma**: Faltan columnas o tablas

**Verificar**:
```bash
# Conectar a BD de producción
psql $DATABASE_URL

# Verificar tabla Sale
\d "Sale"

# Verificar si tiene todas las columnas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Sale';
```

**Solución**:
```bash
# Re-ejecutar migraciones en Railway
# Railway Dashboard → Deployments → Redeploy
```

---

### Causa 2: Campos NULL No Manejados

**Síntoma**: Error al calcular totales con valores NULL

**Verificar**:
```sql
-- Buscar ventas con totalAmount NULL
SELECT * FROM "Sale" WHERE "totalAmount" IS NULL LIMIT 5;

-- Buscar gastos con amount NULL
SELECT * FROM "Expense" WHERE amount IS NULL LIMIT 5;
```

**Solución Temporal**:
```sql
-- Actualizar valores NULL a 0
UPDATE "Sale" SET "totalAmount" = 0 WHERE "totalAmount" IS NULL;
UPDATE "Sale" SET "paidAmount" = 0 WHERE "paidAmount" IS NULL;
UPDATE "Expense" SET amount = 0 WHERE amount IS NULL;
```

---

### Causa 3: Tabla CashClosing Faltante

**Síntoma**: Error específico en la consulta de cierre de caja

**Verificar**:
```sql
-- Verificar si existe la tabla
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'CashClosing'
);

-- Contar registros
SELECT COUNT(*) FROM "CashClosing";
```

**Solución**:
```bash
# Si falta la tabla, ejecutar migración específica
# En Railway logs, buscar si la migración de CashClosing se aplicó
```

---

### Causa 4: Servicios Dependientes (Capital, Invoice)

**Síntoma**: Error en `capitalService.getCapitalSummary()` o `invoiceService.getInvoiceSummary()`

**Código del Dashboard**:
```typescript
// Línea que podría fallar:
capitalData = await this.capitalService.getCapitalSummary()
invoiceSummary = await this.invoiceService.getInvoiceSummary()
```

**Verificar**:
```bash
# Probar endpoints individuales
curl https://backend-perfumeria-production-fd39.up.railway.app/api/capital/summary
curl https://backend-perfumeria-production-fd39.up.railway.app/api/invoice/summary
```

---

## 🧪 PRUEBAS ESPECÍFICAS

### Prueba 1: Consulta Simplificada

Conecta a la BD y ejecuta:

```sql
-- Ventas de hoy
SELECT COUNT(*) as ventas_hoy 
FROM "Sale" 
WHERE date >= CURRENT_DATE 
AND date < CURRENT_DATE + INTERVAL '1 day';

-- Gastos del mes
SELECT COUNT(*) as gastos_mes 
FROM "Expense" 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
AND "deletedAt" IS NULL;

-- Productos
SELECT COUNT(*) as productos FROM "Product";
```

Si alguna falla → Esa es la causa

---

### Prueba 2: Test de Endpoint con Logs

Modificar temporalmente el dashboard.service.ts para agregar logs:

```typescript
async getExecutiveSummary() {
  console.log('🔍 Iniciando getExecutiveSummary...');
  
  try {
    console.log('📊 Consultando ventas de hoy...');
    const salesToday = await this.prisma.sale.findMany({...});
    console.log(`✓ Ventas de hoy: ${salesToday.length}`);
    
    console.log('📊 Consultando gastos del mes...');
    const expensesMonth = await this.prisma.expense.findMany({...});
    console.log(`✓ Gastos del mes: ${expensesMonth.length}`);
    
    // ... más consultas con logs
    
  } catch (error) {
    console.error('❌ Error en getExecutiveSummary:', error);
    throw error;
  }
}
```

Luego hacer push y ver en Railway qué línea falla específicamente.

---

## 📊 SCRIPT RÁPIDO DE PRUEBA

Crea un archivo `test-dashboard.http` (con extensión REST Client):

```http
### Test 1: Dashboard completo
GET https://backend-perfumeria-production-fd39.up.railway.app/api/dashboard/executive-summary
Content-Type: application/json

### Test 2: Solo ventas
GET https://backend-perfumeria-production-fd39.up.railway.app/api/sales
Content-Type: application/json

### Test 3: Solo productos
GET https://backend-perfumeria-production-fd39.up.railway.app/api/products
Content-Type: application/json

### Test 4: Capital
GET https://backend-perfumeria-production-fd39.up.railway.app/api/capital/summary
Content-Type: application/json

### Test 5: Facturas
GET https://backend-perfumeria-production-fd39.up.railway.app/api/invoice/summary
Content-Type: application/json
```

---

## 🚀 SOLUCIÓN RÁPIDA (Si es urgente)

### 1. Crear endpoint de prueba simplificado

Agregar en `dashboard.controller.ts`:

```typescript
@Get('test')
async testDashboard() {
  try {
    // Prueba básica
    const salesCount = await this.prisma.sale.count();
    const productsCount = await this.prisma.product.count();
    const expensesCount = await this.prisma.expense.count();
    
    return {
      status: 'OK',
      counts: {
        sales: salesCount,
        products: productsCount,
        expenses: expensesCount
      }
    };
  } catch (error) {
    return {
      status: 'ERROR',
      error: error.message,
      stack: error.stack
    };
  }
}
```

### 2. Llamar al endpoint de prueba

```bash
curl https://backend-perfumeria-production-fd39.up.railway.app/api/dashboard/test
```

Esto te dará el error exacto con stack trace.

---

## 📝 COMANDOS ÚTILES

### Conectar a BD de Producción (desde Railway)

```bash
# Railway CLI
railway connect

# O con psql directamente
psql "postgresql://user:pass@host:port/database"
```

### Ver tablas y estructura

```sql
-- Listar todas las tablas
\dt

-- Ver estructura de Sale
\d "Sale"

-- Ver datos recientes
SELECT * FROM "Sale" ORDER BY date DESC LIMIT 5;
```

### Verificar migraciones

```sql
SELECT * FROM _prisma_migrations 
ORDER BY finished_at DESC 
LIMIT 10;
```

---

## 🎯 PRÓXIMO PASO RECOMENDADO

### EJECUTA ESTO PRIMERO:

```bash
# 1. Conectar a BD de producción (copia DATABASE_URL de Railway)
# 2. Cambiar DATABASE_URL en .env local TEMPORALMENTE
# 3. Ejecutar diagnóstico
node diagnose-dashboard.js
```

El script te dirá **EXACTAMENTE** qué tabla o consulta está fallando.

---

## 📞 CHECKLIST DE DIAGNÓSTICO

- [ ] Ejecutar `node diagnose-dashboard.js`
- [ ] Ver logs de Railway para errores específicos
- [ ] Verificar que migraciones se aplicaron correctamente
- [ ] Probar endpoints individuales (capital, invoice)
- [ ] Verificar datos NULL en tablas críticas
- [ ] Revisar estructura de tablas (columnas faltantes)
- [ ] Probar consultas SQL manualmente

---

**¿Cuál prefieres que hagamos primero?**

1. Ejecutar `diagnose-dashboard.js` localmente
2. Revisar los logs de Railway juntos
3. Crear endpoint de prueba simplificado
4. Conectar a la BD y verificar manualmente

Dime qué opción prefieres y te guío paso a paso.

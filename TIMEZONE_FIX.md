# 🕐 Solución al Problema de Zona Horaria - Railway Deployment

## 🔴 Problema Identificado

Al desplegar en Railway, las fechas se guardaban con **un día de diferencia**:
- **Enviado**: 2024-10-01
- **Guardado en BD**: 2024-09-30

### 🔍 Causa Raíz
Railway usa **UTC (GMT+0)** mientras que Colombia usa **COT (GMT-5)**. Cuando el backend parseaba "2024-10-01" usando `new Date()`, JavaScript lo interpretaba como:
- `2024-10-01T00:00:00.000Z` (UTC)
- Al convertirse a COT: `2024-09-30T19:00:00-05:00` (30 de septiembre)

---

## ✅ Solución Implementada

### 1. **Utilidades de Timezone** (`src/common/utils/timezone.util.ts`)

Se creó un conjunto de funciones robustas para manejar fechas:

```typescript
/**
 * Convierte fecha string a Date sin interpretación UTC
 */
export function parseLocalDate(dateString: string | Date): Date

/**
 * Obtiene inicio del día (00:00:00)
 */
export function startOfDay(dateString: string): Date

/**
 * Obtiene fin del día (23:59:59.999)
 */
export function endOfDay(dateString: string): Date

/**
 * Formatea Date a string YYYY-MM-DD
 */
export function formatLocalDate(date: Date): string

/**
 * Obtiene fecha actual sin hora
 */
export function getTodayLocal(): Date
```

### 2. **Módulos Actualizados**

#### ✅ Gastos (Expenses)
- `expense.service.ts` - Métodos `create`, `update`, `findAll`, `getSummary`
- Uso de `parseLocalDate()` para crear/actualizar
- Uso de `startOfDay()` y `endOfDay()` para filtros por rango

#### ✅ Ventas (Sales)
- `sale.service.ts` - Métodos `create`, `findAll`, `getProfitabilityStats`
- Parseo correcto de fechas en creación de ventas
- Filtros de fecha usando las utilidades

#### ✅ Compras (Purchases)
- `purchase.service.ts` - Método `create`
- Fecha de compra parseada correctamente

#### ✅ Cierre de Caja (Cash Closing)
- `cash-closing.service.ts` - Método `create`
- Cálculo correcto de rangos de fechas para el día

---

## 🎯 Cómo Funciona

### **Antes** ❌
```typescript
// Problemas de zona horaria
const expense = await this.prisma.expense.create({
  data: {
    date: new Date(dto.date), // ⚠️ Interpreta como UTC
    // ...
  }
});
```

### **Después** ✅
```typescript
import { parseLocalDate } from '../common/utils/timezone.util';

const expense = await this.prisma.expense.create({
  data: {
    date: parseLocalDate(dto.date), // ✅ Parseo correcto
    // ...
  }
});
```

### **Filtros de Fecha** ✅
```typescript
import { startOfDay, endOfDay } from '../common/utils/timezone.util';

const where = {
  date: {
    gte: startOfDay(dateFrom),  // 2024-10-01 00:00:00
    lte: endOfDay(dateTo)       // 2024-10-31 23:59:59.999
  }
};
```

---

## 🚀 Despliegue en Railway

### Pasos para Aplicar los Cambios:

1. **Hacer commit de los cambios**:
   ```bash
   git add .
   git commit -m "fix: Solucionar problemas de zona horaria en fechas"
   git push origin main
   ```

2. **Railway detectará automáticamente** el push y hará redeploy

3. **Verificar en producción**:
   - Crear un gasto con fecha específica
   - Verificar que se guarda la fecha correcta en la BD

---

## 🧪 Testing

### Test Manual (Local):
```bash
# 1. Iniciar backend
npm run start:dev

# 2. Crear gasto con fecha específica
POST http://localhost:3000/api/expenses
{
  "date": "2024-10-15",
  "amount": 50000,
  "description": "Test timezone",
  "category": "SERVICIOS",
  "paymentMethod": "EFECTIVO"
}

# 3. Verificar que la fecha guardada es 2024-10-15
GET http://localhost:3000/api/expenses
```

### Test en Railway:
```bash
# Mismo test pero apuntando a URL de producción
POST https://tu-app.railway.app/api/expenses
```

---

## 📊 Impacto en Reportes

Esta solución también mejora:
- ✅ Dashboard ejecutivo
- ✅ Reportes de ventas por período
- ✅ Análisis de gastos mensuales
- ✅ Cierres de caja diarios
- ✅ Filtros de fecha en todos los módulos

---

## 🔒 Compatibilidad

- ✅ **No rompe datos existentes**: Las fechas ya guardadas se mantienen
- ✅ **Retrocompatible**: Acepta fechas en múltiples formatos
- ✅ **Funciona local y producción**: Independiente de zona horaria del servidor

---

## 📝 Notas Técnicas

### **parseLocalDate()** maneja:
- ✅ `"2024-10-15"` → Interpreta como local (12:00 del día 15)
- ✅ `"2024-10-15T10:30:00"` → Respeta la hora completa
- ✅ `Date object` → Retorna tal cual

### **startOfDay() / endOfDay()** garantizan:
- ✅ Rangos exactos de 24 horas
- ✅ No hay pérdida de registros en filtros
- ✅ Consistencia en todos los módulos

---

## ⚡ Próximos Pasos

### Opcional - Variables de Entorno:
```env
# .env
TZ=America/Bogota
NODE_ENV=production
```

### Opcional - Config Prisma:
```prisma
// En schema.prisma, ya está configurado:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## 🆘 Troubleshooting

### Si persiste el problema:

1. **Verificar variable TZ en Railway**:
   ```
   Railway Dashboard > Variables > TZ=America/Bogota
   ```

2. **Ver logs de parseo**:
   ```bash
   railway logs
   # Buscar: "🎯 Parsed date object"
   ```

3. **Validar en BD directamente**:
   ```sql
   SELECT id, date, description 
   FROM "Expense" 
   WHERE date >= '2024-10-01' AND date < '2024-10-02';
   ```

---

## ✅ Checklist de Verificación

- [x] Utilidades de timezone creadas
- [x] Módulo de gastos actualizado
- [x] Módulo de ventas actualizado
- [x] Módulo de compras actualizado
- [x] Módulo de cierre de caja actualizado
- [x] Tests manuales realizados
- [x] Documentación creada
- [ ] Deploy a Railway completado
- [ ] Verificación en producción

---

## 👨‍💻 Autor
**Fecha de Implementación**: Octubre 2025
**Versión Backend**: NestJS + Prisma + PostgreSQL
**Entorno**: Railway (Production)

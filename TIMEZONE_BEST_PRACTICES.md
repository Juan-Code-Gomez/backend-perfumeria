# 📚 Buenas Prácticas - Manejo de Fechas y Zonas Horarias

## 🎯 Principios Fundamentales

### 1. **Siempre Usar las Utilidades de Timezone**

✅ **CORRECTO**:
```typescript
import { parseLocalDate, startOfDay, endOfDay } from '../common/utils/timezone.util';

// Crear con fecha
const expense = await prisma.expense.create({
  data: {
    date: parseLocalDate(dto.date),
    // ...
  }
});

// Filtrar por rango
const where = {
  date: {
    gte: startOfDay(dateFrom),
    lte: endOfDay(dateTo)
  }
};
```

❌ **INCORRECTO**:
```typescript
// No usar new Date() directamente con strings
const expense = await prisma.expense.create({
  data: {
    date: new Date(dto.date), // ⚠️ Problema de timezone
    // ...
  }
});

// No usar formato UTC explícito
where.date = {
  gte: new Date(`${dateFrom}T00:00:00.000Z`) // ⚠️ Fuerza UTC
};
```

---

## 🛠️ Casos de Uso Comunes

### Crear Registro con Fecha

```typescript
import { parseLocalDate } from '../common/utils/timezone.util';

async create(dto: CreateDto) {
  return this.prisma.model.create({
    data: {
      date: dto.date ? parseLocalDate(dto.date) : new Date(),
      // ... otros campos
    }
  });
}
```

### Actualizar Registro con Fecha

```typescript
import { parseLocalDate } from '../common/utils/timezone.util';

async update(id: number, dto: UpdateDto) {
  const updateData: any = { ...dto };
  
  if (dto.date) {
    updateData.date = parseLocalDate(dto.date);
  }
  
  return this.prisma.model.update({
    where: { id },
    data: updateData
  });
}
```

### Filtrar por Rango de Fechas

```typescript
import { startOfDay, endOfDay } from '../common/utils/timezone.util';

async findAll(filters: { dateFrom?: string; dateTo?: string }) {
  const where: any = {};
  
  if (filters.dateFrom && filters.dateTo) {
    where.date = {
      gte: startOfDay(filters.dateFrom),
      lte: endOfDay(filters.dateTo)
    };
  }
  
  return this.prisma.model.findMany({ where });
}
```

### Obtener Registros del Día Actual

```typescript
import { getTodayLocal, startOfDay, endOfDay } from '../common/utils/timezone.util';

async getTodayRecords() {
  const today = getTodayLocal();
  const todayStr = formatLocalDate(today); // YYYY-MM-DD
  
  return this.prisma.model.findMany({
    where: {
      date: {
        gte: startOfDay(todayStr),
        lte: endOfDay(todayStr)
      }
    }
  });
}
```

### Comparar Fechas

```typescript
import { parseLocalDate } from '../common/utils/timezone.util';

async isWithinPeriod(recordDate: Date, startDate: string, endDate: string) {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  
  return recordDate >= start && recordDate <= end;
}
```

---

## 🎨 Patrones Recomendados

### Patrón 1: Service con Filtros de Fecha

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay, endOfDay } from '../common/utils/timezone.util';

@Injectable()
export class MyService {
  constructor(private prisma: PrismaService) {}
  
  async findAll(filters: {
    dateFrom?: string;
    dateTo?: string;
    // ... otros filtros
  }) {
    const where: any = {};
    
    // Filtro de fecha consistente
    if (filters.dateFrom && filters.dateTo) {
      where.date = {
        gte: startOfDay(filters.dateFrom),
        lte: endOfDay(filters.dateTo)
      };
    }
    
    return this.prisma.myModel.findMany({ where });
  }
}
```

### Patrón 2: DTO con Validación de Fecha

```typescript
import { IsDateString, IsOptional } from 'class-validator';

export class CreateDto {
  @IsDateString()
  @IsOptional()
  date?: string; // Formato: YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss
  
  // ... otros campos
}
```

### Patrón 3: Controller con Query Params

```typescript
import { Controller, Get, Query } from '@nestjs/common';

@Controller('my-resource')
export class MyController {
  constructor(private service: MyService) {}
  
  @Get()
  findAll(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    return this.service.findAll({ dateFrom, dateTo });
  }
}
```

---

## ⚠️ Errores Comunes a Evitar

### ❌ Error 1: Usar `new Date(string)` directamente
```typescript
// MAL
const date = new Date("2024-10-15"); // Puede interpretar como UTC
```

### ✅ Solución:
```typescript
// BIEN
import { parseLocalDate } from '../common/utils/timezone.util';
const date = parseLocalDate("2024-10-15");
```

### ❌ Error 2: Formato UTC explícito
```typescript
// MAL
where.date = { gte: new Date("2024-10-15T00:00:00.000Z") };
```

### ✅ Solución:
```typescript
// BIEN
import { startOfDay } from '../common/utils/timezone.util';
where.date = { gte: startOfDay("2024-10-15") };
```

### ❌ Error 3: No manejar timezones en comparaciones
```typescript
// MAL
const today = new Date().toISOString().split('T')[0];
```

### ✅ Solución:
```typescript
// BIEN
import { getTodayLocal, formatLocalDate } from '../common/utils/timezone.util';
const today = formatLocalDate(getTodayLocal());
```

### ❌ Error 4: Mezclar formatos
```typescript
// MAL - Mezcla UTC con local
const start = new Date(`${dateFrom}T00:00:00Z`);
const end = parseLocalDate(dateTo);
```

### ✅ Solución:
```typescript
// BIEN - Consistencia
import { startOfDay, endOfDay } from '../common/utils/timezone.util';
const start = startOfDay(dateFrom);
const end = endOfDay(dateTo);
```

---

## 🧪 Testing de Fechas

### Test Unitario
```typescript
import { parseLocalDate, startOfDay, endOfDay } from '../common/utils/timezone.util';

describe('Timezone utilities', () => {
  it('should parse date without timezone offset', () => {
    const date = parseLocalDate('2024-10-15');
    expect(date.getDate()).toBe(15);
    expect(date.getMonth()).toBe(9); // Octubre = 9 (0-indexed)
    expect(date.getFullYear()).toBe(2024);
  });
  
  it('should create start of day correctly', () => {
    const start = startOfDay('2024-10-15');
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
  });
});
```

### Test de Integración
```typescript
describe('Expense Service', () => {
  it('should create expense with correct date', async () => {
    const dto = {
      date: '2024-10-15',
      amount: 50000,
      description: 'Test',
      category: 'SERVICIOS',
      paymentMethod: 'EFECTIVO'
    };
    
    const expense = await service.create(dto);
    
    const savedDate = new Date(expense.date);
    expect(savedDate.getDate()).toBe(15);
    expect(savedDate.getMonth()).toBe(9); // Octubre
  });
});
```

---

## 📝 Documentación en Código

Siempre documenta el uso de fechas:

```typescript
/**
 * Crea un nuevo gasto con la fecha especificada.
 * 
 * @param dto - Datos del gasto
 * @param dto.date - Fecha en formato YYYY-MM-DD (zona horaria local)
 * @returns Gasto creado
 * 
 * @example
 * // Crear gasto para el 15 de octubre
 * create({ date: "2024-10-15", amount: 50000, ... })
 */
async create(dto: CreateExpenseDto) {
  // ...
}
```

---

## 🔄 Migración de Código Existente

Si tienes código antiguo, actualízalo así:

### Antes:
```typescript
const date = new Date(dto.date);
```

### Después:
```typescript
import { parseLocalDate } from '../common/utils/timezone.util';
const date = parseLocalDate(dto.date);
```

---

## 🌍 Consideraciones Multi-Timezone (Futuro)

Si en el futuro necesitas manejar múltiples zonas horarias:

```typescript
// Opción 1: Guardar timezone del usuario
interface UserPreferences {
  timezone: string; // "America/Bogota", "America/New_York", etc.
}

// Opción 2: Convertir al mostrar
import { toZonedTime, format } from 'date-fns-tz';

const userTimezone = 'America/Bogota';
const zonedDate = toZonedTime(date, userTimezone);
```

---

## ✅ Checklist para Nuevas Features

Cuando agregues nuevas funcionalidades con fechas:

- [ ] ¿Usas `parseLocalDate()` para parsear?
- [ ] ¿Usas `startOfDay()` y `endOfDay()` para rangos?
- [ ] ¿Evitas `new Date(string)` directamente?
- [ ] ¿Evitas formato UTC explícito (`...T00:00:00.000Z`)?
- [ ] ¿Documentaste el formato esperado?
- [ ] ¿Agregaste tests?
- [ ] ¿Validaste en local y producción?

---

## 📚 Referencias

- **Utilidades**: `src/common/utils/timezone.util.ts`
- **Documentación**: `TIMEZONE_FIX.md`
- **Deployment**: `DEPLOYMENT_TIMEZONE_FIX.md`
- **Ejemplos**: Este archivo

---

**Última Actualización**: Octubre 2025  
**Versión**: 1.0  
**Mantenido por**: Equipo de Desarrollo

# 🆘 COMANDOS SQL DE EMERGENCIA - RAILWAY

Este archivo contiene comandos SQL útiles para situaciones de emergencia durante el despliegue.

---

## ✅ MIGRACIÓN PRINCIPAL

### Eliminar Constraints Problemáticos
```sql
-- 1. Eliminar constraint de CashSession (date, isActive)
ALTER TABLE "CashSession" 
DROP CONSTRAINT IF EXISTS "CashSession_date_isActive_key";

ALTER TABLE "CashSession" 
DROP CONSTRAINT IF EXISTS "unique_active_session_per_date";

-- 2. Eliminar constraint de CashClosing (date)
ALTER TABLE "CashClosing" 
DROP CONSTRAINT IF EXISTS "CashClosing_date_key";
```

### Verificar que se eliminaron
```sql
-- Debe retornar 0 filas
SELECT conname, 
       CASE 
         WHEN conrelid = '"CashSession"'::regclass THEN 'CashSession'
         WHEN conrelid = '"CashClosing"'::regclass THEN 'CashClosing'
       END as tabla
FROM pg_constraint
WHERE conrelid IN ('"CashSession"'::regclass, '"CashClosing"'::regclass)
  AND contype = 'u'
  AND (conname LIKE '%date%' OR conname LIKE '%isActive%');
```

---

## 🔍 DIAGNÓSTICO

### Ver todos los constraints de las tablas
```sql
SELECT 
  conname as constraint_name,
  CASE 
    WHEN conrelid = '"CashSession"'::regclass THEN 'CashSession'
    WHEN conrelid = '"CashClosing"'::regclass THEN 'CashClosing'
  END as table_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid IN ('"CashSession"'::regclass, '"CashClosing"'::regclass)
ORDER BY table_name, constraint_type;
```

### Ver estructura de CashSession
```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'CashSession'
ORDER BY ordinal_position;
```

### Ver estructura de CashClosing
```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'CashClosing'
ORDER BY ordinal_position;
```

### Ver índices existentes
```sql
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('CashSession', 'CashClosing')
ORDER BY tablename, indexname;
```

---

## 📊 DATOS ACTUALES

### Contar registros
```sql
SELECT 
  'CashSession' as tabla,
  COUNT(*) as total_registros
FROM "CashSession"
UNION ALL
SELECT 
  'CashClosing' as tabla,
  COUNT(*) as total_registros
FROM "CashClosing";
```

### Ver sesiones activas
```sql
SELECT 
  id,
  "sessionNumber",
  date,
  "isActive",
  "openingCash",
  "closingCash",
  "openedAt",
  "closedAt"
FROM "CashSession"
WHERE "isActive" = true
ORDER BY date DESC;
```

### Ver últimos cierres
```sql
SELECT 
  id,
  date,
  "totalSales",
  "openingCash",
  "closingCash",
  difference,
  "createdAt"
FROM "CashClosing"
ORDER BY "createdAt" DESC
LIMIT 10;
```

### Ver cierres de hoy
```sql
SELECT 
  id,
  date,
  "totalSales",
  difference,
  "createdAt"
FROM "CashClosing"
WHERE date >= CURRENT_DATE
ORDER BY "createdAt" DESC;
```

---

## 🧪 PRUEBAS

### Simular inserción de múltiples sesiones mismo día
```sql
-- SOLO PARA PRUEBAS - NO EJECUTAR EN PRODUCCIÓN CON DATOS REALES

-- Esto debe funcionar SIN error después de la migración
INSERT INTO "CashSession" (date, "sessionNumber", "openingCash", "isActive", "openedAt", "createdAt", "updatedAt")
VALUES 
  (CURRENT_DATE, 1, 100000, false, NOW(), NOW(), NOW()),
  (CURRENT_DATE, 2, 150000, false, NOW() + INTERVAL '4 hours', NOW(), NOW()),
  (CURRENT_DATE, 3, 200000, true, NOW() + INTERVAL '8 hours', NOW(), NOW());

-- Verificar
SELECT id, "sessionNumber", date, "isActive", "openingCash"
FROM "CashSession"
WHERE date = CURRENT_DATE
ORDER BY "sessionNumber";

-- Limpiar prueba
DELETE FROM "CashSession" 
WHERE date = CURRENT_DATE AND id IN (
  SELECT id FROM "CashSession" 
  WHERE date = CURRENT_DATE 
  ORDER BY id DESC 
  LIMIT 3
);
```

---

## 🚨 EMERGENCIAS

### Si una sesión quedó activa por error
```sql
-- Ver sesiones activas
SELECT id, "sessionNumber", date, "openingCash", "openedAt"
FROM "CashSession"
WHERE "isActive" = true;

-- Cerrar una sesión específica (reemplazar ID)
UPDATE "CashSession"
SET 
  "isActive" = false,
  "closedAt" = NOW(),
  "closingCash" = "openingCash",  -- Ajustar según necesites
  "updatedAt" = NOW()
WHERE id = 123;  -- Reemplazar con el ID correcto
```

### Si hay cierres duplicados (por fecha exacta)
```sql
-- Ver cierres duplicados por fecha
SELECT 
  date,
  COUNT(*) as cantidad,
  STRING_AGG(id::text, ', ') as ids
FROM "CashClosing"
GROUP BY date
HAVING COUNT(*) > 1
ORDER BY date DESC;

-- Para eliminar duplicados (CUIDADO - revisar bien antes)
-- Esto mantiene el más reciente de cada día
DELETE FROM "CashClosing" c1
WHERE EXISTS (
  SELECT 1 FROM "CashClosing" c2
  WHERE c1.date = c2.date
    AND c1.id < c2.id
);
```

### Restaurar constraint (ROLLBACK - solo si realmente lo necesitas)
```sql
-- ⚠️ SOLO SI QUIERES VOLVER AL COMPORTAMIENTO ANTERIOR

-- Restaurar constraint en CashSession
ALTER TABLE "CashSession" 
ADD CONSTRAINT "CashSession_date_isActive_key" 
UNIQUE ("date", "isActive");

-- Restaurar constraint en CashClosing  
ALTER TABLE "CashClosing" 
ADD CONSTRAINT "CashClosing_date_key" 
UNIQUE ("date");
```

---

## 🔧 OPTIMIZACIÓN

### Analizar performance de las tablas
```sql
-- Ver estadísticas de las tablas
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables
WHERE tablename IN ('CashSession', 'CashClosing')
ORDER BY tablename;
```

### Recrear índices si es necesario
```sql
-- Índices recomendados para CashSession
CREATE INDEX IF NOT EXISTS "CashSession_date_sessionNumber_idx" 
ON "CashSession"(date, "sessionNumber");

CREATE INDEX IF NOT EXISTS "CashSession_isActive_idx" 
ON "CashSession"("isActive");

-- Índices recomendados para CashClosing
CREATE INDEX IF NOT EXISTS "CashClosing_date_idx" 
ON "CashClosing"(date);

CREATE INDEX IF NOT EXISTS "CashClosing_createdAt_idx" 
ON "CashClosing"("createdAt");
```

---

## 📝 NOTAS

- **Constraint tipo 'u'**: Unique constraint
- **Constraint tipo 'p'**: Primary key
- **Constraint tipo 'f'**: Foreign key
- **Constraint tipo 'c'**: Check constraint

### Nombres comunes de constraints que pueden aparecer:
- `CashSession_date_isActive_key` - Constraint único compuesto
- `unique_active_session_per_date` - Constraint custom
- `CashClosing_date_key` - Constraint único simple
- `CashSession_pkey` - Primary key (NO tocar)
- `CashClosing_pkey` - Primary key (NO tocar)

---

## 🔗 CONEXIÓN RÁPIDA EN RAILWAY

Para ejecutar estos comandos:

1. Railway Dashboard > PostgreSQL
2. Click en "Query" o "Data"
3. Pega el comando SQL
4. Click "Run" o presiona Ctrl+Enter

---

## ⚠️ ADVERTENCIAS

- **NO** eliminar primary keys (`_pkey`)
- **NO** eliminar foreign keys sin revisar dependencias
- **SIEMPRE** hacer backup antes de modificar constraints
- **VERIFICAR** queries de DELETE antes de ejecutar
- **PROBAR** en desarrollo primero si es posible

---

**Última actualización:** 13 Nov 2025
**Mantenedor:** Sistema de Cierre de Caja

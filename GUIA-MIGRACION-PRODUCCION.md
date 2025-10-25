# 📋 GUÍA DE MIGRACIÓN - MÓDULO DE FACTURAS EN PRODUCCIÓN

## 🎯 Objetivo
Ejecutar todas las migraciones necesarias para habilitar el módulo de facturas en producción.

## 📦 Archivos Necesarios
- `migration-production-invoices.sql` - Script SQL completo de migración

## 🔧 Opciones de Ejecución

### Opción 1: Usar pgAdmin (Recomendado)

1. **Abrir pgAdmin**
2. **Conectar a la base de datos de producción**
3. **Click derecho en la base de datos → Query Tool**
4. **Abrir el archivo `migration-production-invoices.sql`**
5. **Ejecutar el script completo (F5 o botón Execute)**
6. **Verificar que aparezcan los mensajes de éxito**

### Opción 2: Usar psql desde terminal

```bash
# Conectar a la base de datos
psql -U usuario_postgres -d nombre_base_datos -h servidor

# Ejecutar el script
\i migration-production-invoices.sql

# O en una sola línea
psql -U usuario_postgres -d nombre_base_datos -h servidor -f migration-production-invoices.sql
```

### Opción 3: Usar DBeaver

1. **Abrir DBeaver**
2. **Conectar a la base de datos de producción**
3. **SQL Editor → Open SQL Script**
4. **Seleccionar `migration-production-invoices.sql`**
5. **Execute SQL Script (Ctrl+Enter)**

### Opción 4: Ejecutar desde Node.js (si tienes acceso al servidor)

```bash
cd /ruta/del/backend
node execute-migration-production.js
```

## ✅ Verificación Post-Migración

Después de ejecutar la migración, verifica que todo esté correcto:

### 1. Verificar Tablas Creadas

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Invoice', 'InvoiceItem', 'InvoicePayment')
ORDER BY table_name;
```

Debe retornar 3 filas.

### 2. Verificar Foreign Keys

```sql
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('Invoice', 'InvoiceItem', 'InvoicePayment')
ORDER BY tc.table_name;
```

Debe retornar 4 foreign keys.

### 3. Verificar Índices

```sql
SELECT 
    tablename, 
    indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('Invoice', 'InvoiceItem', 'InvoicePayment')
ORDER BY tablename, indexname;
```

Debe retornar múltiples índices.

### 4. Verificar Enum ExpenseCategory

```sql
SELECT e.enumlabel 
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'ExpenseCategory'
ORDER BY e.enumlabel;
```

Debe incluir el valor `SUPPLIER_PAYMENT`.

### 5. Verificar en la Aplicación

1. **Acceder al módulo de Facturas** en el frontend
2. **Intentar crear una factura de prueba**
3. **Verificar que se pueda registrar un pago**
4. **Verificar que el gasto se cree automáticamente**

## 🔍 Troubleshooting

### Error: "relation Invoice already exists"
✅ **Solución**: Esto es normal. El script usa `IF NOT EXISTS`, así que saltará la creación si ya existe.

### Error: "type ExpenseCategory does not exist"
❌ **Problema**: El enum ExpenseCategory no existe en la base de datos.
✅ **Solución**: Ejecutar primero la migración que crea este enum o verificar el schema.prisma.

### Error: "relation Supplier does not exist"
❌ **Problema**: La tabla Supplier no existe (requerida para la FK).
✅ **Solución**: Asegurar que todas las migraciones previas estén ejecutadas.

### Error: "relation Product does not exist"
❌ **Problema**: La tabla Product no existe (requerida para InvoiceItem).
✅ **Solución**: Ejecutar migraciones de productos primero.

## 📊 Estructura Creada

### Tabla: Invoice
```
- id (PK)
- invoiceNumber (UNIQUE)
- supplierName
- supplierId (FK -> Supplier)
- amount
- paidAmount
- status (PENDING/PARTIAL/PAID)
- invoiceDate
- dueDate
- notes
- inventoryProcessed
+ otros campos de control
```

### Tabla: InvoiceItem
```
- id (PK)
- invoiceId (FK -> Invoice)
- productId (FK -> Product)
- description
- quantity
- unitCost
- totalPrice
- batchNumber
- expiryDate
```

### Tabla: InvoicePayment
```
- id (PK)
- invoiceId (FK -> Invoice)
- amount
- paymentDate
- paymentMethod
- notes
- expenseId (FK -> Expense, opcional)
```

## 🎯 Funcionalidades Habilitadas

Después de esta migración, tendrás:

✅ **Gestión de Facturas con FIFO**
- Crear facturas de proveedores
- Procesamiento automático de inventario
- Creación de lotes FIFO

✅ **Sistema de Pagos**
- Registro de pagos parciales y totales
- Actualización automática del estado
- Creación automática de gastos

✅ **Integración con Cierre de Caja**
- Pagos registrados como gastos
- Categoría: SUPPLIER_PAYMENT
- Fecha de pago respetada

✅ **Control de Crédito**
- Fecha de vencimiento
- Alertas de facturas vencidas
- Historial de pagos

## 🚀 Siguiente Paso

Una vez ejecutada la migración exitosamente:

1. **Reiniciar el servidor backend** para que cargue los nuevos modelos
2. **Probar el módulo de facturas** en la aplicación
3. **Crear una factura de prueba** con procesamiento de inventario
4. **Registrar un pago de prueba** y verificar que se cree el gasto
5. **Verificar el cierre de caja** para confirmar que aparezca el gasto

## 📞 Soporte

Si encuentras algún problema durante la migración, verifica:
- Logs del servidor backend
- Consola del navegador (errores de frontend)
- Logs de PostgreSQL
- Permisos del usuario de la base de datos

---

**Fecha de creación**: 2025-10-25
**Versión del sistema**: 1.0
**Autor**: Sistema de Perfumería - Módulo de Facturas

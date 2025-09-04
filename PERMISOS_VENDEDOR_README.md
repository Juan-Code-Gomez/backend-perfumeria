# 🔐 Sistema de Permisos por Roles - VENDEDOR

## 📋 Resumen de Implementación

Se ha implementado un sistema de permisos granular para el rol **VENDEDOR/CAJERO** con las siguientes restricciones:

### 🎯 Funcionalidades del Rol VENDEDOR

#### ✅ **Puede Acceder**
- **POS - Punto de Venta**: Acceso completo para registrar ventas
- **Administración de Ventas**: Visualización del historial de ventas
- **Consultar Productos**: Solo lectura de productos (sin edición/eliminación)

#### ❌ **NO Puede Ver**
- Precio de compra de productos
- Utilidad y margen de ganancia
- Información financiera sensible
- Módulos administrativos (proveedores, gastos, reportes, etc.)

#### 🚫 **NO Puede Hacer**
- Editar productos
- Eliminar productos
- Crear nuevos productos
- Exportar información
- Acceder a configuraciones del sistema

---

## 🔧 Archivos Modificados

### Backend
1. **`prisma/seed-modules.ts`**
   - Agregado rol `VENDEDOR`
   - Configurados permisos específicos

2. **`scripts/update-vendedor-permissions.js`**
   - Script para aplicar permisos del vendedor

### Frontend
1. **`src/components/FieldPermissionGuard.tsx`** (NUEVO)
   - Componente para ocultar campos sensibles por rol

2. **`src/pages/products/ProductList.tsx`**
   - Aplicados permisos condicionales en:
     - Columnas de la tabla (ocultar precio compra, utilidad, margen)
     - Botones de acción (editar/eliminar)
     - Funcionalidades de exportación y carga masiva

3. **`src/components/products/ProductCardView.tsx`**
   - Aplicados permisos en vista de tarjetas
   - Ocultada información financiera sensible

4. **`src/components/SidebarMenu.tsx`**
   - Menú dinámico basado en permisos
   - Títulos contextuales por rol

---

## 🚀 Instrucciones de Instalación

### 1. Aplicar Cambios en Base de Datos

```bash
# En el backend
cd "d:\Proyecto Milan\codigo\backend-perfumeria"

# Ejecutar migraciones si es necesario
npx prisma migrate dev

# Ejecutar seed para crear el rol VENDEDOR
npx prisma db seed

# O ejecutar script específico para permisos
node scripts/update-vendedor-permissions.js
```

### 2. Crear Usuario Vendedor de Prueba

```sql
-- En la base de datos PostgreSQL
-- 1. Buscar el ID del rol VENDEDOR
SELECT id, name FROM "Role" WHERE name = 'VENDEDOR';

-- 2. Crear usuario vendedor (ajustar el roleId según resultado anterior)
INSERT INTO "User" (username, password, name, "isActive") 
VALUES ('vendedor1', '$2b$10$encrypted_password_here', 'Juan Vendedor', true);

-- 3. Obtener ID del usuario creado
SELECT id FROM "User" WHERE username = 'vendedor1';

-- 4. Asignar rol al usuario (ajustar userIds según resultados)
INSERT INTO "UserRole" ("userId", "roleId") 
VALUES (user_id_aqui, role_id_vendedor_aqui);
```

### 3. Verificar Frontend

```bash
# En el frontend
cd "d:\Proyecto Milan\codigo\perfumeria-sistema"

# Instalar dependencias si es necesario
npm install

# Ejecutar en desarrollo
npm run dev
```

---

## 🧪 Casos de Prueba

### Escenario 1: Usuario Vendedor
1. Login con usuario vendedor
2. Verificar menú lateral solo muestra: POS, Ventas, Consultar Productos
3. En módulo Productos:
   - ✅ Puede ver lista de productos
   - ❌ No ve columnas: P. Compra, Utilidad, Margen
   - ❌ No ve botones: Editar, Eliminar, Nuevo Producto, Exportar
4. En POS:
   - ✅ Puede registrar ventas normalmente

### Escenario 2: Usuario Administrador
1. Login con usuario admin
2. Verificar acceso completo a todos los módulos
3. En módulo Productos:
   - ✅ Ve toda la información incluyendo costos
   - ✅ Puede editar, eliminar, crear productos

---

## 📊 Estructura de Permisos

| Módulo | VENDEDOR | ADMIN | SUPER_ADMIN |
|--------|----------|-------|-------------|
| POS | ✅ View | ✅ Full | ✅ Full |
| Ventas | ✅ View | ✅ Full | ✅ Full |
| Productos | ✅ View (limitado) | ✅ Full | ✅ Full |
| Clientes | ❌ | ✅ Full | ✅ Full |
| Proveedores | ❌ | ✅ Full | ✅ Full |
| Gastos | ❌ | ✅ Full | ✅ Full |
| Reportes | ❌ | ✅ Full | ✅ Full |
| Configuración | ❌ | ✅ Full | ✅ Full |

---

## 🔍 Componentes Clave

### FieldPermissionGuard
```tsx
<FieldPermissionGuard hideFor={['VENDEDOR']}>
  <div>Información sensible solo para admins</div>
</FieldPermissionGuard>
```

### Uso en Componentes
```tsx
const { hasPermission } = usePermissions();
const canEdit = hasPermission('productos', 'edit');

{canEdit && (
  <Button onClick={handleEdit}>Editar</Button>
)}
```

---

## 🛠️ Próximas Mejoras

1. **Roles Adicionales**: Implementar MANAGER con permisos intermedios
2. **Permisos Granulares**: Permisos por categoría de productos
3. **Auditoría**: Log de acciones por usuario y rol
4. **Dashboard Personalizado**: Dashboard específico para vendedores
5. **Horarios de Acceso**: Restricciones por horario de trabajo

---

## 📞 Soporte

Para dudas o problemas con el sistema de permisos:
- Revisar logs del backend para errores de autorización
- Verificar que los permisos estén correctamente asignados en la BD
- Comprobar que el token JWT incluya los roles correctos

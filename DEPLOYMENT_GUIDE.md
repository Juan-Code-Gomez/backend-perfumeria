# 🚀 Guía de Deployment del Módulo de Pedidos a Producción (Railway)

## 📋 Resumen
Desplegar el módulo de pedidos a 3 clientes en Railway:
- **Cliente 1:** tramway
- **Cliente 2:** shinkansen
- **Cliente 3:** turntable

---

## 🗂️ Cambios a Desplegar

### **1. Migraciones de Base de Datos (Prisma)**
- ✅ Tabla `Order` (pedidos)
- ✅ Tabla `OrderDetail` (detalles de pedidos)
- ✅ Tabla `OrderHistory` (historial de cambios)
- ✅ Campo `reservedStock` en tabla `Product`
- ✅ Módulo "pedidos" en tabla `SystemModule`
- ✅ Permisos en tabla `ModulePermission`

### **2. Backend (NestJS)**
- ✅ Módulo de Orders ya está en el código
- ✅ Railway hace deploy automático del backend

### **3. Frontend (React)**
- ✅ Componentes de Orders ya están en el código
- ✅ Railway hace deploy automático del frontend

---

## ⚠️ IMPORTANTE: Orden de Deployment

```
1. Backend (primero)  → Railway detecta cambios y despliega
2. Migraciones DB     → Ejecutar script para cada cliente
3. Frontend (último)  → Railway detecta cambios y despliega
```

---

## 🔧 Pasos Detallados

### **PASO 1: Preparar el Deployment**

1. **Hacer commit de todos los cambios:**
```bash
git add .
git commit -m "feat: Implementar módulo de pedidos con reserva de stock"
git push origin main
```

2. **Railway desplegará automáticamente:**
   - ✅ Backend (con código del módulo Orders)
   - ✅ Frontend (con componentes de pedidos)

---

### **PASO 2: Ejecutar Migraciones en Cada Cliente**

**Opción A: Usar Script Automatizado (Recomendado)**
```bash
node deploy-orders-production.js
```

**Opción B: Ejecutar manualmente para cada cliente**
```bash
# Cliente 1 (tramway)
DATABASE_URL="postgresql://postgres:huyVrrXIlyNOWCIXYnMuHNSACuYhDbog@tramway.proxy.rlwy.net:58936/railway" npx prisma migrate deploy

# Cliente 2 (shinkansen)
DATABASE_URL="postgresql://postgres:SJBYEwPzlxYkrgMupzDOWYTAUXICMCHT@shinkansen.proxy.rlwy.net:21931/railway" npx prisma migrate deploy

# Cliente 3 (turntable)
DATABASE_URL="postgresql://postgres:sramdnCvXZjwgHUZBUBvkvWGSvRuGgrZ@turntable.proxy.rlwy.net:38668/railway" npx prisma migrate deploy
```

---

### **PASO 3: Agregar Módulo de Pedidos a Cada Cliente**

**Ejecutar el script automatizado:**
```bash
node deploy-orders-production.js
```

Este script:
1. ✅ Ejecuta migraciones de Prisma
2. ✅ Crea el módulo "pedidos" en SystemModule
3. ✅ Asigna permisos a todos los roles
4. ✅ Verifica que todo esté correcto

---

### **PASO 4: Verificar en Producción**

Para cada cliente:

1. **Acceder a la aplicación web del cliente**
2. **Iniciar sesión con usuario ADMIN**
3. **Cerrar sesión y volver a entrar** (para cargar módulos)
4. **Verificar que aparezca "Pedidos" en el menú**
5. **Crear un pedido de prueba**
6. **Verificar que funcione correctamente**

---

## 🔍 Troubleshooting

### **Problema: Railway no despliega automáticamente**
**Solución:**
1. Ve a Railway Dashboard
2. Click en el servicio (backend o frontend)
3. Click en "Deployments"
4. Click en "Deploy now" manualmente

### **Problema: Error en migraciones**
**Solución:**
```bash
# Ver estado de migraciones
DATABASE_URL="tu_url_de_cliente" npx prisma migrate status

# Resetear migraciones (¡CUIDADO! Solo en emergencia)
DATABASE_URL="tu_url_de_cliente" npx prisma migrate resolve --applied "nombre_migracion"
```

### **Problema: Módulo no aparece en el menú**
**Solución:**
1. Verificar que el script de deployment se ejecutó
2. Usuario debe cerrar sesión y volver a entrar
3. Verificar en la base de datos que existe el módulo:
```sql
SELECT * FROM system_modules WHERE name = 'pedidos';
SELECT * FROM module_permissions WHERE "moduleId" = (SELECT id FROM system_modules WHERE name = 'pedidos');
```

---

## 📊 Checklist de Deployment

### **Antes de empezar:**
- [ ] Todos los cambios están commiteados
- [ ] Git push a main completado
- [ ] Railway muestra builds en progreso

### **Para cada cliente:**
- [ ] Migraciones ejecutadas exitosamente
- [ ] Módulo "pedidos" creado en SystemModule
- [ ] Permisos asignados a roles
- [ ] Verificado en la aplicación web
- [ ] Pedido de prueba creado exitosamente

### **Clientes:**
- [ ] Cliente 1 (tramway)
- [ ] Cliente 2 (shinkansen)
- [ ] Cliente 3 (turntable)

---

## 🚨 Respaldo Antes de Deployment

**IMPORTANTE:** Hacer backup de las bases de datos antes de desplegar:

```bash
# Desde Railway Dashboard
1. Click en Database
2. Click en "Data"
3. Click en "Export"
```

O usar el script de backup incluido.

---

## 📝 Notas Finales

- El deployment toma aproximadamente **10-15 minutos** por cliente
- Railway detecta cambios automáticamente en git push
- Los usuarios deben **cerrar sesión y volver a entrar** para ver el nuevo módulo
- El módulo es **retrocompatible** - no afecta funcionalidades existentes

---

**¿Listo para comenzar?**
Ejecuta: `node deploy-orders-production.js`

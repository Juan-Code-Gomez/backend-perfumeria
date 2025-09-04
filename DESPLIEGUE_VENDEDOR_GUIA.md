# 🚀 GUÍA DE DESPLIEGUE - ROL VENDEDOR

## 📋 Resumen de Cambios

Esta actualización agrega el rol **VENDEDOR** con acceso restringido a:
- ✅ POS, Ventas, Productos (lectura), Gastos (crear), Cierres de Caja, Facturas (crear)
- ❌ Sin acceso a edición/eliminación de productos, gastos y facturas

## 🔒 DESPLIEGUE SEGURO - PASO A PASO

### 1️⃣ Verificación Pre-Despliegue (LOCAL)

```bash
# En tu máquina local
cd "d:\Proyecto Milan\codigo\backend-perfumeria"
node scripts/pre-deployment-check.js
```

**Esto verificará:**
- ✅ Estado actual de la base de datos
- ✅ Roles y módulos existentes
- ✅ Qué necesita ser migrado

### 2️⃣ Commit y Push de Cambios

```bash
# Agregar todos los archivos modificados
git add .

# Commit con mensaje descriptivo
git commit -m "feat: Implementar rol VENDEDOR con permisos específicos

- Agregar rol VENDEDOR con acceso limitado
- Configurar permisos para POS, ventas, productos (lectura)
- Agregar acceso a gastos, cierres de caja y facturas (crear solamente)
- Implementar restricciones UI para botones editar/eliminar
- Agregar scripts de migración segura para producción"

# Push a main (se despliega automáticamente)
git push origin main
```

### 3️⃣ Ejecución de Migración en Producción

**IMPORTANTE: NO BORRA DATOS EXISTENTES**

Una vez que el código esté desplegado, ejecuta la migración:

```bash
# En el servidor de producción (Railway/Heroku/etc)
node scripts/production-migration.js
```

**O si tienes acceso a la consola del panel de administración:**

```bash
# Alternativa usando npm script
npm run migrate:production
```

### 4️⃣ Verificación Post-Despliegue

```bash
# Verificar que todo se aplicó correctamente
node scripts/verify-vendedor-extended-setup.js
```

**Resultado esperado:**
```
🎉 ¡Configuración extendida del rol VENDEDOR verificada exitosamente!

💡 CREDENCIALES PARA PRODUCCIÓN:
   👤 Usuario: vendedor
   🔑 Contraseña: vendedor2024!
```

## 🛡️ Scripts de Seguridad Incluidos

### 📁 `scripts/production-migration.js`
- ✅ Solo AGREGA datos, nunca elimina
- ✅ Verifica existencia antes de crear
- ✅ Configura permisos específicos del rol VENDEDOR
- ✅ Crea usuario vendedor con contraseña segura

### 📁 `scripts/pre-deployment-check.js`
- ✅ Analiza estado actual de la base de datos
- ✅ Determina qué migración es necesaria
- ✅ Previene problemas antes del despliegue

### 📁 `scripts/verify-vendedor-extended-setup.js`
- ✅ Confirma que la migración fue exitosa
- ✅ Lista todos los permisos configurados
- ✅ Valida acceso del usuario vendedor

## 👤 Usuario de Producción Creado

**Se creará automáticamente:**
- **Usuario:** `vendedor`
- **Contraseña:** `vendedor2024!`
- **Rol:** VENDEDOR
- **Nombre:** Vendedor Principal

> ⚠️ **IMPORTANTE:** Cambia esta contraseña después del primer login

## 🔄 Rollback de Emergencia

Si algo sale mal, puedes revertir:

```bash
# 1. Revertir código
git revert HEAD

# 2. Push del revert
git push origin main

# 3. Los datos del rol no se perderán, solo se deshabilitará la funcionalidad
```

## 🧪 Pruebas Recomendadas

### Después del despliegue, probar:

1. **Login Administrador** ✅
   - Verificar que todo funciona igual

2. **Login Vendedor** ✅
   ```
   Usuario: vendedor
   Contraseña: vendedor2024!
   ```

3. **Verificar Menú Vendedor** ✅
   - Debe ver: POS, Ventas, Productos, Gastos, Cierres, Facturas
   - No debe ver: Clientes, Proveedores, Capital, Reportes

4. **Verificar Restricciones** ✅
   - Productos: Solo lectura, sin precios de compra
   - Gastos: Solo botón "Nuevo gasto"
   - Facturas: Solo botón "Nueva factura"

## 📊 Monitoreo Post-Despliegue

### Verificar logs de aplicación:
```bash
# Si hay errores, aparecerán en los logs
tail -f logs/application.log
```

### Verificar base de datos:
```sql
-- Confirmar que el rol existe
SELECT * FROM "Role" WHERE name = 'VENDEDOR';

-- Confirmar permisos
SELECT r.name, m.name, mp.*
FROM "ModulePermission" mp
JOIN "Role" r ON mp."roleId" = r.id
JOIN "SystemModule" m ON mp."moduleId" = m.id
WHERE r.name = 'VENDEDOR';
```

## 🆘 Soporte y Contacto

Si encuentras problemas:

1. **Verificar logs** de la aplicación
2. **Ejecutar script de verificación**
3. **Revisar estado de base de datos**
4. **Contactar al desarrollador** con detalles del error

---

## 📝 Checklist de Despliegue

- [ ] Ejecutar verificación pre-despliegue
- [ ] Hacer commit y push de cambios
- [ ] Esperar despliegue automático
- [ ] Ejecutar migración de producción
- [ ] Verificar funcionalidad con script
- [ ] Probar login de vendedor
- [ ] Confirmar restricciones UI
- [ ] Cambiar contraseña por defecto
- [ ] Documentar credenciales en lugar seguro

**Estado:** ✅ Listo para despliegue seguro

---

*Última actualización: Septiembre 2025*

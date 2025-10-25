# 🚀 CÓMO SINCRONIZAR PRODUCCIÓN - GUÍA ULTRA SIMPLE

## ¿Qué necesitas hacer?

Sincronizar tu base de datos de producción con todos los cambios que has hecho en desarrollo.

## ¿Cuál es la forma MÁS FÁCIL?

### Opción 1: Un solo comando (RECOMENDADO) 🌟

```powershell
cd backend-perfumeria
node full-sync-assistant.js
```

**¿Qué hace?**
- Te hace preguntas para confirmar cada paso
- Verifica diferencias
- Crea backup automático (opcional)
- Ejecuta la migración
- Regenera Prisma Client
- Te dice exactamente qué hacer después

**Tiempo:** ~2 minutos

---

### Opción 2: Solo backup + migración

```powershell
cd backend-perfumeria
node create-backup.js
```

Luego el script te preguntará si ejecutar la migración.

---

### Opción 3: Sin scripts, con pgAdmin (Visual)

1. Abrir **pgAdmin**
2. Conectar a la base de datos de **producción**
3. Click derecho → **Query Tool**
4. **File → Open** → Seleccionar archivo `sync-production-safe.sql`
5. Presionar **F5** (o botón Execute)
6. Esperar mensaje de éxito
7. En terminal: `npx prisma generate`
8. Reiniciar backend

---

## ¿Es seguro?

✅ **SÍ, 100% SEGURO**

- NO borra datos
- NO elimina tablas
- Solo AGREGA lo que falta
- Puedes ejecutarlo varias veces sin problema

## ¿Qué se va a agregar?

### 7 Tablas Nuevas:
1. InvoiceItem (ítems de facturas)
2. InvoicePayment (pagos de facturas)
3. company_config (configuración)
4. module_permissions (permisos)
5. product_batches (lotes FIFO)
6. system_modules (módulos)
7. system_parameters (parámetros)

### Campos Nuevos en Tablas Existentes:
- **User**: + companyCode
- **Supplier**: nit ahora opcional
- **Purchase**: + subtotal, discount, invoiceNumber, etc.
- **Invoice**: + supplierId, notes, etc.

## ¿Cuánto tiempo toma?

- Backup: ~10-30 segundos
- Migración: ~5-10 segundos
- Total: **menos de 1 minuto**

## ¿Debo hacer backup primero?

**RECOMENDADO: SÍ**

Aunque el script es seguro, siempre es mejor prevenir.

Si usas el asistente (`full-sync-assistant.js`), te pregunta si quieres backup.

## ¿Qué hago después de ejecutar?

1. **Regenerar Prisma Client:**
   ```powershell
   npx prisma generate
   ```

2. **Reiniciar el backend en producción**

3. **Probar estos módulos:**
   - Crear una factura
   - Registrar un pago
   - Hacer una compra con FIFO

4. **Verificar que no hay errores en consola**

## ¿Qué archivo debo usar?

### Si tienes dudas: `full-sync-assistant.js`

Este te guía paso a paso con preguntas.

### Si ya sabes qué hacer:

| Necesidad | Archivo |
|-----------|---------|
| TODO (recomendado) | `sync-production-safe.sql` |
| Solo facturas | `migration-production-invoices.sql` |
| Ver qué falta | `node check-production-diff.js` |

## ¿Problemas comunes?

### "psql: command not found"
**Solución:** Usa pgAdmin (es más fácil)

### "permission denied"
**Solución:** Tu usuario de BD necesita permisos de CREATE/ALTER

### "relation already exists"
**Solución:** ✅ Esto es NORMAL. El script lo salta automáticamente.

### "could not connect to server"
**Solución:** Verifica DATABASE_URL en tu archivo `.env`

## Archivos importantes

```
backend-perfumeria/
├── full-sync-assistant.js        ← MÁS FÁCIL
├── sync-production-safe.sql      ← Script SQL completo
├── create-backup.js              ← Backup automático
├── execute-sync-production.js    ← Ejecuta SQL automáticamente
├── check-production-diff.js      ← Ver diferencias
└── README-SYNC-PRODUCTION.md     ← Guía completa
```

## Resumen para los apurados

```powershell
# Un solo comando:
node full-sync-assistant.js

# Después de que termine:
npx prisma generate

# Luego:
# - Reiniciar backend
# - Probar módulos
# - ¡Listo!
```

## ¿Necesitas más ayuda?

Lee los archivos de documentación:
- `README-SYNC-PRODUCTION.md` - Guía completa
- `SYNC-PRODUCTION-GUIDE.md` - Guía detallada
- `MIGRATION-INDEX.txt` - Índice visual

---

**Versión:** 2.0  
**Última actualización:** 2025-10-25  
**Estado:** ✅ Probado y funcionando

# 🔍 Script de Diagnóstico de Facturas

## Pasos para Diagnosticar el Problema

### 1. **Probar el endpoint de debug en producción:**

```bash
curl -X GET "https://backend-perfumeria-production-057a.up.railway.app/api/invoices/debug" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. **Si no tienes token, obtén uno primero:**

```bash
curl -X POST "https://backend-perfumeria-production-057a.up.railway.app/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "tu_usuario",
    "password": "tu_password"
  }'
```

### 3. **URL del endpoint de debug:**
```
https://backend-perfumeria-production-057a.up.railway.app/api/invoices/debug
```

## 🔬 Qué va a diagnosticar:

1. **Conexión a la base de datos** - ¿Puede conectarse?
2. **Conteo simple** - ¿Cuántas facturas hay?
3. **Consulta básica** - ¿Puede obtener una factura sin relaciones?
4. **Consulta con relaciones** - ¿Puede obtener una factura con Supplier/InvoiceItem?

## 📊 Resultados Esperados:

### ✅ **Si todo está bien:**
```json
{
  "status": "success",
  "tests": {
    "databaseConnection": { "status": "success" },
    "simpleCount": { "status": "success", "count": X },
    "firstInvoiceBasic": { "status": "success", "invoice": {...} },
    "firstInvoiceWithRelations": { "status": "success", "invoice": {...} }
  }
}
```

### ❌ **Si hay problemas:**
```json
{
  "status": "error",
  "error": "Descripción del error",
  "stack": "Stack trace completo"
}
```

## 🛠️ Siguientes Pasos según Resultados:

### **Si falla la conexión DB:**
- Verificar variables de entorno en Railway
- Revisar DATABASE_URL

### **Si falla el conteo:**
- Problema con el modelo Invoice
- Posible migración pendiente

### **Si falla la consulta básica:**
- Problema con la tabla Invoice
- Verificar que existe en la DB

### **Si falla solo con relaciones:**
- Problema con foreign keys
- Verificar tablas Supplier/InvoiceItem

---

**Próximo paso**: Ejecutar el endpoint de debug y analizar los resultados.

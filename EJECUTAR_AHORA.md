# 🚨 PASOS INMEDIATOS - EJECUTAR AHORA

## ⏰ Tiempo estimado: 5-10 minutos

---

## 📍 PASO 1: Commit y Push (2 min)

Los cambios ya están listos. Solo comitea y sube:

```bash
cd "d:\Proyecto Milan\codigo\backend-perfumeria"
git add .
git commit -m "fix: auto-migrate system to prevent DB schema errors"
git push origin main
```

---

## 📍 PASO 2: Aplicar Migración a CADA Cliente (3 min por cliente)

Railway hará deploy automático, pero necesitas aplicar la migración MANUALMENTE a los clientes que están fallando AHORA.

### Para CADA proyecto/cliente en Railway:

```bash
# Conéctate al proyecto
railway link

# Aplica la migración de emergencia
railway run node fix-now.js

# Reinicia el servicio
railway restart
```

### O si prefieres SQL directo:

```bash
railway link
railway run psql $DATABASE_URL -c "ALTER TABLE company_config ADD COLUMN IF NOT EXISTS \"useFifoInventory\" BOOLEAN DEFAULT true;"
railway restart
```

---

## 📍 PASO 3: Verificar que Funcionó (1 min)

```bash
railway logs --tail
```

Debes ver:
```
✅ Migración aplicada exitosamente
[Nest] Starting Nest application...
```

Y NO más:
```
❌ The column company_config.useFifoInventory does not exist
```

---

## 🔄 CLIENTES ACTUALES A ARREGLAR

Según tu descripción, tienes varios clientes. Ejecuta el Paso 2 para CADA UNO:

1. **Cliente 1** (el que funciona) - ✅ Ya tiene la migración, skip
2. **Cliente 2** - ❌ Necesita migración → ejecutar `railway run node fix-now.js`
3. **Cliente 3** - ❌ Necesita migración → ejecutar `railway run node fix-now.js`
4. **Cliente 4** - ❌ Necesita migración → ejecutar `railway run node fix-now.js`

---

## 🎯 RESULTADO ESPERADO

Después de hacer esto:

✅ Todos los clientes funcionando  
✅ No más errores de base de datos  
✅ Futuras migraciones se aplicarán automáticamente  

---

## 💡 SI NO TIENES RAILWAY CLI

### Plan B - Usar Railway Dashboard:

1. Ve a railway.app
2. Abre cada proyecto de cliente
3. Ve a "Settings" → "Variables"
4. Copia el `DATABASE_URL`
5. Ejecuta localmente:

```bash
cd backend-perfumeria
DATABASE_URL="[pega-aqui-el-url]" node fix-now.js
```

---

## ⚡ COMANDOS LISTOS PARA COPIAR-PEGAR

### Si tienes Railway CLI instalado:

```bash
# Cliente 2
railway link [project-id-cliente-2]
railway run node fix-now.js
railway restart

# Cliente 3
railway link [project-id-cliente-3]
railway run node fix-now.js
railway restart

# Cliente 4
railway link [project-id-cliente-4]
railway run node fix-now.js
railway restart
```

### Si prefieres SQL directo (más rápido):

```bash
# Cliente 2
railway link [project-id-cliente-2]
railway run psql $DATABASE_URL -c "ALTER TABLE company_config ADD COLUMN IF NOT EXISTS \"useFifoInventory\" BOOLEAN DEFAULT true;"
railway restart

# Cliente 3
railway link [project-id-cliente-3]
railway run psql $DATABASE_URL -c "ALTER TABLE company_config ADD COLUMN IF NOT EXISTS \"useFifoInventory\" BOOLEAN DEFAULT true;"
railway restart

# Cliente 4
railway link [project-id-cliente-4]
railway run psql $DATABASE_URL -c "ALTER TABLE company_config ADD COLUMN IF NOT EXISTS \"useFifoInventory\" BOOLEAN DEFAULT true;"
railway restart
```

---

## ✅ CHECKLIST

- [ ] Paso 1: Commit y push realizado
- [ ] Paso 2: Migración aplicada a Cliente 2
- [ ] Paso 2: Migración aplicada a Cliente 3  
- [ ] Paso 2: Migración aplicada a Cliente 4
- [ ] Paso 3: Verificado logs sin errores
- [ ] 🎉 Todos los clientes funcionando

---

## 📞 DESPUÉS DE ARREGLAR

El sistema ya está configurado para que **NUNCA vuelva a pasar** esto:

- ✅ `auto-migrate.js` se ejecutará en cada deploy
- ✅ Aplicará migraciones automáticamente
- ✅ No necesitarás intervención manual en el futuro

**Para futuras migraciones:** Solo agrega el código en `auto-migrate.js` y haz push. Listo.

---

**TIEMPO TOTAL: 5-10 minutos**  
**DIFICULTAD: Baja - Solo copiar-pegar comandos**  
**RESULTADO: Sistema funcionando + Prevención automática**

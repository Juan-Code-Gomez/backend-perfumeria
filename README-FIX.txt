╔═══════════════════════════════════════════════════════════════╗
║  🚀 SOLUCIÓN RÁPIDA: Fixes para Múltiples Bases de Datos     ║
╚═══════════════════════════════════════════════════════════════╝

📋 PROBLEMA:
   3 bases de datos en Railway tienen columnas faltantes
   - Purchase: 6 columnas faltantes
   - Invoice: 1 columna faltante

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ SOLUCIÓN MÁS RÁPIDA (5 minutos):

   1. Edita .env y agrega las 3 URLs de Railway:
      
      DATABASE_URL_CLIENT_2="postgresql://..."
      DATABASE_URL_CLIENT_3="postgresql://..."
      DATABASE_URL_CLIENT_4="postgresql://..."

   2. Ejecuta:
      
      node apply-fix-multi-db.js

   3. Espera a que termine (verás ✅ para cada BD)

   4. ¡Listo! Todos los clientes funcionando

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛠️  ALTERNATIVA MANUAL (si prefieres):

   1. Entra a Railway → PostgreSQL → Query
   
   2. Ejecuta este SQL en cada base de datos:

      -- Purchase
      ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "subtotal" DOUBLE PRECISION;
      ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "discount" DOUBLE PRECISION DEFAULT 0;
      ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT;
      ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "invoiceDate" TIMESTAMP(3);
      ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3);
      ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "notes" TEXT;
      UPDATE "Purchase" SET "subtotal" = "totalAmount" WHERE "subtotal" IS NULL;

      -- Invoice
      ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "notes" TEXT;

   3. Repite en las 3 bases de datos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 PARA NUEVOS CLIENTES (prevención):

   Cuando despliegues un nuevo cliente, ejecuta:
   
   node setup-new-client.js

   Esto aplicará automáticamente todas las migraciones + fixes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 ARCHIVOS CREADOS:

   apply-fix-multi-db.js        ← Script automático (RECOMENDADO)
   setup-new-client.js          ← Para clientes nuevos
   asistente-fix.js             ← Asistente interactivo
   fix-all-missing-columns.sql  ← SQL de referencia
   RESUMEN-SOLUCION.md          ← Documentación completa

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ VERIFICACIÓN:

   Después de aplicar los fixes, verifica que funciona:

   Local:      node test-dashboard-debug.js
   Producción: GET /api/dashboard/debug (debe retornar 200 OK)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 TIPS:

   ✓ Los scripts son idempotentes (se pueden ejecutar varias veces)
   ✓ No borran ni modifican datos existentes
   ✓ Incluyen verificación automática
   ✓ Soportan rollback si algo sale mal

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

¿Dudas? Lee: RESUMEN-SOLUCION.md

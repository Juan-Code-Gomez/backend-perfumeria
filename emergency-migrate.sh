#!/bin/bash
# emergency-migrate.sh
# Script de emergencia para aplicar migraciones a clientes en Railway

echo "🚨 MIGRACIÓN DE EMERGENCIA - Aplicar campo useFifoInventory"
echo "==========================================================="
echo ""
echo "⚠️  Este script debe ejecutarse cuando los clientes están fallando"
echo "    debido a cambios en el schema que no se aplicaron."
echo ""
echo "📋 Opciones:"
echo ""
echo "   Opción 1 - Railway CLI (Recomendado):"
echo "   $ railway run node auto-migrate.js"
echo ""
echo "   Opción 2 - SQL Directo:"
echo "   $ railway run psql \$DATABASE_URL -f add-fifo-config.sql"
echo ""
echo "   Opción 3 - Script Multi-DB:"
echo "   $ railway run node apply-fifo-config-multi-db.js"
echo ""
echo "   Opción 4 - Restart con auto-migrate:"
echo "   $ railway restart"
echo "   (Si ya actualizaste el package.json con auto-migrate)"
echo ""
echo "==========================================================="
echo ""

# Para Windows (PowerShell):
# railway run node auto-migrate.js

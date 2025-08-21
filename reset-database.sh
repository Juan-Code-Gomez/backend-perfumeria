#!/bin/bash
# Script para resetear la base de datos en Railway

echo "🔄 Iniciando reset de base de datos..."

# Reset de la base de datos (esto eliminará todas las tablas)
echo "⚠️  Eliminando todas las tablas..."
npx prisma db push --force-reset --skip-seed

# Generar cliente Prisma
echo "🔧 Generando cliente Prisma..."
npx prisma generate

# Aplicar migraciones
echo "📊 Aplicando migraciones..."
npx prisma db push

# Ejecutar seeders
echo "🌱 Ejecutando seeders..."
npm run seed

echo "✅ Reset de base de datos completado!"

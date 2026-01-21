# Script DEFINITIVO para setup de cliente nuevo en Railway
# Usa prisma db push (más confiable que migraciones para setup inicial)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 SETUP DEFINITIVO - CLIENTE NUEVO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configurar URL de la base de datos
$DATABASE_URL = "postgresql://postgres:wGcAKDSKDggpmWPulURTqPDEYOPovsPy@trolley.proxy.rlwy.net:45234/railway"
$env:DATABASE_URL = $DATABASE_URL

Write-Host "📍 Base de datos: trolley.proxy.rlwy.net:45234" -ForegroundColor Yellow
Write-Host ""

# Confirmar
Write-Host "⚠️  IMPORTANTE: Este script va a:" -ForegroundColor Yellow
Write-Host "   1. ELIMINAR todas las tablas existentes (si hay)" -ForegroundColor White
Write-Host "   2. Crear TODAS las tablas del schema" -ForegroundColor White
Write-Host "   3. Insertar datos iniciales" -ForegroundColor White
Write-Host ""
$confirm = Read-Host "¿Continuar? (s/n)"

if ($confirm -ne "s" -and $confirm -ne "S") {
    Write-Host "❌ Operación cancelada" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🗑️  PASO 1: Aplicar Schema" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Usar db push con force-reset para limpiar y crear todo
npx prisma db push --force-reset --skip-generate --accept-data-loss

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Todas las tablas creadas correctamente" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "🌱 PASO 2: Insertar Datos Iniciales" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    npx prisma db seed
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "🎉 SETUP COMPLETADO EXITOSAMENTE" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 DATOS CREADOS:" -ForegroundColor White
        Write-Host "   ✅ TODAS las tablas del schema (36+)" -ForegroundColor Green
        Write-Host "   ✅ Roles: SUPER_ADMIN, ADMIN, VENDEDOR, USER" -ForegroundColor Green
        Write-Host "   ✅ Usuario admin creado" -ForegroundColor Green
        Write-Host "   ✅ Módulos del sistema con permisos" -ForegroundColor Green
        Write-Host "   ✅ Categorías y unidades básicas" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 CREDENCIALES:" -ForegroundColor White
        Write-Host "   Usuario: admin" -ForegroundColor Cyan
        Write-Host "   Contraseña: Admin123!" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "🌐 URLs:" -ForegroundColor White
        Write-Host "   Frontend: https://perfumeria-sistema-production-1f4b.up.railway.app" -ForegroundColor Cyan
        Write-Host "   Backend: https://backend-perfumeria-production-2dce.up.railway.app" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "🔧 CONFIGURAR EN RAILWAY:" -ForegroundColor White
        Write-Host ""
        Write-Host "   Backend - Variables:" -ForegroundColor Yellow
        Write-Host "   DATABASE_URL=postgresql://...@postgres.railway.internal:5432/railway" -ForegroundColor Gray
        Write-Host "   JWT_SECRET=perfumeria-super-secret-key..." -ForegroundColor Gray
        Write-Host "   TZ=America/Bogota" -ForegroundColor Gray
        Write-Host "   PORT=3000" -ForegroundColor Gray
        Write-Host "   NODE_ENV=production" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   Frontend - Variables:" -ForegroundColor Yellow
        Write-Host "   VITE_API_URL=https://backend-perfumeria-production-2dce.up.railway.app/api" -ForegroundColor Gray
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
    }
    else {
        Write-Host ""
        Write-Host "❌ Error al insertar datos iniciales" -ForegroundColor Red
    }
}
else {
    Write-Host ""
    Write-Host "❌ Error al aplicar schema" -ForegroundColor Red
}

Write-Host ""

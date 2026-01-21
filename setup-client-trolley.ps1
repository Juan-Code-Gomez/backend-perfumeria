# Script para configurar nueva base de datos de cliente en Railway
# Base de datos: trolley (45234)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 SETUP NUEVO CLIENTE - RAILWAY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Información del cliente
Write-Host "📍 Cliente: Nuevo ambiente Railway" -ForegroundColor Yellow
Write-Host "📍 Base de datos: trolley.proxy.rlwy.net:45234" -ForegroundColor Yellow
Write-Host "📍 Backend: backend-perfumeria-production-2dce.up.railway.app" -ForegroundColor Yellow
Write-Host "📍 Frontend: perfumeria-sistema-production-1f4b.up.railway.app" -ForegroundColor Yellow
Write-Host ""

# Configurar URL de la base de datos
$DATABASE_URL = "postgresql://postgres:wGcAKDSKDggpmWPulURTqPDEYOPovsPy@trolley.proxy.rlwy.net:45234/railway"
$env:DATABASE_URL = $DATABASE_URL

Write-Host "✅ Variable DATABASE_URL configurada" -ForegroundColor Green
Write-Host ""

# Confirmar antes de continuar
Write-Host "⚠️  IMPORTANTE: Este script va a:" -ForegroundColor Yellow
Write-Host "   1. Crear todas las tablas en la base de datos" -ForegroundColor White
Write-Host "   2. Insertar datos iniciales (roles, usuario admin, etc.)" -ForegroundColor White
Write-Host ""
$confirm = Read-Host "¿Continuar? (s/n)"

if ($confirm -ne "s" -and $confirm -ne "S" -and $confirm -ne "si" -and $confirm -ne "SI") {
    Write-Host "❌ Operación cancelada" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📦 PASO 1: Ejecutar Migraciones" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migraciones completadas exitosamente" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "🌱 PASO 2: Insertar Datos Iniciales" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    npx prisma db seed
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Datos iniciales insertados correctamente" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "🎉 SETUP COMPLETADO" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 DATOS CREADOS:" -ForegroundColor White
        Write-Host "   ✅ Todas las tablas del schema" -ForegroundColor Green
        Write-Host "   ✅ Roles: SUPER_ADMIN, ADMIN, VENDEDOR, USER" -ForegroundColor Green
        Write-Host "   ✅ Usuario administrador creado" -ForegroundColor Green
        Write-Host "   ✅ Módulos del sistema con permisos" -ForegroundColor Green
        Write-Host "   ✅ Categorías y unidades básicas" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 CREDENCIALES DE ACCESO:" -ForegroundColor White
        Write-Host "   Usuario: admin" -ForegroundColor Cyan
        Write-Host "   Contraseña: Admin123!" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "🌐 FRONTEND:" -ForegroundColor White
        Write-Host "   https://perfumeria-sistema-production-1f4b.up.railway.app" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "🔧 PRÓXIMOS PASOS:" -ForegroundColor White
        Write-Host "   1. Verificar variables de entorno en Railway:" -ForegroundColor Yellow
        Write-Host "      - DATABASE_URL (URL interna preferida)" -ForegroundColor Gray
        Write-Host "      - JWT_SECRET" -ForegroundColor Gray
        Write-Host "      - TZ=America/Bogota (¡IMPORTANTE!)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   2. Configurar VITE_API_URL en el frontend" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   3. Probar login en el frontend" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
    }
    else {
        Write-Host ""
        Write-Host "❌ Error al insertar datos iniciales" -ForegroundColor Red
        Write-Host ""
        Write-Host "Posibles soluciones:" -ForegroundColor Yellow
        Write-Host "1. Verificar que las migraciones se ejecutaron correctamente" -ForegroundColor White
        Write-Host "2. Revisar el archivo prisma/seed.ts" -ForegroundColor White
        Write-Host "3. Ver logs detallados arriba" -ForegroundColor White
    }
}
else {
    Write-Host ""
    Write-Host "❌ Error al ejecutar migraciones" -ForegroundColor Red
    Write-Host ""
    Write-Host "Posibles soluciones:" -ForegroundColor Yellow
    Write-Host "1. Verificar la URL de la base de datos" -ForegroundColor White
    Write-Host "2. Verificar conexión a internet" -ForegroundColor White
    Write-Host "3. Verificar que la base de datos esté accesible" -ForegroundColor White
    Write-Host "4. Ejecutar 'npx prisma migrate status'" -ForegroundColor White
}

Write-Host ""

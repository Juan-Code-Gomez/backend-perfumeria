# Setup para nuevo cliente - Railway (trolley)
# Script simplificado sin emojis problematicos

Write-Host ""
Write-Host "========================================"
Write-Host "SETUP NUEVO CLIENTE - RAILWAY"
Write-Host "========================================"
Write-Host ""

# Configurar URL de la base de datos
$DATABASE_URL = "postgresql://postgres:wGcAKDSKDggpmWPulURTqPDEYOPovsPy@trolley.proxy.rlwy.net:45234/railway"
$env:DATABASE_URL = $DATABASE_URL

Write-Host "Base de datos: trolley.proxy.rlwy.net:45234"
Write-Host ""

# Confirmar
Write-Host "IMPORTANTE: Este script va a:"
Write-Host "  1. ELIMINAR todas las tablas existentes (si hay)"
Write-Host "  2. Crear TODAS las tablas del schema"
Write-Host "  3. Insertar datos iniciales"
Write-Host ""
$confirm = Read-Host "Continuar? (s/n)"

if ($confirm -ne "s" -and $confirm -ne "S") {
    Write-Host "Operacion cancelada"
    exit
}

Write-Host ""
Write-Host "========================================"
Write-Host "PASO 1: Aplicar Schema"
Write-Host "========================================"
Write-Host ""

# Usar db push con force-reset para limpiar y crear todo
npx prisma db push --force-reset --skip-generate --accept-data-loss

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "OK - Todas las tablas creadas correctamente"
    Write-Host ""
    
    Write-Host "========================================"
    Write-Host "PASO 2: Insertar Datos Iniciales"
    Write-Host "========================================"
    Write-Host ""
    
    npx prisma db seed
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================"
        Write-Host "SETUP COMPLETADO EXITOSAMENTE"
        Write-Host "========================================"
        Write-Host ""
        Write-Host "DATOS CREADOS:"
        Write-Host "  - TODAS las tablas del schema (36+)"
        Write-Host "  - Roles: SUPER_ADMIN, ADMIN, VENDEDOR, USER"
        Write-Host "  - Usuario admin creado"
        Write-Host "  - Modulos del sistema con permisos"
        Write-Host "  - Categorias y unidades basicas"
        Write-Host ""
        Write-Host "CREDENCIALES:"
        Write-Host "  Usuario: admin"
        Write-Host "  Password: Admin123!"
        Write-Host ""
        Write-Host "URLS:"
        Write-Host "  Frontend: https://perfumeria-sistema-production-1f4b.up.railway.app"
        Write-Host "  Backend: https://backend-perfumeria-production-2dce.up.railway.app"
        Write-Host ""
        Write-Host "CONFIGURAR EN RAILWAY:"
        Write-Host ""
        Write-Host "  Backend - Variables:"
        Write-Host "    DATABASE_URL (usar URL interna: postgres.railway.internal)"
        Write-Host "    JWT_SECRET"
        Write-Host "    TZ=America/Bogota (CRITICO)"
        Write-Host "    PORT=3000"
        Write-Host "    NODE_ENV=production"
        Write-Host ""
        Write-Host "  Frontend - Variables:"
        Write-Host "    VITE_API_URL=https://backend-perfumeria-production-2dce.up.railway.app/api"
        Write-Host ""
        Write-Host "========================================"
    }
    else {
        Write-Host ""
        Write-Host "ERROR - al insertar datos iniciales"
    }
}
else {
    Write-Host ""
    Write-Host "ERROR - al aplicar schema"
}

Write-Host ""

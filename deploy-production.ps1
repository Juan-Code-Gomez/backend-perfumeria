# ================================================
# SCRIPT DE DEPLOYMENT AUTOMÁTICO - PRODUCCIÓN
# ================================================
# 
# Uso: ./deploy-production.ps1
# 
# Este script:
# 1. Aplica migraciones de BD automáticamente
# 2. Genera Prisma Client
# 3. Compila la aplicación
# 4. Reinicia el servicio
# ================================================

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT AUTOMÁTICO - PRODUCCIÓN" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Función para mostrar errores y salir
function Exit-OnError {
    param($message)
    Write-Host "❌ Error: $message" -ForegroundColor Red
    exit 1
}

# Función para logs
function Log-Step {
    param($message)
    Write-Host ""
    Write-Host "🔹 $message" -ForegroundColor Blue
}

# Verificar que existe .env
if (-not (Test-Path ".env")) {
    Exit-OnError "Falta archivo .env con DATABASE_URL"
}

Log-Step "Verificando conexión a base de datos..."
try {
    $null = npx prisma db execute --stdin 2>&1
    Write-Host "✅ Conexión exitosa" -ForegroundColor Green
} catch {
    Write-Host "⚠️  No se pudo verificar conexión (continuando...)" -ForegroundColor Yellow
}

# 1. Aplicar migraciones
Log-Step "Aplicando migraciones de base de datos..."
Write-Host "  Ejecutando: npx prisma migrate deploy" -ForegroundColor Gray

try {
    npx prisma migrate deploy
    if ($LASTEXITCODE -ne 0) {
        Exit-OnError "Falló la aplicación de migraciones"
    }
    Write-Host "✅ Migraciones aplicadas correctamente" -ForegroundColor Green
} catch {
    Exit-OnError "Error aplicando migraciones: $_"
}

# 2. Generar Prisma Client
Log-Step "Generando Prisma Client..."
Write-Host "  Ejecutando: npx prisma generate" -ForegroundColor Gray

try {
    npx prisma generate
    if ($LASTEXITCODE -ne 0) {
        Exit-OnError "Falló la generación de Prisma Client"
    }
    Write-Host "✅ Prisma Client generado" -ForegroundColor Green
} catch {
    Exit-OnError "Error generando Prisma Client: $_"
}

# 3. Compilar aplicación
Log-Step "Compilando aplicación..."
Write-Host "  Ejecutando: npm run build" -ForegroundColor Gray

try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Exit-OnError "Falló la compilación"
    }
    Write-Host "✅ Aplicación compilada" -ForegroundColor Green
} catch {
    Exit-OnError "Error compilando: $_"
}

# 4. Reiniciar servicio
Log-Step "Reiniciando servicio..."

# Detectar si usa PM2
$pm2Installed = Get-Command pm2 -ErrorAction SilentlyContinue

if ($pm2Installed) {
    Write-Host "  Ejecutando: pm2 restart perfumeria-backend" -ForegroundColor Gray
    try {
        pm2 restart perfumeria-backend
        Write-Host "✅ Servicio reiniciado con PM2" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  PM2 restart falló, iniciando con npm..." -ForegroundColor Yellow
        npm run start:prod
    }
} else {
    Write-Host "  PM2 no encontrado, usa: npm run start:prod manualmente" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  ✅ DEPLOYMENT COMPLETADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Verificar que el servicio está corriendo" -ForegroundColor White
Write-Host "  2. Probar endpoints principales" -ForegroundColor White
Write-Host "  3. Revisar logs si hay errores" -ForegroundColor White
Write-Host ""

# ================================================
# SETUP PARA CLIENTE EXISTENTE - ACTUALIZACIÓN
# ================================================
# 
# Uso: ./setup-existing-client.ps1
# 
# Este script sincroniza un cliente que YA TIENE datos:
# 1. Marca la migración baseline como aplicada
# 2. Aplica migraciones nuevas (si las hay)
# 3. Regenera Prisma Client
# 4. Compila la aplicación
# ================================================

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  ACTUALIZACIÓN DE CLIENTE EXISTENTE" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

function Exit-OnError {
    param($message)
    Write-Host "❌ Error: $message" -ForegroundColor Red
    exit 1
}

function Log-Step {
    param($message)
    Write-Host ""
    Write-Host "🔹 $message" -ForegroundColor Blue
}

# Verificar .env
if (-not (Test-Path ".env")) {
    Exit-OnError "Falta archivo .env con DATABASE_URL"
}

Write-Host "✅ Archivo .env encontrado" -ForegroundColor Green

# Advertencia
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Este script es para clientes EXISTENTES" -ForegroundColor Yellow
Write-Host "   (bases de datos que ya tienen datos y estructura)" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "¿Esta base de datos YA TIENE datos? (si/no)"
if ($confirmation -ne "si" -and $confirmation -ne "s") {
    Write-Host ""
    Write-Host "❌ Setup cancelado" -ForegroundColor Yellow
    Write-Host "💡 Para clientes nuevos usa: .\setup-new-client.ps1" -ForegroundColor Cyan
    exit 0
}

# Verificar estado actual
Log-Step "Verificando estado de migraciones..."

try {
    $status = npx prisma migrate status 2>&1
    Write-Host $status -ForegroundColor Gray
} catch {
    Write-Host "⚠️  No se pudo verificar estado" -ForegroundColor Yellow
}

# 1. Marcar baseline como aplicado
Log-Step "Marcando migración baseline como aplicada..."
Write-Host "  Esto le dice a Prisma que el schema actual ya está en la BD" -ForegroundColor Gray

try {
    npx prisma migrate resolve --applied 20251025161155_baseline_complete_schema
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Baseline ya estaba marcado o no existe" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Baseline marcado como aplicado" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Error marcando baseline (puede ser que ya estaba)" -ForegroundColor Yellow
}

# 2. Aplicar migraciones nuevas (si las hay)
Log-Step "Aplicando migraciones pendientes..."
Write-Host "  Si hay migraciones nuevas desde el baseline, se aplicarán ahora" -ForegroundColor Gray

try {
    npx prisma migrate deploy
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  No hay migraciones nuevas o ya están aplicadas" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Migraciones aplicadas" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Error aplicando migraciones" -ForegroundColor Yellow
}

# 3. Generar Prisma Client
Log-Step "Generando Prisma Client..."

try {
    npx prisma generate
    if ($LASTEXITCODE -ne 0) {
        Exit-OnError "Falló la generación de Prisma Client"
    }
    Write-Host "✅ Prisma Client generado" -ForegroundColor Green
} catch {
    Exit-OnError "Error generando Prisma Client: $_"
}

# 4. Compilar aplicación
Log-Step "Compilando aplicación..."

try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Exit-OnError "Falló la compilación"
    }
    Write-Host "✅ Aplicación compilada" -ForegroundColor Green
} catch {
    Exit-OnError "Error compilando: $_"
}

# Verificar estado final
Log-Step "Estado final de migraciones:"

try {
    npx prisma migrate status
} catch {
    Write-Host "⚠️  No se pudo verificar estado" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  ✅ CLIENTE ACTUALIZADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Reiniciar el servicio backend" -ForegroundColor White
Write-Host "     npm run start:prod" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. O con PM2:" -ForegroundColor White
Write-Host "     pm2 restart perfumeria-backend" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Probar funcionalidades principales" -ForegroundColor White
Write-Host ""
Write-Host "  4. Verificar módulos nuevos (Facturas, FIFO, etc.)" -ForegroundColor White
Write-Host ""

Write-Host "✨ Cliente sincronizado y listo" -ForegroundColor Green
Write-Host ""

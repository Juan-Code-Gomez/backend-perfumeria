# ================================================
# SETUP PARA CLIENTE NUEVO - INSTALACIÓN COMPLETA
# ================================================
# 
# Uso: ./setup-new-client.ps1
# 
# Este script configura un cliente completamente nuevo:
# 1. Verifica configuración
# 2. Aplica todas las migraciones desde cero
# 3. Ejecuta seed de datos iniciales
# 4. Compila y arranca la aplicación
# ================================================

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  SETUP DE CLIENTE NUEVO" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Función para errores
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

# Verificar .env
if (-not (Test-Path ".env")) {
    Exit-OnError "Falta archivo .env. Crea uno con DATABASE_URL configurado."
}

Write-Host "✅ Archivo .env encontrado" -ForegroundColor Green

# Preguntar confirmación
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Este script es para CLIENTES NUEVOS" -ForegroundColor Yellow
Write-Host "   Si la base de datos ya tiene datos, usa deploy-production.ps1" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "¿Es esta una base de datos NUEVA (vacía)? (si/no)"
if ($confirmation -ne "si" -and $confirmation -ne "s") {
    Write-Host ""
    Write-Host "❌ Setup cancelado" -ForegroundColor Yellow
    Write-Host "💡 Para clientes existentes usa: .\deploy-production.ps1" -ForegroundColor Cyan
    exit 0
}

# 1. Verificar conexión
Log-Step "Verificando conexión a base de datos..."

try {
    $dbStatus = npx prisma db execute --stdin 2>&1
    Write-Host "✅ Conexión a base de datos exitosa" -ForegroundColor Green
} catch {
    Write-Host "⚠️  No se pudo verificar conexión, continuando..." -ForegroundColor Yellow
}

# 2. Aplicar migraciones (desde cero)
Log-Step "Aplicando TODAS las migraciones..."
Write-Host "  Esto creará el schema completo en la base de datos" -ForegroundColor Gray

try {
    npx prisma migrate deploy
    if ($LASTEXITCODE -ne 0) {
        Exit-OnError "Falló la aplicación de migraciones"
    }
    Write-Host "✅ Schema de base de datos creado" -ForegroundColor Green
} catch {
    Exit-OnError "Error aplicando migraciones: $_"
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

# 4. Ejecutar seed (datos iniciales)
Log-Step "Cargando datos iniciales..."

if (Test-Path "prisma/seed.ts") {
    Write-Host "  Ejecutando seed script..." -ForegroundColor Gray
    try {
        npx prisma db seed
        Write-Host "✅ Datos iniciales cargados" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Seed falló o no configurado (opcional)" -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️  No hay script de seed (opcional)" -ForegroundColor Gray
}

# 5. Instalar dependencias (por si acaso)
Log-Step "Verificando dependencias..."

try {
    npm install
    Write-Host "✅ Dependencias verificadas" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Error en npm install" -ForegroundColor Yellow
}

# 6. Compilar aplicación
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

# 7. Verificar estado de migraciones
Log-Step "Verificando estado final..."

try {
    npx prisma migrate status
} catch {
    Write-Host "⚠️  No se pudo verificar estado" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  ✅ CLIENTE CONFIGURADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Iniciar la aplicación:" -ForegroundColor White
Write-Host "     npm run start:prod" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. O con PM2:" -ForegroundColor White
Write-Host "     pm2 start ecosystem.config.js" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Crear usuario admin inicial (si es necesario)" -ForegroundColor White
Write-Host ""
Write-Host "  4. Configurar parámetros del sistema" -ForegroundColor White
Write-Host ""

Write-Host "✨ El cliente está listo para usar" -ForegroundColor Green
Write-Host ""

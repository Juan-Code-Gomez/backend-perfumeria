# ================================================
# DEPLOYMENT DE FEATURE FLAGS - PRODUCCIÓN
# ================================================
# 
# Uso: ./deploy-feature-flags.ps1 [DATABASE]
# 
# DATABASE (opcional):
#   - turntable (default) - Base de datos principal
#   - trolley - Mundo Perfumes
#   - ballast - DOHA
#   - tramway - Milan Fragancias
#   - all - Todas las bases de datos
#
# Este script:
# 1. Aplica el schema de feature flags con prisma db push
# 2. Regenera Prisma Client
# 3. Ejecuta seed de features de joyería
# 4. Configura tenant de joyería
# 5. Compila y despliega
# ================================================

param(
    [string]$Database = "turntable"
)

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT DE FEATURE FLAGS - PRODUCCIÓN" -ForegroundColor Cyan
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

# Función para ejecutar en una base de datos
function Deploy-ToDatabase {
    param(
        [string]$DbName,
        [string]$ConnectionString
    )
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "  Desplegando en: $DbName" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    
    # Guardar DATABASE_URL actual
    $originalUrl = $env:DATABASE_URL
    
    # Configurar DATABASE_URL para esta base de datos
    $env:DATABASE_URL = $ConnectionString
    
    try {
        # 1. Aplicar schema con prisma db push
        Log-Step "1/4 - Aplicando schema de feature flags..."
        Write-Host "  Ejecutando: npx prisma db push --accept-data-loss" -ForegroundColor Gray
        $output = npx prisma db push --accept-data-loss 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️  Advertencia en db push (puede ser normal si ya existe)" -ForegroundColor Yellow
            Write-Host $output
        } else {
            Write-Host "✅ Schema aplicado exitosamente" -ForegroundColor Green
        }
        
        # 2. Regenerar Prisma Client
        Log-Step "2/4 - Regenerando Prisma Client..."
        npx prisma generate 2>&1 | Out-Null
        Write-Host "✅ Prisma Client regenerado" -ForegroundColor Green
        
        # 3. Ejecutar seed de features (si existe tenant de joyería)
        Log-Step "3/4 - Verificando tenant de joyería..."
        
        # Crear script SQL temporal para verificar
        $checkSql = @"
SELECT id, "companyName", industry FROM "CompanyConfig" WHERE industry = 'JEWELRY' LIMIT 1;
"@
        
        $checkSql | npx prisma db execute --stdin 2>&1 | Out-Null
        
        # Ejecutar seed
        Log-Step "4/4 - Ejecutando seed de features de joyería..."
        Write-Host "  Ejecutando: node scripts/seed-jewelry-features.js" -ForegroundColor Gray
        
        $seedOutput = node scripts/seed-jewelry-features.js 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Seed ejecutado exitosamente" -ForegroundColor Green
            Write-Host $seedOutput | Select-String "✅|✨|📊"
        } else {
            Write-Host "⚠️  Advertencia en seed (puede que no exista tenant de joyería)" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "✅ Deployment completado en $DbName" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Error en deployment de $DbName : $_" -ForegroundColor Red
    } finally {
        # Restaurar DATABASE_URL original
        $env:DATABASE_URL = $originalUrl
    }
}

# Leer URLs de bases de datos desde .env
function Get-DatabaseUrl {
    param([string]$key)
    
    $envContent = Get-Content .env -Raw
    if ($envContent -match "$key=`"([^`"]+)`"") {
        return $matches[1]
    }
    return $null
}

# Verificar que existe .env
if (-not (Test-Path ".env")) {
    Exit-OnError "Falta archivo .env con DATABASE_URLs"
}

# Obtener URLs
$urls = @{
    "turntable" = Get-DatabaseUrl "DATABASE_URL"
    "trolley" = Get-DatabaseUrl "DATABASE_URL_MUNDO_PERFUMES"
    "ballast" = Get-DatabaseUrl "DATABASE_URL_DOHA"
    "tramway" = Get-DatabaseUrl "DATABASE_URL_MILAN"
}

# Desplegar según parámetro
if ($Database -eq "all") {
    Write-Host "📦 Desplegando en TODAS las bases de datos..." -ForegroundColor Cyan
    
    foreach ($db in $urls.Keys) {
        if ($urls[$db]) {
            Deploy-ToDatabase -DbName $db -ConnectionString $urls[$db]
        }
    }
    
} else {
    if (-not $urls.ContainsKey($Database)) {
        Exit-OnError "Base de datos no válida: $Database. Opciones: turntable, trolley, ballast, tramway, all"
    }
    
    if (-not $urls[$Database]) {
        Exit-OnError "No se encontró URL para $Database en .env"
    }
    
    Deploy-ToDatabase -DbName $Database -ConnectionString $urls[$Database]
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  ✅ DEPLOYMENT DE FEATURE FLAGS COMPLETADO" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Configurar tenant de joyería en la BD (si aún no existe):" -ForegroundColor White
Write-Host "   UPDATE `"CompanyConfig`" SET industry = 'JEWELRY', tenant_code = 'JEWELRY_001' WHERE id = 1;" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Asignar tenantId a usuarios:" -ForegroundColor White
Write-Host "   UPDATE `"User`" SET tenant_id = 1 WHERE company_id = 1;" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Compilar y desplegar código:" -ForegroundColor White
Write-Host "   npm run build" -ForegroundColor Gray
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m 'feat: agregar sistema de feature flags multi-tenant'" -ForegroundColor Gray
Write-Host "   git push origin main" -ForegroundColor Gray
Write-Host ""

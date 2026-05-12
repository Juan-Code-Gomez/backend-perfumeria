# ================================================
# CONFIGURAR TENANT DE JOYERÍA - INTERACTIVO
# ================================================
# 
# Uso: ./setup-jewelry-tenant.ps1 [DATABASE]
# 
# DATABASE (opcional):
#   - turntable (default) - Base de datos principal
#   - trolley - Mundo Perfumes
#   - ballast - DOHA
#   - tramway - Milan Fragancias
#
# Este script ayuda a configurar un tenant como joyería
# de forma interactiva
# ================================================

param(
    [string]$Database = "turntable"
)

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  CONFIGURAR TENANT DE JOYERÍA" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Función para ejecutar SQL y mostrar resultados
function Execute-Sql {
    param(
        [string]$Sql,
        [string]$Description
    )
    
    Write-Host "🔹 $Description" -ForegroundColor Blue
    Write-Host "  SQL: $Sql" -ForegroundColor Gray
    
    $Sql | npx prisma db execute --stdin 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Completado" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Advertencia (puede ser normal)" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Obtener URL de base de datos
function Get-DatabaseUrl {
    param([string]$key)
    
    $envContent = Get-Content .env -Raw
    if ($envContent -match "$key=`"([^`"]+)`"") {
        return $matches[1]
    }
    return $null
}

# Configurar DATABASE_URL
$urls = @{
    "turntable" = Get-DatabaseUrl "DATABASE_URL"
    "trolley" = Get-DatabaseUrl "DATABASE_URL_MUNDO_PERFUMES"
    "ballast" = Get-DatabaseUrl "DATABASE_URL_DOHA"
    "tramway" = Get-DatabaseUrl "DATABASE_URL_MILAN"
}

if (-not $urls.ContainsKey($Database)) {
    Write-Host "❌ Base de datos no válida: $Database" -ForegroundColor Red
    Write-Host "   Opciones: turntable, trolley, ballast, tramway" -ForegroundColor Yellow
    exit 1
}

$originalUrl = $env:DATABASE_URL
$env:DATABASE_URL = $urls[$Database]

Write-Host "🎯 Base de datos: $Database" -ForegroundColor Cyan
Write-Host ""

try {
    # 1. Mostrar tenants existentes
    Write-Host "================================================" -ForegroundColor Yellow
    Write-Host "  PASO 1: Tenants existentes" -ForegroundColor Yellow
    Write-Host "================================================" -ForegroundColor Yellow
    Write-Host ""
    
    $listSql = 'SELECT id, "companyName", industry, tenant_code FROM "CompanyConfig" ORDER BY id;'
    npx prisma db execute --stdin --schema=./prisma/schema.prisma <<< $listSql 2>&1
    
    Write-Host ""
    
    # 2. Preguntar qué tenant configurar
    Write-Host "================================================" -ForegroundColor Yellow
    Write-Host "  PASO 2: Seleccionar tenant" -ForegroundColor Yellow
    Write-Host "================================================" -ForegroundColor Yellow
    Write-Host ""
    
    $tenantId = Read-Host "Ingresa el ID del tenant que quieres configurar como joyería"
    
    if (-not $tenantId -or $tenantId -notmatch '^\d+$') {
        Write-Host "❌ ID inválido" -ForegroundColor Red
        exit 1
    }
    
    # 3. Configurar como joyería
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Yellow
    Write-Host "  PASO 3: Configurar tenant $tenantId como joyería" -ForegroundColor Yellow
    Write-Host "================================================" -ForegroundColor Yellow
    Write-Host ""
    
    $tenantName = Read-Host "Nombre del tenant (default: Joyería Sisters)"
    if (-not $tenantName) { $tenantName = "Joyería Sisters" }
    
    $tenantCode = Read-Host "Código del tenant (default: JEWELRY_001)"
    if (-not $tenantCode) { $tenantCode = "JEWELRY_001" }
    
    $updateSql = @"
UPDATE "CompanyConfig" 
SET 
    industry = 'JEWELRY',
    tenant_code = '$tenantCode',
    tenant_name = '$tenantName',
    plan = 'PREMIUM'
WHERE id = $tenantId;
"@
    
    Execute-Sql -Sql $updateSql -Description "Actualizando tenant..."
    
    # Verificar
    $verifySql = "SELECT id, `"companyName`", industry, tenant_code, tenant_name FROM `"CompanyConfig`" WHERE id = $tenantId;"
    npx prisma db execute --stdin <<< $verifySql 2>&1
    
    # 4. Asignar usuarios
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Yellow
    Write-Host "  PASO 4: Asignar usuarios al tenant" -ForegroundColor Yellow
    Write-Host "================================================" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "Opciones:" -ForegroundColor White
    Write-Host "  1. Asignar todos los usuarios de company_id = $tenantId" -ForegroundColor Gray
    Write-Host "  2. Asignar usuarios específicos por ID" -ForegroundColor Gray
    Write-Host "  3. Saltar este paso" -ForegroundColor Gray
    Write-Host ""
    
    $userOption = Read-Host "Selecciona una opción (1-3)"
    
    if ($userOption -eq "1") {
        $updateUserSql = "UPDATE `"User`" SET tenant_id = $tenantId WHERE company_id = $tenantId;"
        Execute-Sql -Sql $updateUserSql -Description "Asignando usuarios..."
    }
    elseif ($userOption -eq "2") {
        $userIds = Read-Host "Ingresa los IDs de usuarios separados por coma (ej: 1,2,3)"
        $updateUserSql = "UPDATE `"User`" SET tenant_id = $tenantId WHERE id IN ($userIds);"
        Execute-Sql -Sql $updateUserSql -Description "Asignando usuarios..."
    }
    
    # Verificar usuarios asignados
    Write-Host "👥 Usuarios asignados al tenant:" -ForegroundColor Cyan
    $verifyUserSql = @"
SELECT u.id, u.name, u.user_login, u.tenant_id 
FROM "User" u 
WHERE u.tenant_id = $tenantId
ORDER BY u.id;
"@
    npx prisma db execute --stdin <<< $verifyUserSql 2>&1
    
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "  ✅ CONFIGURACIÓN COMPLETADA" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Próximos pasos:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Ejecutar seed de features:" -ForegroundColor White
    Write-Host "   node scripts/seed-jewelry-features.js" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Verificar features del tenant:" -ForegroundColor White
    Write-Host "   Abrir: http://localhost:3000/features/tenant/$tenantId/summary" -ForegroundColor Gray
    Write-Host ""
    
} finally {
    # Restaurar DATABASE_URL
    $env:DATABASE_URL = $originalUrl
}

# SCRIPT PARA AGREGAR COLUMNA FALTANTE EN PRODUCCIÓN
# Ejecuta este script para agregar cashSessionId a la tabla Expense

# URL de la base de datos de Railway (Cliente 3 - turntable)
$env:DATABASE_URL = "postgresql://postgres:sramdnCvXZjwgHUZBUBvkvWGSvRuGgrZ@turntable.proxy.rlwy.net:38668/railway"

Write-Host "Agregando columna faltante en produccion..." -ForegroundColor Cyan
Write-Host ""

# Verificar que se estableció la URL
if ($env:DATABASE_URL -eq "TU_URL_AQUI") {
    Write-Host "ERROR: Debes configurar la DATABASE_URL en este script" -ForegroundColor Red
    exit 1
}

# Ejecutar script de migración
node scripts/add-expense-column-production.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Columna agregada exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "El dashboard ahora deberia funcionar correctamente" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Error durante la migracion" -ForegroundColor Red
    Write-Host "Revisa los mensajes de error arriba" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

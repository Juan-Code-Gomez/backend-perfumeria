# SCRIPT DE MIGRACIÓN RÁPIDA PARA RAILWAY
# Ejecuta este script para migrar la base de datos de producción

# INSTRUCCIONES:
# 1. Copia la DATABASE_URL de Railway
# 2. Pégala en la línea de abajo reemplazando "TU_URL_AQUI"
# 3. Ejecuta este script: .\migrate-production.ps1

# URL de la base de datos de Railway (reemplazar con la tuya)
$env:DATABASE_URL = "postgresql://postgres:sramdnCvXZjwgHUZBUBvkvWGSvRuGgrZ@turntable.proxy.rlwy.net:38668/railway"

Write-Host "Iniciando migracion de produccion..." -ForegroundColor Cyan
Write-Host ""

# Verificar que se estableció la URL
if ($env:DATABASE_URL -eq "TU_URL_AQUI") {
    Write-Host "ERROR: Debes configurar la DATABASE_URL en este script" -ForegroundColor Red
    Write-Host ""
    Write-Host "Pasos:" -ForegroundColor Yellow
    Write-Host "   1. Abre Railway - PostgreSQL - Connection" -ForegroundColor White
    Write-Host "   2. Copia la Postgres Connection URL" -ForegroundColor White
    Write-Host "   3. Edita este archivo y pega la URL en linea 10" -ForegroundColor White
    Write-Host "   4. Ejecuta nuevamente: .\migrate-production.ps1" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Ejecutar script de migración
node scripts/production-migration-remove-constraints.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Migracion completada!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximos pasos:" -ForegroundColor Cyan
    Write-Host "   1. git add ." -ForegroundColor White
    Write-Host "   2. git commit -m 'feat: multiples cierres por dia'" -ForegroundColor White
    Write-Host "   3. git push origin main" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Error durante la migracion" -ForegroundColor Red
    Write-Host "Revisa los mensajes de error arriba" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

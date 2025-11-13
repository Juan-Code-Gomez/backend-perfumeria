# SINCRONIZAR SCHEMA CON PRODUCCIÓN
# Agrega todas las columnas faltantes de una vez

$env:DATABASE_URL = "postgresql://postgres:sramdnCvXZjwgHUZBUBvkvWGSvRuGgrZ@turntable.proxy.rlwy.net:38668/railway"

Write-Host "Sincronizando schema con produccion..." -ForegroundColor Cyan
Write-Host ""

node scripts/sync-schema-production.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Schema sincronizado exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ahora haz un push para que Railway reinicie con el schema actualizado:" -ForegroundColor Cyan
    Write-Host "   git add ." -ForegroundColor White
    Write-Host "   git commit -m 'chore: schema sincronizado con produccion'" -ForegroundColor White
    Write-Host "   git push origin main" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Error durante la sincronizacion" -ForegroundColor Red
    exit 1
}

# SINCRONIZAR SCHEMA EN LAS 3 BASES DE DATOS
# Agrega las columnas faltantes en todas las BDs de clientes

Write-Host "Sincronizando schema en las 3 bases de datos..." -ForegroundColor Cyan
Write-Host ""

node scripts/sync-all-databases.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "¡Sincronizacion completada en todas las BDs!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ahora Railway reiniciara automaticamente" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Error durante la sincronizacion" -ForegroundColor Red
    exit 1
}

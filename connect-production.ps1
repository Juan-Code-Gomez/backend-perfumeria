# 🔄 CAMBIAR A PRODUCCIÓN

Write-Host ""
Write-Host "⚠️  CONECTANDO A BD DE PRODUCCIÓN..." -ForegroundColor Yellow
Write-Host ""

# Backup
if (Test-Path .env) {
    Copy-Item .env .env.backup -Force
    Write-Host "✓ Backup creado" -ForegroundColor Green
}

# Copiar archivo de producción
Copy-Item .env.production.local .env -Force

Write-Host "✓ Conexión cambiada a PRODUCCIÓN" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 DATABASE_URL: shinkansen.proxy.rlwy.net:21931" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Ahora puedes ejecutar:" -ForegroundColor Cyan
Write-Host "   node diagnose-dashboard.js" -ForegroundColor White
Write-Host ""

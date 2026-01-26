Write-Host "🔄 Aplicando migración a base de datos trolley..." -ForegroundColor Cyan

# URL de conexión del cliente trolley (actualizar con credenciales correctas)
$env:DATABASE_URL = "postgresql://postgres:PASSWORD_CORRECTO@trolley.proxy.rlwy.net:45234/railway"

# Aplicar migración
node apply-ticket-config-migration.js

Write-Host ""
Write-Host "✅ Migración completada en trolley" -ForegroundColor Green

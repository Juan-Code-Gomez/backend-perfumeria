# 🔄 SWITCH ENTRE BD LOCAL Y PRODUCCIÓN

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🔄 CAMBIAR CONEXIÓN DE BASE DE DATOS            ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar qué BD está configurada actualmente
$currentEnv = Get-Content .env | Select-String "DATABASE_URL"
Write-Host "📊 Conexión actual:" -ForegroundColor Yellow
Write-Host "  $currentEnv" -ForegroundColor Gray
Write-Host ""

# Menú
Write-Host "Selecciona una opción:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  [1] Conectar a PRODUCCIÓN (Railway)" -ForegroundColor Yellow
Write-Host "  [2] Conectar a LOCAL (localhost:5432)" -ForegroundColor Green
Write-Host "  [3] Cancelar" -ForegroundColor Gray
Write-Host ""

$option = Read-Host "Opción"

if ($option -eq "1") {
    Write-Host ""
    Write-Host "⚠️  CONECTANDO A PRODUCCIÓN..." -ForegroundColor Yellow
    Write-Host ""
    
    # Backup del .env actual
    Copy-Item .env .env.backup -Force
    Write-Host "✓ Backup creado: .env.backup" -ForegroundColor Green
    
    # Copiar .env.production.local a .env
    Copy-Item .env.production.local .env -Force
    Write-Host "✓ Conexión cambiada a PRODUCCIÓN" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 DATABASE_URL: postgresql://...shinkansen.proxy.rlwy.net:21931/railway" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
    Write-Host "   - Solo para lectura/diagnóstico" -ForegroundColor Yellow
    Write-Host "   - NO ejecutar migraciones destructivas" -ForegroundColor Yellow
    Write-Host "   - NO borrar datos" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 Comandos disponibles:" -ForegroundColor Cyan
    Write-Host "   node diagnose-dashboard.js    - Diagnosticar problema" -ForegroundColor White
    Write-Host "   npm run start                 - Iniciar servidor local" -ForegroundColor White
    Write-Host "   npx prisma studio             - Ver datos en Prisma Studio" -ForegroundColor White
    Write-Host ""
}
elseif ($option -eq "2") {
    Write-Host ""
    Write-Host "🏠 CONECTANDO A LOCAL..." -ForegroundColor Green
    Write-Host ""
    
    # Restaurar desde backup si existe
    if (Test-Path .env.backup) {
        Copy-Item .env.backup .env -Force
        Write-Host "✓ Conexión restaurada desde backup" -ForegroundColor Green
        Remove-Item .env.backup -Force
    }
    else {
        # Crear .env local por defecto
        $localEnv = @"
DATABASE_URL="postgresql://postgres:SJBYEwPzlxYkrgMupzDOWYTAUXICMCHT@postgres.railway.internal:5432/railway"
JWT_SECRET="perfumeria-super-secret-key-2024-milan-proyecto-backend-secure-12345"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
"@
        $localEnv | Set-Content .env
        Write-Host "✓ Conexión cambiada a LOCAL" -ForegroundColor Green
    }
    Write-Host ""
    Write-Host "🔗 DATABASE_URL: postgresql://localhost:5432/..." -ForegroundColor Cyan
    Write-Host ""
}
elseif ($option -eq "3") {
    Write-Host ""
    Write-Host "❌ Cancelado" -ForegroundColor Gray
    Write-Host ""
    exit
}
else {
    Write-Host ""
    Write-Host "❌ Opción inválida" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

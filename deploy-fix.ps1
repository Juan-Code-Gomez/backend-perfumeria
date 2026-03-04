# deploy-fix.ps1
# Script para hacer commit y deploy de la solución automáticamente

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 DEPLOY FIX - Auto-Migrate System" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "`n"

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: No estás en el directorio backend-perfumeria" -ForegroundColor Red
    Write-Host "   Ejecuta: cd 'd:\Proyecto Milan\codigo\backend-perfumeria'" -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Paso 1: Verificar archivos..." -ForegroundColor Yellow
$requiredFiles = @(
    "auto-migrate.js",
    "fix-now.js",
    "pre-start.js",
    "apply-fifo-config-multi-db.js"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file - NO ENCONTRADO" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n📋 Paso 2: Compilar backend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al compilar" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Backend compilado" -ForegroundColor Green

Write-Host "`n📝 Paso 3: Git add..." -ForegroundColor Yellow
git add .
Write-Host "   ✅ Archivos agregados" -ForegroundColor Green

Write-Host "`n💾 Paso 4: Git commit..." -ForegroundColor Yellow
git commit -m "fix: implement auto-migrate system to prevent DB schema errors on deploy

- Add auto-migrate.js for automatic schema migrations
- Update package.json to run auto-migrate before server start
- Add fix-now.js for emergency manual migrations
- Add pre-start.js wrapper for production
- Prevents 'column does not exist' errors on new deployments

Fixes issue where Railway deploys new code but DB schema isn't updated"

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Nada que commitear o ya está commiteado" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Commit realizado" -ForegroundColor Green
}

Write-Host "`n🚀 Paso 5: Git push..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al hacer push" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Push exitoso - Railway iniciará deploy automático" -ForegroundColor Green

Write-Host "`n"
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ DEPLOY COMPLETADO" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "`n"

Write-Host "⏭️  SIGUIENTE PASO:" -ForegroundColor Yellow
Write-Host "`n   Aplicar migración a cada cliente que está fallando:" -ForegroundColor White
Write-Host "`n   railway link [project-id]" -ForegroundColor Cyan
Write-Host "   railway run node fix-now.js" -ForegroundColor Cyan
Write-Host "   railway restart" -ForegroundColor Cyan
Write-Host "`n"

Write-Host "📖 Ver instrucciones completas en:" -ForegroundColor Yellow
Write-Host "   EJECUTAR_AHORA.md" -ForegroundColor Cyan
Write-Host "`n"

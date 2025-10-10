# Script para probar la exportación de inventario
# Ejecutar desde PowerShell en la carpeta backend-perfumeria

$baseUrl = "http://localhost:3000"

# 1. Primero obtener token (ajusta las credenciales)
Write-Host "🔐 Obteniendo token de autenticación..." -ForegroundColor Yellow

$loginBody = @{
    email = "admin@perfumeria.com"  # Ajusta según tu usuario admin
    password = "admin123"           # Ajusta según tu contraseña
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.access_token
    Write-Host "✅ Token obtenido exitosamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Error al obtener token: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Headers con token
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# 2. Probar exportación simple (GET)
Write-Host "`n📊 Probando exportación simple..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/products/export-inventory" -Method GET -Headers @{"Authorization" = "Bearer $token"} -OutFile "inventario_simple.xlsx"
    Write-Host "✅ Exportación simple exitosa - archivo: inventario_simple.xlsx" -ForegroundColor Green
} catch {
    Write-Host "❌ Error en exportación simple: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Probar exportación con opciones (POST)
Write-Host "`n📋 Probando exportación con opciones..." -ForegroundColor Yellow

$exportOptions = @{
    format = "excel"
    groupBy = "category"
    stockFilter = "low_stock"
    includePhysicalCountColumns = $true
    includeStockValue = $true
    includeImages = $false
    sortBy = "stock"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/products/export-inventory" -Method POST -Headers $headers -Body $exportOptions -OutFile "inventario_detallado.xlsx"
    Write-Host "✅ Exportación detallada exitosa - archivo: inventario_detallado.xlsx" -ForegroundColor Green
} catch {
    Write-Host "❌ Error en exportación detallada: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

# 4. Probar exportación CSV
Write-Host "`n📄 Probando exportación CSV..." -ForegroundColor Yellow

$csvOptions = @{
    format = "csv"
    stockFilter = "all"
    includePhysicalCountColumns = $true
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/products/export-inventory" -Method POST -Headers $headers -Body $csvOptions -OutFile "inventario.csv"
    Write-Host "✅ Exportación CSV exitosa - archivo: inventario.csv" -ForegroundColor Green
} catch {
    Write-Host "❌ Error en exportación CSV: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Pruebas completadas. Revisa los archivos generados." -ForegroundColor Cyan
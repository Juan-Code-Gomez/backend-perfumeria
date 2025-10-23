@echo off
echo ========================================
echo Configurando Modulo de Facturas + FIFO
echo ========================================
echo.

REM Cambiar al directorio del proyecto
cd /d "d:\Proyecto Milan\codigo\backend-perfumeria"

echo [1/5] Ejecutando migracion SQL...
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d perfumeria -f "migrations\add-notes-to-invoice.sql"

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: No se pudo ejecutar la migracion SQL
    echo Verifica que PostgreSQL este instalado y la base de datos exista
    pause
    exit /b 1
)

echo.
echo [2/5] Deteniendo servidor si esta corriendo...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [3/5] Generando Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: No se pudo generar el cliente de Prisma
    pause
    exit /b 1
)

echo [4/5] Compilando backend...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Hubo errores en la compilacion
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup completado exitosamente!
echo ========================================
echo.
echo El modulo de Facturas con FIFO esta listo para usar
echo.
echo Endpoints disponibles:
echo   POST   /api/invoices          - Crear factura con productos
echo   GET    /api/invoices          - Listar facturas
echo   GET    /api/invoices/:id      - Ver factura individual
echo   POST   /api/invoices/:id/pay  - Registrar pago
echo   DELETE /api/invoices/:id      - Eliminar factura
echo.
echo Ahora puedes iniciar el servidor con:
echo   npm run start:dev
echo.
echo Documentacion completa en:
echo   INVOICE_INVENTORY_MODULE.md
echo.
pause

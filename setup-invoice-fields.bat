@echo off
echo ========================================
echo Ejecutando migracion: Agregar campos de factura a Purchase
echo ========================================
echo.

REM Cambiar al directorio del proyecto
cd /d "d:\Proyecto Milan\codigo\backend-perfumeria"

REM Ejecutar la migracion SQL (ajusta el path de psql segun tu instalacion)
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d perfumeria -f "migrations\add-invoice-fields-to-purchase.sql"

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Error al ejecutar la migracion SQL
    pause
    exit /b 1
)

echo.
echo ✅ Migracion ejecutada correctamente
echo.
echo ========================================
echo Generando Prisma Client...
echo ========================================
echo.

call npx prisma generate

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Error al generar Prisma Client
    pause
    exit /b 1
)

echo.
echo ✅ Prisma Client generado
echo.
echo ========================================
echo Compilando backend...
echo ========================================
echo.

call npm run build

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Error al compilar backend
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ SETUP COMPLETADO EXITOSAMENTE
echo ========================================
echo.
echo Ahora puedes reiniciar el servidor con: npm run start:dev
echo.
pause

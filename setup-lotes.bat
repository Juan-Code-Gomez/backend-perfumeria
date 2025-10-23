@echo off
echo ========================================
echo Sistema de Lotes FIFO - Setup
echo ========================================
echo.

echo [1/3] Deteniendo servidor si esta corriendo...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/3] Generando cliente de Prisma...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: No se pudo generar el cliente de Prisma
    echo Asegurate de haber ejecutado el script SQL primero
    pause
    exit /b 1
)

echo [3/3] Compilando backend...
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
echo Ahora puedes iniciar el servidor con:
echo npm run start:dev
echo.
pause

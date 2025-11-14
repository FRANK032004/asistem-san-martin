@echo off
title ASISTEM - Frontend Server
echo ========================================
echo    INICIANDO FRONTEND - NEXT.JS
echo ========================================
echo.

cd /d "C:\xampp\htdocs\ASISTEM_SAN_MARTIN\frontend"

echo [INFO] Directorio actual: %CD%
echo [INFO] Verificando package.json...

if not exist package.json (
    echo [ERROR] No se encontro package.json en %CD%
    pause
    exit /b 1
)

echo [INFO] package.json encontrado ✓
echo [INFO] Limpiando cache de Next.js...

if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo [INFO] Iniciando servidor de desarrollo...
echo [INFO] Frontend estará disponible en: http://localhost:3000
echo.
echo ========================================

npm run dev

echo.
echo [INFO] El servidor se ha detenido.
pause

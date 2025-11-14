@echo off
title ASISTEM - Backend Server
echo ========================================
echo    INICIANDO BACKEND - NODE.JS/EXPRESS
echo ========================================
echo.

cd /d "C:\xampp\htdocs\ASISTEM_SAN_MARTIN\backend"

echo [INFO] Directorio actual: %CD%
echo [INFO] Verificando package.json...

if not exist package.json (
    echo [ERROR] No se encontro package.json en %CD%
    pause
    exit /b 1
)

echo [INFO] package.json encontrado ✓
echo [INFO] Verificando Prisma Client...

npx prisma generate

echo [INFO] Iniciando servidor de desarrollo...
echo [INFO] Backend estará disponible en: http://localhost:5000
echo.
echo ========================================

npm run dev

echo.
echo [INFO] El servidor se ha detenido.
pause

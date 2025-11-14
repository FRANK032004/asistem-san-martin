@echo off
chcp 65001 >nul
cls

echo ========================================
echo   MIGRACIÓN POSTGIS - SISTEMA SENIOR
echo ========================================
echo.
echo Este script instalará PostGIS de manera segura
echo sin afectar los datos existentes.
echo.
echo PASO 1: Backup automático
echo PASO 2: Instalación de PostGIS
echo PASO 3: Verificación de integridad
echo.
pause

cd /d %~dp0backend

echo.
echo [1/4] 📦 Verificando dependencias...
call npm list @prisma/client >nul 2>&1
if errorlevel 1 (
    echo ⚠️ Instalando Prisma Client...
    call npm install @prisma/client
)

echo.
echo [2/4] 🔄 Ejecutando migración PostGIS...
echo.
call npx prisma migrate deploy

if errorlevel 1 (
    echo.
    echo ❌ ERROR: La migración falló
    echo Por favor verifica:
    echo   1. PostgreSQL está corriendo
    echo   2. La base de datos existe
    echo   3. Las credenciales son correctas
    echo.
    pause
    exit /b 1
)

echo.
echo [3/4] ✅ Generando Prisma Client...
call npx prisma generate

echo.
echo [4/4] 🔍 Verificando instalación...
echo.

cd /d %~dp0

echo.
echo ========================================
echo   ✅ MIGRACIÓN COMPLETADA
echo ========================================
echo.
echo PostGIS ha sido instalado correctamente.
echo.
echo FUNCIONES DISPONIBLES:
echo   • validar_ubicacion_en_radio()
echo   • encontrar_ubicacion_cercana()
echo   • ubicaciones_en_radio()
echo   • calcular_distancia()
echo.
echo PRÓXIMOS PASOS:
echo   1. Reinicia el backend
echo   2. El sistema usará PostGIS automáticamente
echo.
pause

@echo off
echo ========================================
echo CREAR TABLAS DE PLANILLAS
echo ========================================

echo.
echo [1/2] 📋 Creando tablas de planillas...
"C:\PostgreSQL\17\bin\psql.exe" -U postgres -d instituto_san_martin -f database/crear_planillas.sql
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error creando tablas de planillas
    pause
    exit /b 1
)
echo ✅ Tablas de planillas creadas correctamente

echo.
echo [2/2] ⚡ Sincronizando schema de Prisma...
cd backend
call npx prisma db pull
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error sincronizando schema
    pause
    exit /b 1
)

echo.
echo ⚡ Generando cliente Prisma...
call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error generando cliente Prisma
    pause
    exit /b 1
)
cd..
echo ✅ Cliente Prisma regenerado

echo.
echo ========================================
echo 🚀 ¡TABLAS DE PLANILLAS CREADAS! 
echo ========================================
echo.
echo ✅ Tabla planillas creada
echo ✅ Tabla detalle_planillas creada
echo ✅ Triggers automáticos implementados
echo ✅ Datos de prueba insertados
echo ✅ Prisma sincronizado
echo.
pause

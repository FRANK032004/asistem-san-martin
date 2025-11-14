@echo off
title ASISTEM - MENÚ PRINCIPAL
color 0F

:MENU
cls
echo ========================================
echo     SISTEMA ASISTEM SAN MARTIN
echo        MENÚ DE ADMINISTRACIÓN  
echo ========================================
echo.
echo [1] 🚀 Iniciar Sistema Completo (Backend + Frontend)
echo [2] 🖥️  Iniciar Solo Backend (Puerto 5000)
echo [3] 🌐 Iniciar Solo Frontend (Puerto 3000) 
echo [4] 🔍 Verificar Estado del Sistema
echo [5] 🛑 Detener Todo el Sistema
echo [6] 📊 Ver Logs en Tiempo Real
echo [7] 🔧 Herramientas de Desarrollo
echo [8] ❌ Salir
echo.
echo ========================================
set /p opcion="Selecciona una opción (1-8): "

if "%opcion%"=="1" goto INICIAR_COMPLETO
if "%opcion%"=="2" goto INICIAR_BACKEND
if "%opcion%"=="3" goto INICIAR_FRONTEND
if "%opcion%"=="4" goto VERIFICAR_ESTADO
if "%opcion%"=="5" goto DETENER_SISTEMA
if "%opcion%"=="6" goto VER_LOGS
if "%opcion%"=="7" goto HERRAMIENTAS_DEV
if "%opcion%"=="8" goto SALIR

echo [ERROR] Opción no válida. Intenta de nuevo.
timeout /t 2 /nobreak >nul
goto MENU

:INICIAR_COMPLETO
echo.
echo [INFO] Iniciando sistema completo...
call "iniciar_sistema_completo.bat"
goto MENU

:INICIAR_BACKEND
echo.
echo [INFO] Iniciando solo backend...
call "solo_backend.bat"
goto MENU

:INICIAR_FRONTEND
echo.
echo [INFO] Iniciando solo frontend...
call "solo_frontend.bat"
goto MENU

:VERIFICAR_ESTADO
echo.
echo [INFO] Verificando estado...
call "verificar_estado.bat"
goto MENU

:DETENER_SISTEMA
echo.
echo [INFO] Deteniendo sistema...
call "detener_sistema.bat"
goto MENU

:VER_LOGS
cls
echo ========================================
echo         LOGS EN TIEMPO REAL
echo ========================================
echo.
echo [INFO] Monitoreando puertos activos...
echo [INFO] Presiona Ctrl+C para volver al menú
echo.
:LOOP_LOGS
powershell -Command "Get-NetTCPConnection -LocalPort 5000,3000 -ErrorAction SilentlyContinue | Format-Table LocalAddress,LocalPort,State,OwningProcess -AutoSize"
echo [INFO] Actualización: %time%
timeout /t 5 /nobreak >nul
goto LOOP_LOGS

:HERRAMIENTAS_DEV
cls
echo ========================================
echo      HERRAMIENTAS DE DESARROLLO
echo ========================================
echo.
echo [1] 📂 Abrir Prisma Studio (Base de datos)
echo [2] 🔨 Ejecutar Migraciones de BD
echo [3] 🧪 Ejecutar Tests del Backend
echo [4] 📁 Abrir Directorio del Proyecto
echo [5] 🌐 Abrir URLs en Navegador
echo [6] ⬅️ Volver al Menú Principal
echo.
set /p dev_opcion="Selecciona herramienta (1-6): "

if "%dev_opcion%"=="1" goto PRISMA_STUDIO
if "%dev_opcion%"=="2" goto MIGRACIONES
if "%dev_opcion%"=="3" goto TESTS
if "%dev_opcion%"=="4" goto ABRIR_DIRECTORIO
if "%dev_opcion%"=="5" goto ABRIR_URLS
if "%dev_opcion%"=="6" goto MENU

echo [ERROR] Opción no válida.
timeout /t 2 /nobreak >nul
goto HERRAMIENTAS_DEV

:PRISMA_STUDIO
echo [INFO] Abriendo Prisma Studio...
start cmd /c "cd /d c:\xampp\htdocs\ASISTEM_SAN_MARTIN\backend && npx prisma studio"
goto HERRAMIENTAS_DEV

:MIGRACIONES
echo [INFO] Ejecutando migraciones...
start cmd /k "cd /d c:\xampp\htdocs\ASISTEM_SAN_MARTIN\backend && npx prisma migrate dev"
goto HERRAMIENTAS_DEV

:TESTS
echo [INFO] Ejecutando tests...
start cmd /k "cd /d c:\xampp\htdocs\ASISTEM_SAN_MARTIN\backend && npm test"
goto HERRAMIENTAS_DEV

:ABRIR_DIRECTORIO
echo [INFO] Abriendo directorio del proyecto...
explorer "c:\xampp\htdocs\ASISTEM_SAN_MARTIN"
goto HERRAMIENTAS_DEV

:ABRIR_URLS
echo [INFO] Abriendo URLs del sistema...
start http://localhost:5000
start http://localhost:3000
start http://localhost:5000/health
goto HERRAMIENTAS_DEV

:SALIR
echo.
echo [INFO] ¡Gracias por usar ASISTEM San Martín!
echo [INFO] Sistema desarrollado para Instituto San Martín
timeout /t 2 /nobreak >nul
exit
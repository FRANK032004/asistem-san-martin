@echo off
echo ========================================
echo INICIANDO SISTEMA ASISTEM SAN MARTIN
echo ========================================

echo.
echo [1/3] Matando procesos anteriores...
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.cmd 2>nul

echo.
echo [2/3] Iniciando Backend en puerto 5000...
start "Backend-ASISTEM" cmd /k "cd /d c:\xampp\htdocs\ASISTEM_SAN_MARTIN\backend && npm run dev"

echo.
echo [3/3] Esperando 5 segundos antes de iniciar Frontend...
timeout /t 5 /nobreak >nul

echo.
echo Iniciando Frontend en puerto 3000...
start "Frontend-ASISTEM" cmd /k "cd /d c:\xampp\htdocs\ASISTEM_SAN_MARTIN\frontend && npm run dev"

echo.
echo ========================================
echo SERVIDORES INICIADOS
echo ========================================
echo Backend:  http://localhost:5000
echo          http://192.168.0.107:5000
echo Frontend: http://localhost:3000
echo          http://192.168.0.107:3000
echo.
echo DESDE TU CELULAR (misma WiFi):
echo http://192.168.0.107:3000
echo.
echo Espera 10-15 segundos y luego ve a:
echo http://localhost:3000
echo.
echo Las ventanas del backend y frontend seguiran abiertas.
echo NO las cierres mientras uses el sistema.
echo.
echo Presiona cualquier tecla para salir de este menu...
pause >nul

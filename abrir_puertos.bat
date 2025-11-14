@echo off
echo ========================================
echo   ABRIENDO PUERTOS EN FIREWALL
echo ========================================
echo.
echo Este script abrira los puertos 3000 y 5000
echo Requiere permisos de Administrador
echo.
pause

netsh advfirewall firewall delete rule name="Next.js Dev Server" >nul 2>&1
netsh advfirewall firewall delete rule name="Node.js Backend" >nul 2>&1

netsh advfirewall firewall add rule name="Next.js Dev Server" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="Node.js Backend" dir=in action=allow protocol=TCP localport=5000

echo.
echo ========================================
echo   PUERTOS ABIERTOS CORRECTAMENTE
echo ========================================
echo.
echo Puerto 3000: Frontend (Next.js)
echo Puerto 5000: Backend (API)
echo.
pause

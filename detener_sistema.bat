@echo off
title ASISTEM - DETENER SISTEMA
color 0C

echo ========================================
echo     DETENIENDO SISTEMA ASISTEM
echo ========================================
echo.
echo [INFO] Deteniendo todos los servicios...
echo.

echo [1/3] Deteniendo Backend (Puerto 5000)...
powershell -Command "$process = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess; if ($process) { taskkill /f /pid $process >nul 2>&1; Write-Host '[OK] Backend detenido (PID: ' + $process + ')' } else { Write-Host '[INFO] Backend no estaba corriendo' }"

echo.
echo [2/3] Deteniendo Frontend (Puerto 3000)...
powershell -Command "$process = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess; if ($process) { taskkill /f /pid $process >nul 2>&1; Write-Host '[OK] Frontend detenido (PID: ' + $process + ')' } else { Write-Host '[INFO] Frontend no estaba corriendo' }"

echo.
echo [3/3] Cerrando ventanas adicionales...
taskkill /f /fi "WindowTitle eq ASISTEM - BACKEND" >nul 2>&1
taskkill /f /fi "WindowTitle eq ASISTEM - FRONTEND" >nul 2>&1

echo.
echo ========================================
echo ✅ SISTEMA COMPLETAMENTE DETENIDO
echo ========================================
echo.
echo [INFO] Todos los procesos han sido terminados
echo [INFO] Los puertos 5000 y 3000 están liberados
echo [INFO] Para reiniciar usa 'iniciar_sistema_completo.bat'
echo.
timeout /t 3 /nobreak >nul
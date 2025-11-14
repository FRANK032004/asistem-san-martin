@echo off
echo ============================================================
echo SCRIPT DE APLICACION DE INDICES CRITICOS
echo Sistema de Asistencias - Instituto San Martin
echo ============================================================
echo.

set PGPASSWORD=12345

echo [1/3] Verificando conexion a PostgreSQL...
psql -U postgres -d instituto_san_martin -c "SELECT version();" > nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: No se puede conectar a PostgreSQL
    echo    Verifica que PostgreSQL este corriendo en puerto 5432
    echo    Usuario: postgres
    echo    Password: 12345
    echo    Base de datos: instituto_san_martin
    pause
    exit /b 1
)
echo ✅ Conexion exitosa a PostgreSQL

echo.
echo [2/3] Aplicando indices criticos...
psql -U postgres -d instituto_san_martin -f database\optimizaciones\01_indices_criticos.sql
if errorlevel 1 (
    echo ❌ ERROR: Fallo al aplicar indices
    pause
    exit /b 1
)
echo ✅ Indices aplicados correctamente

echo.
echo [3/3] Verificando indices creados...
psql -U postgres -d instituto_san_martin -c "SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%' ORDER BY tablename, indexname;" > indices_creados.txt
echo ✅ Lista de indices guardada en: indices_creados.txt

echo.
echo ============================================================
echo ✅ INDICES CRITICOS APLICADOS EXITOSAMENTE
echo ============================================================
echo.
echo 📊 Mejoras esperadas:
echo    - Consultas por fecha: 200-400%% mas rapidas
echo    - Dashboard: 150-300%% mas rapido
echo    - Busquedas por docente: 300-500%% mas rapidas
echo    - Login: 100-200%% mas rapido
echo.
echo 📝 Proximos pasos:
echo    1. Reiniciar el backend para que tome efecto
echo    2. Monitorear performance con las queries actuales
echo    3. Verificar logs de queries lentas (si existen)
echo.
pause

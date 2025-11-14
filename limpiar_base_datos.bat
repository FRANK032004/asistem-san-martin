@echo off
title ASISTEM - BACKUP Y LIMPIEZA DE BASE DE DATOS
color 0B

echo ========================================
echo    BACKUP Y LIMPIEZA DE BASE DE DATOS
echo ========================================
echo.

echo [PASO 1/4] DETENER SERVICIOS
echo Deteniendo backend si está corriendo...
powershell -Command "$process = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess; if ($process) { taskkill /f /pid $process >nul 2>&1; Write-Host '[OK] Backend detenido' } else { Write-Host '[INFO] Backend no estaba corriendo' }"

echo.
echo [PASO 2/4] CREAR BACKUP
echo Creando respaldo de seguridad...

rem Crear directorio de backup si no existe
if not exist "backups" mkdir backups

rem Crear backup con fecha y hora
for /f "tokens=1-3 delims=/" %%a in ('date /t') do set mydate=%%c-%%b-%%a
for /f "tokens=1-2 delims=:" %%a in ('time /t') do set mytime=%%a-%%b
set backup_name=backup_antes_limpieza_%mydate%_%mytime:.=-%
set backup_name=%backup_name: =%

echo [INFO] Nombre del backup: %backup_name%.sql

rem Intentar crear backup usando diferentes métodos
echo [INFO] Intentando crear backup...

rem Método 1: pg_dump si está en PATH
pg_dump --version >nul 2>&1
if %errorlevel% == 0 (
    echo [INFO] Usando pg_dump...
    pg_dump -h localhost -U postgres -d instituto_san_martin > "backups\%backup_name%.sql" 2>nul
    if %errorlevel% == 0 (
        echo [OK] Backup creado exitosamente
        goto :continue_cleanup
    )
)

rem Método 2: Buscar pg_dump en ubicaciones comunes
echo [INFO] Buscando PostgreSQL en ubicaciones comunes...
set pg_found=0

if exist "C:\Program Files\PostgreSQL\*\bin\pg_dump.exe" (
    for /d %%i in ("C:\Program Files\PostgreSQL\*") do (
        if exist "%%i\bin\pg_dump.exe" (
            echo [INFO] Encontrado PostgreSQL en: %%i
            "%%i\bin\pg_dump.exe" -h localhost -U postgres -d instituto_san_martin > "backups\%backup_name%.sql" 2>nul
            if %errorlevel% == 0 (
                echo [OK] Backup creado exitosamente
                set pg_found=1
                goto :continue_cleanup
            )
        )
    )
)

rem Método 3: XAMPP/Stack
if exist "C:\xampp\pgsql\bin\pg_dump.exe" (
    echo [INFO] Encontrado PostgreSQL en XAMPP
    "C:\xampp\pgsql\bin\pg_dump.exe" -h localhost -U postgres -d instituto_san_martin > "backups\%backup_name%.sql" 2>nul
    if %errorlevel% == 0 (
        echo [OK] Backup creado exitosamente
        set pg_found=1
        goto :continue_cleanup
    )
)

if %pg_found% == 0 (
    echo [WARNING] No se pudo crear backup automático
    echo [INFO] Puedes crear el backup manualmente con pgAdmin
    echo [INFO] ¿Deseas continuar sin backup? (NO RECOMENDADO)
    set /p continue="Continuar (s/N): "
    if /i not "%continue%"=="s" (
        echo [INFO] Proceso cancelado. Crea un backup manual primero.
        pause
        exit /b 1
    )
)

:continue_cleanup
echo.
echo [PASO 3/4] EJECUTAR LIMPIEZA
echo Ejecutando script de limpieza...

cd /d "c:\xampp\htdocs\ASISTEM_SAN_MARTIN\backend"
npx prisma db execute --file ..\database\limpieza_base_datos.sql

if %errorlevel% == 0 (
    echo [OK] Limpieza ejecutada exitosamente
) else (
    echo [ERROR] Error en la limpieza
    echo [INFO] Puedes restaurar desde: backups\%backup_name%.sql
    pause
    exit /b 1
)

echo.
echo [PASO 4/4] VERIFICACIÓN
echo Verificando estado de la base de datos...

rem Generar reporte post-limpieza
npx prisma db execute --stdin << EOF
SELECT 
    'RESUMEN POST-LIMPIEZA' as titulo,
    COUNT(*) as total_tablas,
    COUNT(CASE WHEN tablename LIKE 'us_%' THEN 1 END) as tablas_us_restantes,
    COUNT(CASE WHEN tablename IN (
        'usuarios', 'roles', 'areas', 'docentes', 'asistencias', 
        'ubicaciones_permitidas', 'contratos_docentes', 'horarios_base',
        'horarios_especiales', 'horas_trabajadas', 'planillas_horas',
        'evaluaciones_docentes', 'justificaciones', 'notificaciones',
        'sesiones_usuarios', 'logs_actividad', 'reportes', 'configuraciones'
    ) THEN 1 END) as tablas_aplicacion
FROM pg_tables 
WHERE schemaname = 'public';
EOF

echo.
echo ========================================
echo ✅ LIMPIEZA COMPLETADA
echo ========================================
echo.
echo 📊 Base de datos optimizada
echo 💾 Backup disponible en: backups\%backup_name%.sql
echo 🚀 Puedes reiniciar el sistema
echo.
echo Para verificar las tablas restantes:
echo   1. Abre pgAdmin o tu cliente SQL
echo   2. Conecta a la base de datos
echo   3. Verifica que solo queden 21 tablas
echo.
pause
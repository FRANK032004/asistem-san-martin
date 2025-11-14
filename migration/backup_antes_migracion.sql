-- BACKUP COMPLETO ANTES DE MIGRACIÓN
-- Fecha: 2025-10-08
-- Sistema: ASISTEM San Martín

-- Comando para hacer backup completo:
-- pg_dump -h localhost -U postgres -d instituto_san_martin > backup_antes_migracion.sql

-- Comando para restaurar si algo sale mal:
-- psql -h localhost -U postgres -d instituto_san_martin < backup_antes_migracion.sql

-- VERIFICACIÓN DE TABLAS ACTUALES
SELECT 
    schemaname,
    tablename,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- CONTEO DE REGISTROS ACTUALES
SELECT 'usuarios' as tabla, COUNT(*) as registros FROM usuarios
UNION ALL
SELECT 'docentes' as tabla, COUNT(*) as registros FROM docentes
UNION ALL
SELECT 'areas' as tabla, COUNT(*) as registros FROM areas
UNION ALL  
SELECT 'asistencias' as tabla, COUNT(*) as registros FROM asistencias
UNION ALL
SELECT 'justificaciones' as tabla, COUNT(*) as registros FROM justificaciones;
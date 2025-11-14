-- VERIFICAR TABLAS ACTUALES EN LA BASE DE DATOS
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN tablename IN (
            'usuarios', 'roles', 'areas', 'docentes', 'asistencias', 
            'ubicaciones_permitidas', 'contratos_docentes', 'horarios_base',
            'horarios_especiales', 'horas_trabajadas', 'planillas_horas',
            'evaluaciones_docentes', 'justificaciones', 'notificaciones',
            'sesiones_usuarios', 'logs_actividad', 'reportes', 'configuraciones'
        ) THEN '✅ APLICACIÓN'
        WHEN tablename IN ('spatial_ref_sys', 'geography_columns', 'geometry_columns') 
        THEN '🌍 POSTGIS CORE'
        WHEN tablename LIKE 'us_%' THEN '🗑️ US GEOGRAPHIC (ELIMINAR)'
        WHEN tablename IN ('pointcloud_formats', 'raster_columns', 'raster_overviews') 
        THEN '🗑️ POSTGIS NO USADO (ELIMINAR)'
        WHEN tablename = 'topology' THEN '🗑️ TOPOLOGY (ELIMINAR)'
        ELSE '❓ REVISAR'
    END AS categoria,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS tamaño
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY categoria, tablename;
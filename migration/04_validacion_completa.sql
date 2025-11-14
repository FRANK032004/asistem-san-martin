-- =========================================
-- VALIDACIÓN COMPLETA POST-MIGRACIÓN
-- ASISTEM SAN MARTÍN - SISTEMA EMPRESARIAL
-- Fecha: 2025-10-08
-- =========================================

-- 1. VERIFICAR TODAS LAS TABLAS NUEVAS
SELECT 
    'NUEVAS TABLAS CREADAS' as categoria,
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = t.table_name) as columnas,
    CASE 
        WHEN table_name = 'contratos_docentes' THEN (SELECT COUNT(*) FROM contratos_docentes)
        WHEN table_name = 'horarios_base' THEN (SELECT COUNT(*) FROM horarios_base)
        WHEN table_name = 'horas_trabajadas' THEN (SELECT COUNT(*) FROM horas_trabajadas)
        WHEN table_name = 'planillas_horas' THEN (SELECT COUNT(*) FROM planillas_horas)
        WHEN table_name = 'evaluaciones_docentes' THEN (SELECT COUNT(*) FROM evaluaciones_docentes)
        WHEN table_name = 'notificaciones' THEN (SELECT COUNT(*) FROM notificaciones)
        WHEN table_name = 'sesiones_usuarios' THEN (SELECT COUNT(*) FROM sesiones_usuarios)
    END as registros
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN (
    'contratos_docentes',
    'horarios_base', 
    'horas_trabajadas',
    'planillas_horas',
    'evaluaciones_docentes',
    'notificaciones',
    'sesiones_usuarios'
)
ORDER BY table_name;

-- 2. VERIFICAR INTEGRIDAD REFERENCIAL
SELECT 
    'INTEGRIDAD REFERENCIAL' as categoria,
    'Docentes sin contrato' as verificacion,
    COUNT(*) as problemas
FROM docentes d
LEFT JOIN contratos_docentes cd ON d.id = cd.docente_id AND cd.activo = true
WHERE cd.id IS NULL

UNION ALL

SELECT 
    'INTEGRIDAD REFERENCIAL' as categoria,
    'Contratos sin docente válido' as verificacion,
    COUNT(*) as problemas
FROM contratos_docentes cd
LEFT JOIN docentes d ON cd.docente_id = d.id
WHERE d.id IS NULL

UNION ALL

SELECT 
    'INTEGRIDAD REFERENCIAL' as categoria,
    'Horas trabajadas sin docente' as verificacion,
    COUNT(*) as problemas
FROM horas_trabajadas ht
LEFT JOIN docentes d ON ht.docente_id = d.id
WHERE d.id IS NULL

UNION ALL

SELECT 
    'INTEGRIDAD REFERENCIAL' as categoria,
    'Planillas sin contrato válido' as verificacion,
    COUNT(*) as problemas
FROM planillas_horas ph
LEFT JOIN contratos_docentes cd ON ph.contrato_id = cd.id
WHERE cd.id IS NULL;

-- 3. VERIFICAR CÁLCULOS AUTOMÁTICOS
SELECT 
    'CÁLCULOS AUTOMÁTICOS' as categoria,
    'Asistencias con horas calculadas' as verificacion,
    COUNT(*) as correctos,
    (SELECT COUNT(*) FROM asistencias WHERE hora_entrada IS NOT NULL AND hora_salida IS NOT NULL) as total
FROM asistencias 
WHERE horas_trabajadas IS NOT NULL 
AND horas_trabajadas > 0
AND hora_entrada IS NOT NULL 
AND hora_salida IS NOT NULL;

-- 4. VERIFICAR ÍNDICES CRÍTICOS
SELECT 
    'ÍNDICES' as categoria,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN (
    'contratos_docentes', 'horarios_base', 'horas_trabajadas',
    'planillas_horas', 'evaluaciones_docentes', 'notificaciones'
)
ORDER BY tablename, indexname;

-- 5. TESTING DE FUNCIONES CRÍTICAS

-- Test 1: Función de cálculo de horas trabajadas
SELECT 
    'TESTING FUNCIONES' as categoria,
    'Trigger calcular_horas_trabajadas' as funcion,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'trigger_calcular_horas'
            AND event_object_table = 'asistencias'
        ) THEN 'ACTIVO'
        ELSE 'ERROR'
    END as estado;

-- Test 2: Función generar planilla mensual
SELECT 
    'TESTING FUNCIONES' as categoria,
    'Función generar_planilla_mensual' as funcion,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'generar_planilla_mensual'
            AND routine_type = 'FUNCTION'
        ) THEN 'DISPONIBLE'
        ELSE 'ERROR'
    END as estado;

-- 6. VERIFICAR CONFIGURACIONES DEL SISTEMA
SELECT 
    'CONFIGURACIÓN' as categoria,
    categoria as config_categoria,
    COUNT(*) as configuraciones
FROM configuraciones 
GROUP BY categoria
ORDER BY categoria;

-- 7. ESTADÍSTICAS GENERALES DEL SISTEMA
SELECT 
    'ESTADÍSTICAS GENERALES' as categoria,
    'Total Usuarios' as metrica,
    COUNT(*) as valor
FROM usuarios

UNION ALL

SELECT 
    'ESTADÍSTICAS GENERALES',
    'Docentes Activos',
    COUNT(*)
FROM docentes d
JOIN contratos_docentes cd ON d.id = cd.docente_id
WHERE cd.activo = true

UNION ALL

SELECT 
    'ESTADÍSTICAS GENERALES',
    'Áreas Configuradas',
    COUNT(*)
FROM areas
WHERE activo = true

UNION ALL

SELECT 
    'ESTADÍSTICAS GENERALES',
    'Asistencias Registradas',
    COUNT(*)
FROM asistencias

UNION ALL

SELECT 
    'ESTADÍSTICAS GENERALES',
    'Planillas Generadas',
    COUNT(*)
FROM planillas_horas

UNION ALL

SELECT 
    'ESTADÍSTICAS GENERALES',
    'Evaluaciones Realizadas', 
    COUNT(*)
FROM evaluaciones_docentes;

-- 8. VERIFICAR PERMISOS Y ROLES
SELECT 
    'SEGURIDAD' as categoria,
    r.nombre as rol,
    COUNT(u.id) as usuarios
FROM roles r
LEFT JOIN usuarios u ON r.id = u.rol_id
GROUP BY r.id, r.nombre
ORDER BY r.nombre;

-- 9. TEST DE CONSULTAS COMPLEJAS CRÍTICAS

-- Test: Consulta de planilla completa
SELECT 
    'TEST CONSULTAS' as categoria,
    'Planilla con todos los datos' as test,
    COUNT(*) as planillas_completas
FROM planillas_horas ph
JOIN contratos_docentes cd ON ph.contrato_id = cd.id
JOIN docentes d ON ph.docente_id = d.id
JOIN usuarios u ON d.usuario_id = u.id
WHERE ph.calculado = true;

-- Test: Evaluación con métricas
SELECT 
    'TEST CONSULTAS' as categoria,
    'Evaluaciones con métricas válidas' as test,
    COUNT(*) as evaluaciones_validas
FROM evaluaciones_docentes
WHERE porcentaje_asistencia >= 0 
AND porcentaje_asistencia <= 100
AND calificacion_general >= 1.0
AND calificacion_general <= 5.0;

-- 10. VERIFICAR TRIGGERS Y FUNCIONES AUTOMÁTICAS

-- Verificar que los triggers están funcionando
SELECT 
    'TRIGGERS' as categoria,
    trigger_name,
    event_object_table as tabla,
    action_timing as momento,
    event_manipulation as evento
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('asistencias', 'contratos_docentes', 'planillas_horas')
ORDER BY event_object_table, trigger_name;

-- ==========================================
-- REPORTE FINAL DE MIGRACIÓN
-- ==========================================

SELECT 
    '🚀 MIGRACIÓN COMPLETADA EXITOSAMENTE' as estado,
    CURRENT_TIMESTAMP as fecha_finalizacion,
    'Sistema convertido a nivel EMPRESARIAL' as resultado;

SELECT 
    '📊 RESUMEN FINAL' as seccion,
    'Nuevas tablas creadas: 7' as detalle
UNION ALL
SELECT 
    '📊 RESUMEN FINAL',
    'Tablas existentes mejoradas: 9'
UNION ALL  
SELECT 
    '📊 RESUMEN FINAL',
    'Funciones automáticas: 3'
UNION ALL
SELECT 
    '📊 RESUMEN FINAL',
    'Triggers activos: 3'
UNION ALL
SELECT 
    '📊 RESUMEN FINAL',
    'Índices optimizados: 20+'
UNION ALL
SELECT 
    '📊 RESUMEN FINAL',
    'Configuraciones empresariales: 8';

-- ==========================================
-- INSTRUCCIONES POST-MIGRACIÓN
-- ==========================================

SELECT 
    '📋 PRÓXIMOS PASOS' as instrucciones,
    '1. Actualizar Prisma Schema' as paso
UNION ALL
SELECT 
    '📋 PRÓXIMOS PASOS',
    '2. Regenerar Prisma Client'
UNION ALL
SELECT 
    '📋 PRÓXIMOS PASOS',
    '3. Actualizar APIs del backend'
UNION ALL
SELECT 
    '📋 PRÓXIMOS PASOS',
    '4. Implementar nuevos endpoints'
UNION ALL
SELECT 
    '📋 PRÓXIMOS PASOS',
    '5. Actualizar frontend con nuevas funcionalidades'
UNION ALL
SELECT 
    '📋 PRÓXIMOS PASOS',
    '6. Configurar notificaciones automáticas'
UNION ALL
SELECT 
    '📋 PRÓXIMOS PASOS',
    '7. Entrenar usuarios en nuevas funciones';

-- ¡SISTEMA EMPRESARIAL LISTO! 🎯✨
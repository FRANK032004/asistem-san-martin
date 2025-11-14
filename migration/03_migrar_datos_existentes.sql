-- =========================================
-- MIGRACIÓN DE DATOS EXISTENTES
-- ASISTEM SAN MARTÍN - CONVERSIÓN A SISTEMA EMPRESARIAL
-- Fecha: 2025-10-08
-- =========================================

-- 1. CREAR CONTRATOS AUTOMÁTICOS PARA DOCENTES EXISTENTES
-- Todos los docentes actuales tendrán contratos por horas por defecto

INSERT INTO contratos_docentes (
    docente_id,
    tipo_contrato,
    horas_semanales_minimas,
    horas_semanales_maximas,
    tarifa_por_hora,
    sueldo_base,
    fecha_inicio,
    activo,
    observaciones
)
SELECT 
    d.id as docente_id,
    CASE 
        WHEN d.sueldo IS NOT NULL AND d.sueldo > 0 THEN 'fijo'
        ELSE 'por_horas'
    END as tipo_contrato,
    20.0 as horas_semanales_minimas, -- 20 horas mínimas por semana
    40.0 as horas_semanales_maximas, -- 40 horas máximas por semana
    CASE 
        WHEN d.sueldo IS NOT NULL AND d.sueldo > 0 THEN d.sueldo / 160 -- Asumir 160 horas/mes
        ELSE 50.00 -- S/50 por hora por defecto
    END as tarifa_por_hora,
    d.sueldo as sueldo_base,
    COALESCE(d.fecha_ingreso, CURRENT_DATE - INTERVAL '1 year') as fecha_inicio,
    true as activo,
    'Contrato migrado automáticamente desde sistema anterior' as observaciones
FROM docentes d
WHERE NOT EXISTS (
    SELECT 1 FROM contratos_docentes cd WHERE cd.docente_id = d.id
);

-- 2. CREAR HORARIOS BASE DESDE HORARIOS ACTUALES DE DOCENTES
-- Convertir horarios fijos en horarios base flexibles

INSERT INTO horarios_base (
    docente_id,
    area_id,
    dia_semana,
    hora_inicio,
    hora_fin,
    tipo_clase,
    horas_semana,
    activo,
    fecha_vigencia
)
SELECT 
    d.id as docente_id,
    COALESCE(d.area_id, 1) as area_id, -- Área por defecto si no tiene
    -- Crear horario para días laborables (Lunes a Viernes)
    generate_series(1, 5) as dia_semana,
    COALESCE(d.horario_entrada, '08:00:00'::time) as hora_inicio,
    COALESCE(d.horario_salida, '17:00:00'::time) as hora_fin,
    'general' as tipo_clase,
    -- Calcular horas por día
    EXTRACT(EPOCH FROM (
        COALESCE(d.horario_salida, '17:00:00'::time) - 
        COALESCE(d.horario_entrada, '08:00:00'::time)
    )) / 3600.0 as horas_semana,
    true as activo,
    CURRENT_DATE as fecha_vigencia
FROM docentes d
WHERE d.horario_entrada IS NOT NULL 
AND d.horario_salida IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM horarios_base hb WHERE hb.docente_id = d.id
);

-- 3. GENERAR HORAS TRABAJADAS HISTÓRICAS DESDE ASISTENCIAS
-- Crear registros detallados de horas trabajadas

INSERT INTO horas_trabajadas (
    docente_id,
    asistencia_id,
    fecha,
    hora_inicio,
    hora_fin,
    horas_programadas,
    horas_efectivas,
    tipo_hora,
    tardanza_minutos,
    salida_temprana,
    estado
)
SELECT 
    a.docente_id,
    a.id as asistencia_id,
    a.fecha,
    COALESCE(a.hora_entrada::time, '08:00:00'::time) as hora_inicio,
    COALESCE(a.hora_salida::time, '17:00:00'::time) as hora_fin,
    
    -- Horas programadas (del horario del docente)
    EXTRACT(EPOCH FROM (
        COALESCE(d.horario_salida, '17:00:00'::time) - 
        COALESCE(d.horario_entrada, '08:00:00'::time)
    )) / 3600.0 as horas_programadas,
    
    -- Horas efectivas (calculadas desde asistencia)
    CASE 
        WHEN a.hora_entrada IS NOT NULL AND a.hora_salida IS NOT NULL THEN
            EXTRACT(EPOCH FROM (a.hora_salida - a.hora_entrada)) / 3600.0
        ELSE 0
    END as horas_efectivas,
    
    'normal' as tipo_hora,
    
    -- Calcular tardanza
    CASE 
        WHEN a.hora_entrada IS NOT NULL AND d.horario_entrada IS NOT NULL THEN
            GREATEST(0, EXTRACT(EPOCH FROM (a.hora_entrada::time - d.horario_entrada)) / 60.0)
        ELSE 0
    END as tardanza_minutos,
    
    -- Calcular salida temprana  
    CASE 
        WHEN a.hora_salida IS NOT NULL AND d.horario_salida IS NOT NULL THEN
            GREATEST(0, EXTRACT(EPOCH FROM (d.horario_salida - a.hora_salida::time)) / 60.0)
        ELSE 0
    END as salida_temprana,
    
    CASE 
        WHEN a.estado = 'presente' THEN 'completo'
        WHEN a.estado = 'ausente' THEN 'incompleto'
        ELSE 'completo'
    END as estado
    
FROM asistencias a
JOIN docentes d ON a.docente_id = d.id
WHERE NOT EXISTS (
    SELECT 1 FROM horas_trabajadas ht 
    WHERE ht.asistencia_id = a.id
);

-- 4. CREAR EVALUACIONES INICIALES PARA DOCENTES ACTIVOS
-- Generar evaluaciones automáticas basadas en datos históricos

INSERT INTO evaluaciones_docentes (
    docente_id,
    evaluador_id,
    periodo,
    porcentaje_asistencia,
    porcentaje_puntualidad,
    horas_completas,
    tardanzas_promedio,
    faltas_total,
    cumplimiento_horario,
    responsabilidad,
    calificacion_general,
    fortalezas,
    areas_mejora,
    fecha_evaluacion
)
SELECT 
    d.id as docente_id,
    (SELECT id FROM usuarios WHERE rol_id = (SELECT id FROM roles WHERE nombre = 'admin') LIMIT 1) as evaluador_id,
    '2024-Q4' as periodo,
    
    -- Cálculos automáticos desde asistencias
    COALESCE(
        (COUNT(CASE WHEN a.estado = 'presente' THEN 1 END) * 100.0) / 
        NULLIF(COUNT(*), 0), 
        0
    ) as porcentaje_asistencia,
    
    COALESCE(
        (COUNT(CASE WHEN COALESCE(a.tardanza_minutos, 0) = 0 THEN 1 END) * 100.0) / 
        NULLIF(COUNT(CASE WHEN a.estado = 'presente' THEN 1 END), 0),
        0
    ) as porcentaje_puntualidad,
    
    COALESCE(AVG(COALESCE(a.horas_trabajadas, 8)), 0) as horas_completas,
    
    COALESCE(AVG(COALESCE(a.tardanza_minutos, 0)), 0) as tardanzas_promedio,
    
    COUNT(CASE WHEN a.estado = 'ausente' THEN 1 END) as faltas_total,
    
    -- Calificaciones automáticas basadas en métricas
    CASE 
        WHEN COALESCE(AVG(COALESCE(a.tardanza_minutos, 0)), 0) <= 5 THEN 5
        WHEN COALESCE(AVG(COALESCE(a.tardanza_minutos, 0)), 0) <= 15 THEN 4
        WHEN COALESCE(AVG(COALESCE(a.tardanza_minutos, 0)), 0) <= 30 THEN 3
        ELSE 2
    END as cumplimiento_horario,
    
    CASE 
        WHEN COUNT(CASE WHEN a.estado = 'ausente' THEN 1 END) = 0 THEN 5
        WHEN COUNT(CASE WHEN a.estado = 'ausente' THEN 1 END) <= 2 THEN 4
        WHEN COUNT(CASE WHEN a.estado = 'ausente' THEN 1 END) <= 5 THEN 3
        ELSE 2
    END as responsabilidad,
    
    -- Calificación general promedio
    (
        CASE 
            WHEN COALESCE(AVG(COALESCE(a.tardanza_minutos, 0)), 0) <= 5 THEN 5
            WHEN COALESCE(AVG(COALESCE(a.tardanza_minutos, 0)), 0) <= 15 THEN 4
            WHEN COALESCE(AVG(COALESCE(a.tardanza_minutos, 0)), 0) <= 30 THEN 3
            ELSE 2
        END +
        CASE 
            WHEN COUNT(CASE WHEN a.estado = 'ausente' THEN 1 END) = 0 THEN 5
            WHEN COUNT(CASE WHEN a.estado = 'ausente' THEN 1 END) <= 2 THEN 4
            WHEN COUNT(CASE WHEN a.estado = 'ausente' THEN 1 END) <= 5 THEN 3
            ELSE 2
        END
    ) / 2.0 as calificacion_general,
    
    CASE 
        WHEN COALESCE(AVG(COALESCE(a.tardanza_minutos, 0)), 0) <= 5 THEN 'Excelente puntualidad'
        WHEN COUNT(CASE WHEN a.estado = 'ausente' THEN 1 END) = 0 THEN 'Asistencia perfecta'
        ELSE 'Cumplimiento regular'
    END as fortalezas,
    
    CASE 
        WHEN COALESCE(AVG(COALESCE(a.tardanza_minutos, 0)), 0) > 15 THEN 'Mejorar puntualidad'
        WHEN COUNT(CASE WHEN a.estado = 'ausente' THEN 1 END) > 3 THEN 'Reducir inasistencias'
        ELSE 'Mantener el buen rendimiento'
    END as areas_mejora,
    
    CURRENT_TIMESTAMP as fecha_evaluacion

FROM docentes d
LEFT JOIN asistencias a ON d.id = a.docente_id 
    AND a.fecha >= CURRENT_DATE - INTERVAL '3 months'
WHERE d.id IN (SELECT DISTINCT docente_id FROM asistencias)
AND NOT EXISTS (
    SELECT 1 FROM evaluaciones_docentes ed 
    WHERE ed.docente_id = d.id AND ed.periodo = '2024-Q4'
)
GROUP BY d.id;

-- 5. CREAR NOTIFICACIONES INICIALES PARA ADMINISTRADORES
-- Informar sobre la migración completada

INSERT INTO notificaciones (
    usuario_id,
    tipo,
    titulo,
    mensaje,
    importante,
    datos
)
SELECT 
    u.id,
    'sistema' as tipo,
    '🚀 Sistema Migrado Exitosamente' as titulo,
    'El sistema ASISTEM ha sido actualizado a nivel empresarial. Nuevas funcionalidades disponibles: Contratos por horas, Planillas automáticas, Evaluaciones de docentes y más.' as mensaje,
    true as importante,
    jsonb_build_object(
        'version', '2.0',
        'fecha_migracion', CURRENT_TIMESTAMP,
        'nuevas_funcionalidades', jsonb_build_array(
            'Contratos flexibles',
            'Control de horas detallado', 
            'Planillas automáticas',
            'Evaluaciones objetivas',
            'Sistema de notificaciones'
        )
    ) as datos
FROM usuarios u
JOIN roles r ON u.rol_id = r.id
WHERE r.nombre IN ('admin', 'rrhh');

-- 6. ACTUALIZAR ESTADÍSTICAS Y RECALCULAR DATOS

-- Actualizar horas trabajadas en asistencias si no están calculadas
UPDATE asistencias 
SET 
    horas_trabajadas = EXTRACT(EPOCH FROM (hora_salida - hora_entrada)) / 3600.0,
    tardanza_minutos = GREATEST(0, EXTRACT(EPOCH FROM (hora_entrada::time - d.horario_entrada)) / 60.0),
    salida_temprana_min = GREATEST(0, EXTRACT(EPOCH FROM (d.horario_salida - hora_salida::time)) / 60.0)
FROM docentes d
WHERE asistencias.docente_id = d.id
AND asistencias.hora_entrada IS NOT NULL 
AND asistencias.hora_salida IS NOT NULL
AND (asistencias.horas_trabajadas IS NULL OR asistencias.horas_trabajadas = 0);

-- 7. GENERAR PLANILLAS DEL MES ACTUAL PARA TODOS LOS DOCENTES ACTIVOS

-- Llamar función para generar planillas automáticamente
DO $$
DECLARE
    docente_record RECORD;
    planilla_id UUID;
BEGIN
    FOR docente_record IN 
        SELECT DISTINCT d.id 
        FROM docentes d 
        JOIN contratos_docentes cd ON d.id = cd.docente_id 
        WHERE cd.activo = true
    LOOP
        BEGIN
            SELECT generar_planilla_mensual(
                docente_record.id,
                EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
                EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
            ) INTO planilla_id;
            
            RAISE NOTICE 'Planilla generada para docente %, ID: %', 
                docente_record.id, planilla_id;
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE NOTICE 'Error generando planilla para docente %: %', 
                    docente_record.id, SQLERRM;
        END;
    END LOOP;
END $$;

-- ==========================================
-- VERIFICACIÓN DE MIGRACIÓN DE DATOS
-- ==========================================

-- Resumen de la migración
SELECT 
    'Contratos creados' as item,
    COUNT(*) as cantidad
FROM contratos_docentes

UNION ALL

SELECT 
    'Horarios base creados' as item,
    COUNT(*) as cantidad  
FROM horarios_base

UNION ALL

SELECT 
    'Horas trabajadas migradas' as item,
    COUNT(*) as cantidad
FROM horas_trabajadas

UNION ALL

SELECT 
    'Evaluaciones iniciales' as item,
    COUNT(*) as cantidad
FROM evaluaciones_docentes

UNION ALL

SELECT 
    'Planillas generadas' as item,
    COUNT(*) as cantidad
FROM planillas_horas

UNION ALL

SELECT 
    'Notificaciones creadas' as item,
    COUNT(*) as cantidad
FROM notificaciones;

-- Verificar integridad referencial
SELECT 
    'Docentes sin contrato' as problema,
    COUNT(*) as cantidad
FROM docentes d
LEFT JOIN contratos_docentes cd ON d.id = cd.docente_id
WHERE cd.id IS NULL

UNION ALL

SELECT 
    'Asistencias sin horas calculadas' as problema,
    COUNT(*) as cantidad
FROM asistencias
WHERE hora_entrada IS NOT NULL 
AND hora_salida IS NOT NULL 
AND horas_trabajadas IS NULL;

COMMIT;

-- ¡MIGRACIÓN COMPLETA! 🚀
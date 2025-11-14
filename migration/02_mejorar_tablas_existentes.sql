-- =========================================
-- MEJORAS A TABLAS EXISTENTES
-- ASISTEM SAN MARTÍN - MIGRACIÓN COMPLETA
-- Fecha: 2025-10-08
-- =========================================

-- 1. MEJORAR TABLA USUARIOS
-- Agregar campos de seguridad avanzada
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_reset_password VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_expiracion_token TIMESTAMP(6);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS intentos_fallidos INTEGER DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMP(6);

-- Crear índices para nueva funcionalidad
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);

-- 2. MEJORAR TABLA AREAS
-- Agregar coordinador y estructura organizacional
ALTER TABLE areas ADD COLUMN IF NOT EXISTS coordinador_id UUID REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE areas ADD COLUMN IF NOT EXISTS codigo VARCHAR(10) UNIQUE;
ALTER TABLE areas ADD COLUMN IF NOT EXISTS color_hex VARCHAR(7);

-- Generar códigos automáticos para áreas existentes si no tienen
UPDATE areas SET codigo = 'AREA' || LPAD(id::text, 3, '0') WHERE codigo IS NULL;

-- 3. MEJORAR TABLA DOCENTES
-- Agregar información laboral y financiera
ALTER TABLE docentes ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;
ALTER TABLE docentes ADD COLUMN IF NOT EXISTS direccion VARCHAR(255);
ALTER TABLE docentes ADD COLUMN IF NOT EXISTS estado_civil VARCHAR(20);
ALTER TABLE docentes ADD COLUMN IF NOT EXISTS numero_hijos INTEGER DEFAULT 0;
ALTER TABLE docentes ADD COLUMN IF NOT EXISTS contacto_emergencia VARCHAR(100);
ALTER TABLE docentes ADD COLUMN IF NOT EXISTS telefono_emergencia VARCHAR(20);
ALTER TABLE docentes ADD COLUMN IF NOT EXISTS cuenta_bancaria VARCHAR(30);
ALTER TABLE docentes ADD COLUMN IF NOT EXISTS banco VARCHAR(50);
ALTER TABLE docentes ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'activo';

-- Crear índices para nueva funcionalidad
CREATE INDEX IF NOT EXISTS idx_docentes_estado ON docentes(estado);
CREATE INDEX IF NOT EXISTS idx_docentes_area ON docentes(area_id);

-- 4. MEJORAR TABLA ASISTENCIAS
-- Agregar campos para control detallado
ALTER TABLE asistencias ADD COLUMN IF NOT EXISTS estado_salida VARCHAR(20);
ALTER TABLE asistencias ADD COLUMN IF NOT EXISTS horas_trabajadas DECIMAL(4,2);
ALTER TABLE asistencias ADD COLUMN IF NOT EXISTS tardanza_minutos INTEGER DEFAULT 0;
ALTER TABLE asistencias ADD COLUMN IF NOT EXISTS salida_temprana_min INTEGER DEFAULT 0;
ALTER TABLE asistencias ADD COLUMN IF NOT EXISTS navegador_entrada VARCHAR(255);
ALTER TABLE asistencias ADD COLUMN IF NOT EXISTS navegador_salida VARCHAR(255);
ALTER TABLE asistencias ADD COLUMN IF NOT EXISTS distancia_entrada DECIMAL(8,2);
ALTER TABLE asistencias ADD COLUMN IF NOT EXISTS distancia_salida DECIMAL(8,2);
ALTER TABLE asistencias ADD COLUMN IF NOT EXISTS gps_valido_entrada BOOLEAN DEFAULT true;
ALTER TABLE asistencias ADD COLUMN IF NOT EXISTS gps_valido_salida BOOLEAN DEFAULT true;

-- Crear índices para nueva funcionalidad
CREATE INDEX IF NOT EXISTS idx_asistencias_estado ON asistencias(estado);

-- 5. MEJORAR TABLA JUSTIFICACIONES
-- Agregar workflow mejorado y control financiero
ALTER TABLE justificaciones ADD COLUMN IF NOT EXISTS horas_afectadas DECIMAL(4,2);
ALTER TABLE justificaciones ADD COLUMN IF NOT EXISTS prioridad VARCHAR(20) DEFAULT 'normal';
ALTER TABLE justificaciones ADD COLUMN IF NOT EXISTS afecta_pago BOOLEAN DEFAULT true;
ALTER TABLE justificaciones ADD COLUMN IF NOT EXISTS porcentaje_descuento DECIMAL(5,2) DEFAULT 0;

-- Crear índices para nueva funcionalidad
CREATE INDEX IF NOT EXISTS idx_justificaciones_periodo ON justificaciones(fecha_inicio, fecha_fin);

-- 6. MEJORAR TABLA HORARIOS_ESPECIALES
-- Agregar campos para control de horas
ALTER TABLE horarios_especiales ADD COLUMN IF NOT EXISTS horas_especiales DECIMAL(4,2);
ALTER TABLE horarios_especiales ADD COLUMN IF NOT EXISTS aprobado_por UUID REFERENCES usuarios(id);

-- Crear índices para nueva funcionalidad
CREATE INDEX IF NOT EXISTS idx_horarios_especiales_docente_fecha ON horarios_especiales(docente_id, fecha);

-- 7. MEJORAR TABLA REPORTES
-- Agregar funcionalidad avanzada de reportes
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS subtipo VARCHAR(30);
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS filtros JSONB;
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS formato_archivo VARCHAR(10);
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS tamaño INTEGER;
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'generando';
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS tiempo_generacion DECIMAL(6,2);

-- Crear índices para nueva funcionalidad
CREATE INDEX IF NOT EXISTS idx_reportes_tipo ON reportes(tipo_reporte);
CREATE INDEX IF NOT EXISTS idx_reportes_generador ON reportes(generado_por);
CREATE INDEX IF NOT EXISTS idx_reportes_estado ON reportes(estado);

-- 8. MEJORAR TABLA CONFIGURACIONES
-- Agregar estructura y validación
ALTER TABLE configuraciones ADD COLUMN IF NOT EXISTS categoria VARCHAR(50);
ALTER TABLE configuraciones ADD COLUMN IF NOT EXISTS validacion VARCHAR(255);
ALTER TABLE configuraciones ADD COLUMN IF NOT EXISTS es_publico BOOLEAN DEFAULT false;

-- Actualizar configuraciones existentes con categorías
UPDATE configuraciones SET categoria = 'sistema' WHERE categoria IS NULL;

-- Crear índices para nueva funcionalidad
CREATE INDEX IF NOT EXISTS idx_configuraciones_categoria ON configuraciones(categoria);

-- 9. MEJORAR TABLA LOGS_ACTIVIDAD
-- Agregar campos para auditoría avanzada
ALTER TABLE logs_actividad ADD COLUMN IF NOT EXISTS modulo VARCHAR(50);
ALTER TABLE logs_actividad ADD COLUMN IF NOT EXISTS resultado VARCHAR(20);
ALTER TABLE logs_actividad ADD COLUMN IF NOT EXISTS duracion_ms INTEGER;

-- Crear índices para nueva funcionalidad
CREATE INDEX IF NOT EXISTS idx_logs_modulo ON logs_actividad(modulo);
CREATE INDEX IF NOT EXISTS idx_logs_accion ON logs_actividad(accion);
CREATE INDEX IF NOT EXISTS idx_logs_fecha ON logs_actividad(created_at);

-- ==========================================
-- FUNCIONES UTILITARIAS
-- ==========================================

-- Función para calcular horas trabajadas automáticamente
CREATE OR REPLACE FUNCTION calcular_horas_trabajadas()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular horas solo si hay entrada y salida
    IF NEW.hora_entrada IS NOT NULL AND NEW.hora_salida IS NOT NULL THEN
        NEW.horas_trabajadas = EXTRACT(EPOCH FROM (NEW.hora_salida - NEW.hora_entrada)) / 3600.0;
        
        -- Calcular tardanza si hay horario del docente
        SELECT 
            CASE 
                WHEN NEW.hora_entrada > d.horario_entrada THEN
                    EXTRACT(EPOCH FROM (NEW.hora_entrada::time - d.horario_entrada)) / 60.0
                ELSE 0
            END
        INTO NEW.tardanza_minutos
        FROM docentes d 
        WHERE d.id = NEW.docente_id;
        
        -- Calcular salida temprana si hay horario del docente
        SELECT 
            CASE 
                WHEN NEW.hora_salida < d.horario_salida THEN
                    EXTRACT(EPOCH FROM (d.horario_salida - NEW.hora_salida::time)) / 60.0
                ELSE 0
            END
        INTO NEW.salida_temprana_min
        FROM docentes d 
        WHERE d.id = NEW.docente_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a asistencias
DROP TRIGGER IF EXISTS trigger_calcular_horas ON asistencias;
CREATE TRIGGER trigger_calcular_horas
    BEFORE INSERT OR UPDATE ON asistencias
    FOR EACH ROW EXECUTE FUNCTION calcular_horas_trabajadas();

-- ==========================================
-- FUNCIÓN PARA GENERAR PLANILLAS AUTOMÁTICAS
-- ==========================================

CREATE OR REPLACE FUNCTION generar_planilla_mensual(
    p_docente_id UUID,
    p_mes INTEGER,
    p_año INTEGER
) RETURNS UUID AS $$
DECLARE
    v_planilla_id UUID;
    v_contrato_id INTEGER;
    v_tarifa_hora DECIMAL(8,2);
    v_horas_contractuales DECIMAL(6,2);
    v_horas_trabajadas DECIMAL(6,2);
    v_dias_trabajados INTEGER;
    v_tardanzas_cantidad INTEGER;
    v_tardanzas_minutos INTEGER;
BEGIN
    -- Obtener contrato activo del docente
    SELECT id, tarifa_por_hora, 
           COALESCE(horas_semanales_minimas * 4, 160) -- 4 semanas por mes promedio
    INTO v_contrato_id, v_tarifa_hora, v_horas_contractuales
    FROM contratos_docentes 
    WHERE docente_id = p_docente_id AND activo = true
    ORDER BY fecha_inicio DESC
    LIMIT 1;
    
    IF v_contrato_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró contrato activo para el docente';
    END IF;
    
    -- Calcular estadísticas del mes
    SELECT 
        COALESCE(SUM(horas_trabajadas), 0),
        COUNT(DISTINCT fecha),
        COUNT(CASE WHEN tardanza_minutos > 0 THEN 1 END),
        COALESCE(SUM(tardanza_minutos), 0)
    INTO v_horas_trabajadas, v_dias_trabajados, v_tardanzas_cantidad, v_tardanzas_minutos
    FROM asistencias
    WHERE docente_id = p_docente_id 
    AND EXTRACT(MONTH FROM fecha) = p_mes
    AND EXTRACT(YEAR FROM fecha) = p_año;
    
    -- Crear planilla
    INSERT INTO planillas_horas (
        docente_id, contrato_id, mes, año,
        horas_contractuales, horas_trabajadas,
        dias_trabajados, tardanzas_cantidad, tardanzas_minutos,
        tarifa_hora, monto_horas_normales, monto_total,
        calculado
    ) VALUES (
        p_docente_id, v_contrato_id, p_mes, p_año,
        v_horas_contractuales, v_horas_trabajadas,
        v_dias_trabajados, v_tardanzas_cantidad, v_tardanzas_minutos,
        v_tarifa_hora, 
        v_horas_trabajadas * v_tarifa_hora,
        v_horas_trabajadas * v_tarifa_hora,
        true
    )
    RETURNING id INTO v_planilla_id;
    
    RETURN v_planilla_id;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- VERIFICAR MEJORAS APLICADAS
-- ==========================================

-- Verificar nuevas columnas agregadas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('usuarios', 'areas', 'docentes', 'asistencias', 'justificaciones')
AND column_name IN (
    'token_reset_password', 'coordinador_id', 'codigo', 'fecha_nacimiento',
    'estado_salida', 'horas_trabajadas', 'horas_afectadas'
)
ORDER BY table_name, column_name;

COMMIT;
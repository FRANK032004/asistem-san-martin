-- =========================================
-- MIGRACIÓN COMPLETA ASISTEM SAN MARTÍN
-- NUEVAS TABLAS PARA SISTEMA EMPRESARIAL
-- Fecha: 2025-10-08
-- =========================================

-- 1. TABLA: CONTRATOS DE DOCENTES
-- Gestión flexible de contratos por horas, fijos y temporales
CREATE TABLE contratos_docentes (
    id SERIAL PRIMARY KEY,
    docente_id UUID NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,
    tipo_contrato VARCHAR(20) NOT NULL DEFAULT 'por_horas', -- por_horas, fijo, temporal
    horas_semanales_minimas DECIMAL(5,2),
    horas_semanales_maximas DECIMAL(5,2),
    tarifa_por_hora DECIMAL(8,2) NOT NULL,
    sueldo_base DECIMAL(10,2),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    activo BOOLEAN DEFAULT true,
    observaciones TEXT,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

-- Índices para contratos
CREATE INDEX idx_contratos_docente ON contratos_docentes(docente_id);
CREATE INDEX idx_contratos_tipo ON contratos_docentes(tipo_contrato);
CREATE INDEX idx_contratos_activo ON contratos_docentes(activo);

-- 2. TABLA: HORARIOS BASE
-- Horarios regulares por docente y área
CREATE TABLE horarios_base (
    id SERIAL PRIMARY KEY,
    docente_id UUID NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,
    area_id INTEGER NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL CHECK (dia_semana >= 1 AND dia_semana <= 7), -- 1=Lunes, 7=Domingo
    hora_inicio TIME(6) NOT NULL,
    hora_fin TIME(6) NOT NULL,
    tipo_clase VARCHAR(30), -- teoria, practica, laboratorio
    horas_semana DECIMAL(4,2) NOT NULL, -- Horas semanales de este bloque
    activo BOOLEAN DEFAULT true,
    fecha_vigencia DATE,
    fecha_fin DATE,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

-- Índices para horarios base
CREATE INDEX idx_horarios_docente ON horarios_base(docente_id);
CREATE INDEX idx_horarios_dia ON horarios_base(dia_semana);
CREATE INDEX idx_horarios_activo ON horarios_base(activo);

-- 3. TABLA: HORAS TRABAJADAS
-- Control detallado de cada sesión de trabajo
CREATE TABLE horas_trabajadas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    docente_id UUID NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,
    horario_base_id INTEGER REFERENCES horarios_base(id) ON DELETE SET NULL, -- Null si es hora extra
    asistencia_id UUID REFERENCES asistencias(id) ON DELETE SET NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME(6) NOT NULL,
    hora_fin TIME(6) NOT NULL,
    horas_programadas DECIMAL(4,2) NOT NULL,
    horas_efectivas DECIMAL(4,2) NOT NULL,
    horas_extras DECIMAL(4,2) DEFAULT 0,
    tipo_hora VARCHAR(20) NOT NULL DEFAULT 'normal', -- normal, extra, feriado
    tardanza_minutos INTEGER DEFAULT 0,
    salida_temprana INTEGER DEFAULT 0, -- minutos
    estado VARCHAR(20) DEFAULT 'completo', -- completo, incompleto, tardanza
    observaciones TEXT,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

-- Índices para horas trabajadas
CREATE INDEX idx_horas_docente_fecha ON horas_trabajadas(docente_id, fecha);
CREATE INDEX idx_horas_fecha ON horas_trabajadas(fecha);
CREATE INDEX idx_horas_tipo ON horas_trabajadas(tipo_hora);

-- 4. TABLA: PLANILLAS DE HORAS
-- Cálculos automáticos mensuales por docente
CREATE TABLE planillas_horas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    docente_id UUID NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,
    contrato_id INTEGER NOT NULL REFERENCES contratos_docentes(id) ON DELETE CASCADE,
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    año INTEGER NOT NULL,
    
    -- Resumen de horas
    horas_contractuales DECIMAL(6,2) NOT NULL,
    horas_trabajadas DECIMAL(6,2) NOT NULL,
    horas_extras DECIMAL(6,2) DEFAULT 0,
    horas_faltantes DECIMAL(6,2) DEFAULT 0,
    
    -- Incidencias
    dias_trabajados INTEGER NOT NULL,
    tardanzas_cantidad INTEGER DEFAULT 0,
    tardanzas_minutos INTEGER DEFAULT 0,
    faltas_justificadas INTEGER DEFAULT 0,
    faltas_injustificadas INTEGER DEFAULT 0,
    
    -- Cálculos económicos
    tarifa_hora DECIMAL(8,2) NOT NULL,
    monto_horas_normales DECIMAL(10,2) NOT NULL,
    monto_horas_extras DECIMAL(10,2) DEFAULT 0,
    descuento_tardanzas DECIMAL(10,2) DEFAULT 0,
    descuento_faltas DECIMAL(10,2) DEFAULT 0,
    bonificaciones DECIMAL(10,2) DEFAULT 0,
    monto_total DECIMAL(10,2) NOT NULL,
    
    -- Control de estado
    calculado BOOLEAN DEFAULT false,
    aprobado BOOLEAN DEFAULT false,
    pagado BOOLEAN DEFAULT false,
    fecha_aprobacion TIMESTAMP(6),
    fecha_pago TIMESTAMP(6),
    observaciones TEXT,
    
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_planilla_mes_año UNIQUE(docente_id, mes, año)
);

-- Índices para planillas
CREATE INDEX idx_planillas_periodo ON planillas_horas(mes, año);
CREATE INDEX idx_planillas_calculado ON planillas_horas(calculado);
CREATE INDEX idx_planillas_aprobado ON planillas_horas(aprobado);

-- 5. TABLA: EVALUACIONES DE DOCENTES
-- Métricas objetivas de rendimiento
CREATE TABLE evaluaciones_docentes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    docente_id UUID NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,
    evaluador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE NO ACTION,
    periodo VARCHAR(20) NOT NULL, -- 2024-Q1, 2024-S1, etc
    
    -- Métricas de evaluación
    porcentaje_asistencia DECIMAL(5,2) NOT NULL,
    porcentaje_puntualidad DECIMAL(5,2) NOT NULL,
    horas_completas DECIMAL(5,2) NOT NULL,
    tardanzas_promedio DECIMAL(5,2) NOT NULL,
    faltas_total INTEGER NOT NULL,
    
    -- Calificaciones
    cumplimiento_horario INTEGER CHECK (cumplimiento_horario >= 1 AND cumplimiento_horario <= 5),
    responsabilidad INTEGER CHECK (responsabilidad >= 1 AND responsabilidad <= 5),
    calificacion_general DECIMAL(3,1) CHECK (calificacion_general >= 1.0 AND calificacion_general <= 5.0),
    
    -- Observaciones
    fortalezas TEXT,
    areas_mejora TEXT,
    recomendaciones TEXT,
    
    fecha_evaluacion TIMESTAMP(6) NOT NULL,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

-- Índices para evaluaciones
CREATE INDEX idx_evaluaciones_docente ON evaluaciones_docentes(docente_id);
CREATE INDEX idx_evaluaciones_periodo ON evaluaciones_docentes(periodo);

-- 6. TABLA: NOTIFICACIONES
-- Sistema de alertas automáticas
CREATE TABLE notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- tardanza, falta, justificacion, planilla, evaluacion
    titulo VARCHAR(100) NOT NULL,
    mensaje TEXT NOT NULL,
    datos JSONB, -- Datos adicionales para la notificación
    leido BOOLEAN DEFAULT false,
    importante BOOLEAN DEFAULT false,
    fecha_envio TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    fecha_leido TIMESTAMP(6)
);

-- Índices para notificaciones
CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leido ON notificaciones(leido);
CREATE INDEX idx_notificaciones_tipo ON notificaciones(tipo);

-- 7. TABLA: SESIONES DE USUARIO
-- Control de seguridad avanzada
CREATE TABLE sesiones_usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    dispositivo VARCHAR(255),
    navegador VARCHAR(255),
    ip_address INET NOT NULL,
    ubicacion VARCHAR(255), -- Ciudad, país aproximado
    activa BOOLEAN DEFAULT true,
    ultima_actividad TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP(6) NOT NULL,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

-- Índices para sesiones
CREATE INDEX idx_sesiones_usuario ON sesiones_usuarios(usuario_id);
CREATE INDEX idx_sesiones_token ON sesiones_usuarios(token);
CREATE INDEX idx_sesiones_activa ON sesiones_usuarios(activa);

-- ==========================================
-- TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- ==========================================

-- Trigger para actualizar updated_at en contratos_docentes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contratos_docentes_updated_at BEFORE UPDATE ON contratos_docentes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_planillas_horas_updated_at BEFORE UPDATE ON planillas_horas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- INSERTAR DATOS DE CONFIGURACIÓN
-- ==========================================

-- Configuraciones para el nuevo sistema
INSERT INTO configuraciones (clave, valor, descripcion, tipo) VALUES
('sistema.nombre', 'ASISTEM San Martín', 'Nombre del sistema', 'string'),
('planillas.dia_corte', '30', 'Día de corte mensual para planillas', 'number'),
('tardanzas.tolerancia_minutos', '15', 'Minutos de tolerancia antes de marcar tardanza', 'number'),
('horas_extras.multiplicador', '1.5', 'Multiplicador para pago de horas extras', 'number'),
('evaluaciones.frecuencia_meses', '3', 'Frecuencia de evaluaciones en meses', 'number'),
('notificaciones.email_enabled', 'true', 'Habilitar notificaciones por email', 'boolean'),
('seguridad.sesiones_maximas', '3', 'Número máximo de sesiones simultáneas por usuario', 'number'),
('seguridad.expiracion_dias', '30', 'Días de expiración de sesiones', 'number')
ON CONFLICT (clave) DO NOTHING;

COMMIT;

-- ==========================================
-- VERIFICACIÓN DE MIGRACIÓN
-- ==========================================

-- Verificar que todas las tablas se crearon correctamente
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
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
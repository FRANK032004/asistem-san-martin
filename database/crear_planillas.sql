-- =====================================================
-- SCRIPT: Creación de Tablas de Planillas
-- Descripción: Crea las tablas necesarias para el módulo
--              de planillas de docentes
-- Autor: Sistema de Asistencia
-- Fecha: 2025-01-12
-- =====================================================

-- =====================================================
-- 1. CREAR TABLA PLANILLAS
-- =====================================================
CREATE TABLE IF NOT EXISTS planillas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2100),
  estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'PAGADO', 'ANULADO')),
  
  -- Horas
  horas_regulares DECIMAL(6,2) NOT NULL DEFAULT 0,
  horas_extras DECIMAL(6,2) NOT NULL DEFAULT 0,
  
  -- Montos
  monto_base DECIMAL(10,2) NOT NULL DEFAULT 0,
  bonificaciones DECIMAL(10,2) NOT NULL DEFAULT 0,
  descuentos DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_neto DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Fechas administrativas
  fecha_emision TIMESTAMP(6),
  fecha_pago TIMESTAMP(6),
  
  -- Observaciones
  observaciones TEXT,
  
  -- Auditoría
  created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES usuarios(id),
  updated_by UUID REFERENCES usuarios(id),
  
  -- Constraints
  CONSTRAINT unique_usuario_mes_anio UNIQUE (usuario_id, mes, anio)
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_planillas_usuario ON planillas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_planillas_periodo ON planillas(anio DESC, mes DESC);
CREATE INDEX IF NOT EXISTS idx_planillas_estado ON planillas(estado);
CREATE INDEX IF NOT EXISTS idx_planillas_usuario_periodo ON planillas(usuario_id, anio DESC, mes DESC);

-- Comentarios
COMMENT ON TABLE planillas IS 'Planillas mensuales de docentes con información de pagos';
COMMENT ON COLUMN planillas.mes IS 'Mes de la planilla (1-12)';
COMMENT ON COLUMN planillas.anio IS 'Año de la planilla';
COMMENT ON COLUMN planillas.estado IS 'Estado actual: PENDIENTE, EN_PROCESO, PAGADO, ANULADO';
COMMENT ON COLUMN planillas.horas_regulares IS 'Total de horas regulares trabajadas en el mes';
COMMENT ON COLUMN planillas.horas_extras IS 'Total de horas extras trabajadas en el mes';
COMMENT ON COLUMN planillas.monto_base IS 'Monto base por horas regulares';
COMMENT ON COLUMN planillas.bonificaciones IS 'Total de bonificaciones del mes';
COMMENT ON COLUMN planillas.descuentos IS 'Total de descuentos aplicados';
COMMENT ON COLUMN planillas.total_neto IS 'Monto final a pagar (base + bonificaciones - descuentos)';

-- =====================================================
-- 2. CREAR TABLA DETALLE_PLANILLAS
-- =====================================================
CREATE TABLE IF NOT EXISTS detalle_planillas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  planilla_id UUID NOT NULL REFERENCES planillas(id) ON DELETE CASCADE,
  asistencia_id UUID REFERENCES asistencias(id) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  
  -- Horas del día
  horas_trabajadas DECIMAL(4,2) NOT NULL DEFAULT 0,
  horas_extras DECIMAL(4,2) NOT NULL DEFAULT 0,
  
  -- Observaciones específicas del día
  observaciones TEXT,
  
  -- Auditoría
  created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_detalle_planillas_planilla ON detalle_planillas(planilla_id);
CREATE INDEX IF NOT EXISTS idx_detalle_planillas_fecha ON detalle_planillas(fecha);
CREATE INDEX IF NOT EXISTS idx_detalle_planillas_asistencia ON detalle_planillas(asistencia_id);

-- Comentarios
COMMENT ON TABLE detalle_planillas IS 'Detalle diario de horas trabajadas por planilla';
COMMENT ON COLUMN detalle_planillas.horas_trabajadas IS 'Horas trabajadas en el día';
COMMENT ON COLUMN detalle_planillas.horas_extras IS 'Horas extras trabajadas en el día';

-- =====================================================
-- 3. FUNCIÓN: Calcular Total Neto
-- =====================================================
CREATE OR REPLACE FUNCTION calcular_total_neto_planilla()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_neto := NEW.monto_base + NEW.bonificaciones - NEW.descuentos;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular automáticamente
DROP TRIGGER IF EXISTS trigger_calcular_total_neto ON planillas;
CREATE TRIGGER trigger_calcular_total_neto
  BEFORE INSERT OR UPDATE ON planillas
  FOR EACH ROW
  EXECUTE FUNCTION calcular_total_neto_planilla();

-- =====================================================
-- 4. FUNCIÓN: Actualizar timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION actualizar_timestamp_planilla()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS trigger_actualizar_planilla ON planillas;
CREATE TRIGGER trigger_actualizar_planilla
  BEFORE UPDATE ON planillas
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp_planilla();

DROP TRIGGER IF EXISTS trigger_actualizar_detalle_planilla ON detalle_planillas;
CREATE TRIGGER trigger_actualizar_detalle_planilla
  BEFORE UPDATE ON detalle_planillas
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp_planilla();

-- =====================================================
-- 5. DATOS DE PRUEBA
-- =====================================================

-- Obtener un docente de prueba
DO $$
DECLARE
  docente_id UUID;
  admin_id UUID;
  planilla_id UUID;
  fecha_actual DATE;
  i INTEGER;
BEGIN
  -- Obtener primer docente
  SELECT id INTO docente_id 
  FROM usuarios 
  WHERE rol = 'DOCENTE' 
  LIMIT 1;
  
  -- Obtener admin
  SELECT id INTO admin_id 
  FROM usuarios 
  WHERE rol = 'ADMIN' 
  LIMIT 1;
  
  IF docente_id IS NULL THEN
    RAISE NOTICE 'No hay docentes en el sistema. Crear docentes primero.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Creando planillas de prueba para docente: %', docente_id;
  
  -- Crear planillas de los últimos 3 meses
  FOR i IN 0..2 LOOP
    -- Calcular mes y año
    fecha_actual := CURRENT_DATE - (i || ' months')::INTERVAL;
    
    -- Insertar planilla
    INSERT INTO planillas (
      usuario_id,
      mes,
      anio,
      estado,
      horas_regulares,
      horas_extras,
      monto_base,
      bonificaciones,
      descuentos,
      fecha_emision,
      fecha_pago,
      observaciones,
      created_by,
      updated_by
    ) VALUES (
      docente_id,
      EXTRACT(MONTH FROM fecha_actual)::INTEGER,
      EXTRACT(YEAR FROM fecha_actual)::INTEGER,
      CASE 
        WHEN i = 0 THEN 'PENDIENTE'
        WHEN i = 1 THEN 'EN_PROCESO'
        ELSE 'PAGADO'
      END,
      160.00, -- 8 horas * 20 días
      CASE WHEN i < 2 THEN 10.00 ELSE 0 END, -- Horas extras
      3200.00, -- 160 horas * S/ 20/hora
      CASE WHEN i < 2 THEN 500.00 ELSE 300.00 END, -- Bonificaciones
      CASE WHEN i < 2 THEN 200.00 ELSE 150.00 END, -- Descuentos
      fecha_actual + INTERVAL '5 days',
      CASE WHEN i >= 2 THEN fecha_actual + INTERVAL '10 days' ELSE NULL END,
      CASE 
        WHEN i = 0 THEN 'Planilla del mes actual en proceso de revisión'
        WHEN i = 1 THEN 'Planilla en proceso de aprobación'
        ELSE 'Planilla pagada correctamente'
      END,
      admin_id,
      admin_id
    )
    RETURNING id INTO planilla_id;
    
    RAISE NOTICE 'Planilla creada: % - Mes: % Año: %', 
      planilla_id, 
      EXTRACT(MONTH FROM fecha_actual)::INTEGER,
      EXTRACT(YEAR FROM fecha_actual)::INTEGER;
    
    -- Crear detalle de días trabajados (20 días aprox)
    FOR fecha_actual IN 
      SELECT generate_series(
        DATE_TRUNC('month', CURRENT_DATE - (i || ' months')::INTERVAL)::DATE,
        (DATE_TRUNC('month', CURRENT_DATE - (i || ' months')::INTERVAL) + INTERVAL '1 month - 1 day')::DATE,
        '1 day'::INTERVAL
      )::DATE
    LOOP
      -- Solo días laborables (lunes a viernes)
      IF EXTRACT(DOW FROM fecha_actual) BETWEEN 1 AND 5 THEN
        INSERT INTO detalle_planillas (
          planilla_id,
          fecha,
          horas_trabajadas,
          horas_extras,
          observaciones
        ) VALUES (
          planilla_id,
          fecha_actual,
          8.00,
          CASE WHEN RANDOM() < 0.2 THEN 0.5 ELSE 0 END,
          CASE 
            WHEN RANDOM() < 0.1 THEN 'Día con hora extra por reunión'
            ELSE NULL
          END
        );
      END IF;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Datos de prueba creados exitosamente';
END $$;

-- =====================================================
-- 6. VERIFICACIÓN
-- =====================================================
SELECT 
  p.id,
  u.nombres || ' ' || u.apellidos AS docente,
  p.mes,
  p.anio,
  p.estado,
  p.horas_regulares,
  p.horas_extras,
  p.total_neto,
  COUNT(dp.id) AS dias_registrados
FROM planillas p
JOIN usuarios u ON p.usuario_id = u.id
LEFT JOIN detalle_planillas dp ON p.id = dp.planilla_id
GROUP BY p.id, u.nombres, u.apellidos, p.mes, p.anio, p.estado, 
         p.horas_regulares, p.horas_extras, p.total_neto
ORDER BY p.anio DESC, p.mes DESC;

RAISE NOTICE 'Script ejecutado correctamente';

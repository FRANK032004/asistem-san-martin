-- =====================================================
-- 🔧 CORRECCIÓN DE FUNCIONES POSTGIS
-- Fecha: 2025-01-04
-- 
-- PROBLEMA: Error de tipos en funciones PostGIS
-- SOLUCIÓN: Usar tipos DOUBLE PRECISION para coordenadas
-- =====================================================

-- ============================================
-- ELIMINAR FUNCIONES ANTIGUAS
-- ============================================

DROP FUNCTION IF EXISTS validar_ubicacion_en_radio(FLOAT, FLOAT, INT);
DROP FUNCTION IF EXISTS encontrar_ubicacion_cercana(FLOAT, FLOAT);
DROP FUNCTION IF EXISTS ubicaciones_en_radio(FLOAT, FLOAT, FLOAT);
DROP FUNCTION IF EXISTS calcular_distancia(FLOAT, FLOAT, FLOAT, FLOAT);

-- ============================================
-- FUNCIÓN 1: VALIDAR UBICACIÓN EN RADIO
-- Verifica si las coordenadas están dentro del radio permitido
-- ============================================

CREATE OR REPLACE FUNCTION validar_ubicacion_en_radio(
  lat_docente DOUBLE PRECISION,
  lng_docente DOUBLE PRECISION,
  ubicacion_id BIGINT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM ubicaciones_permitidas
    WHERE id = ubicacion_id
      AND activo = true
      AND ST_DWithin(
        punto_geo,
        ST_MakePoint(lng_docente, lat_docente)::geography,
        radio_metros
      )
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validar_ubicacion_en_radio IS 
'Valida si un punto está dentro del radio de una ubicación permitida';

-- ============================================
-- FUNCIÓN 2: ENCONTRAR UBICACIÓN CERCANA
-- Encuentra la ubicación más cercana y retorna info detallada
-- ============================================

CREATE OR REPLACE FUNCTION encontrar_ubicacion_cercana(
  lat_docente DOUBLE PRECISION,
  lng_docente DOUBLE PRECISION
) RETURNS TABLE (
  id BIGINT,
  nombre VARCHAR(100),
  distancia_metros DOUBLE PRECISION,
  dentro_radio BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.nombre,
    ST_Distance(
      punto_geo,
      ST_MakePoint(lng_docente, lat_docente)::geography
    ) as distancia_metros,
    ST_DWithin(
      punto_geo,
      ST_MakePoint(lng_docente, lat_docente)::geography,
      u.radio_metros
    ) as dentro_radio
  FROM ubicaciones_permitidas u
  WHERE u.activo = true
  ORDER BY punto_geo <-> ST_MakePoint(lng_docente, lat_docente)::geography
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION encontrar_ubicacion_cercana IS 
'Encuentra la ubicación permitida más cercana al punto dado';

-- ============================================
-- FUNCIÓN 3: UBICACIONES EN RADIO
-- Lista todas las ubicaciones dentro de un radio
-- ============================================

CREATE OR REPLACE FUNCTION ubicaciones_en_radio(
  lat_docente DOUBLE PRECISION,
  lng_docente DOUBLE PRECISION,
  radio_metros DOUBLE PRECISION DEFAULT 1000
) RETURNS TABLE (
  id BIGINT,
  nombre VARCHAR(100),
  distancia_metros DOUBLE PRECISION,
  radio_ubicacion DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.nombre,
    ST_Distance(
      punto_geo,
      ST_MakePoint(lng_docente, lat_docente)::geography
    ) as distancia_metros,
    CAST(u.radio_metros AS DOUBLE PRECISION) as radio_ubicacion
  FROM ubicaciones_permitidas u
  WHERE u.activo = true
    AND ST_DWithin(
      punto_geo,
      ST_MakePoint(lng_docente, lat_docente)::geography,
      radio_metros
    )
  ORDER BY distancia_metros;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION ubicaciones_en_radio IS 
'Lista todas las ubicaciones permitidas dentro de un radio dado';

-- ============================================
-- FUNCIÓN 4: CALCULAR DISTANCIA
-- Calcula distancia entre dos puntos (en metros)
-- ============================================

CREATE OR REPLACE FUNCTION calcular_distancia(
  lat1 DOUBLE PRECISION,
  lng1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lng2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
BEGIN
  RETURN ST_Distance(
    ST_MakePoint(lng1, lat1)::geography,
    ST_MakePoint(lng2, lat2)::geography
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_distancia IS 
'Calcula la distancia en metros entre dos coordenadas GPS';

-- ============================================
-- FUNCIÓN 5: ACTUALIZAR PUNTO GEO (para trigger)
-- ============================================

CREATE OR REPLACE FUNCTION actualizar_punto_geo()
RETURNS TRIGGER AS $$
BEGIN
  NEW.punto_geo = ST_SetSRID(
    ST_MakePoint(NEW.longitud, NEW.latitud),
    4326
  )::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RECREAR TRIGGER
-- ============================================

DROP TRIGGER IF EXISTS trigger_actualizar_punto_geo ON ubicaciones_permitidas;

CREATE TRIGGER trigger_actualizar_punto_geo
  BEFORE INSERT OR UPDATE OF latitud, longitud
  ON ubicaciones_permitidas
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_punto_geo();

COMMENT ON TRIGGER trigger_actualizar_punto_geo ON ubicaciones_permitidas IS 
'Actualiza automáticamente punto_geo cuando cambia latitud o longitud';

-- ============================================
-- ACTUALIZAR REGISTROS EXISTENTES
-- ============================================

UPDATE ubicaciones_permitidas
SET punto_geo = ST_SetSRID(
  ST_MakePoint(longitud, latitud),
  4326
)::geography
WHERE punto_geo IS NULL OR latitud IS NOT NULL;

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

DO $$
DECLARE
  total_ubicaciones INT;
  con_punto_geo INT;
BEGIN
  SELECT COUNT(*) INTO total_ubicaciones FROM ubicaciones_permitidas;
  SELECT COUNT(*) INTO con_punto_geo FROM ubicaciones_permitidas WHERE punto_geo IS NOT NULL;
  
  RAISE NOTICE '✅ Funciones PostGIS actualizadas correctamente';
  RAISE NOTICE '📊 Total ubicaciones: %', total_ubicaciones;
  RAISE NOTICE '📍 Con punto_geo: %', con_punto_geo;
END $$;

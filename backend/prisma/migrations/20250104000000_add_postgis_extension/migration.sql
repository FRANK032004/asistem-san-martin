-- =====================================================
-- MIGRACIÓN: Agregar PostGIS Extension
-- Descripción: Instala PostGIS para cálculos geoespaciales
-- Fecha: 2025-01-04
-- Autor: Sistema de Asistencias - Implementación Senior
-- =====================================================

-- 1. Verificar si PostGIS ya está instalado
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'postgis'
    ) THEN
        -- Instalar PostGIS
        CREATE EXTENSION IF NOT EXISTS postgis;
        RAISE NOTICE 'PostGIS extension instalada correctamente ✅';
    ELSE
        RAISE NOTICE 'PostGIS ya estaba instalado ✅';
    END IF;
END$$;

-- 2. Verificar versión de PostGIS
DO $$
DECLARE
    postgis_version TEXT;
BEGIN
    SELECT PostGIS_version() INTO postgis_version;
    RAISE NOTICE 'Versión de PostGIS: %', postgis_version;
END$$;

-- 3. Agregar columna de geografía a ubicaciones_permitidas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ubicaciones_permitidas' 
        AND column_name = 'punto_geo'
    ) THEN
        ALTER TABLE "ubicaciones_permitidas" 
        ADD COLUMN punto_geo GEOGRAPHY(Point, 4326);
        RAISE NOTICE 'Columna punto_geo agregada correctamente ✅';
    ELSE
        RAISE NOTICE 'Columna punto_geo ya existía ✅';
    END IF;
END$$;

-- 4. Crear índice espacial para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_ubicaciones_punto_geo 
ON "ubicaciones_permitidas" USING GIST(punto_geo);

-- 5. Poblar columna punto_geo con datos existentes
UPDATE "ubicaciones_permitidas"
SET punto_geo = ST_SetSRID(
    ST_MakePoint(
        CAST(longitud AS FLOAT8), 
        CAST(latitud AS FLOAT8)
    ),
    4326
)::geography
WHERE punto_geo IS NULL;

-- 6. Verificar que se poblaron los datos
DO $$
DECLARE
    ubicaciones_con_geo INTEGER;
    ubicaciones_total INTEGER;
BEGIN
    SELECT COUNT(*) INTO ubicaciones_con_geo 
    FROM "ubicaciones_permitidas" 
    WHERE punto_geo IS NOT NULL;
    
    SELECT COUNT(*) INTO ubicaciones_total 
    FROM "ubicaciones_permitidas";
    
    RAISE NOTICE 'Ubicaciones con geografía: % de %', ubicaciones_con_geo, ubicaciones_total;
END$$;

-- =====================================================
-- FUNCIONES DE VALIDACIÓN GPS
-- =====================================================

-- Función 1: Validar si un punto está dentro del radio de una ubicación
CREATE OR REPLACE FUNCTION validar_ubicacion_en_radio(
    lat_punto FLOAT,
    lng_punto FLOAT,
    ubicacion_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    esta_en_radio BOOLEAN;
BEGIN
    SELECT ST_DWithin(
        punto_geo,
        ST_SetSRID(ST_MakePoint(lng_punto, lat_punto), 4326)::geography,
        radio_metros
    ) INTO esta_en_radio
    FROM "ubicaciones_permitidas"
    WHERE id = ubicacion_id 
    AND activo = true;
    
    RETURN COALESCE(esta_en_radio, false);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función 2: Encontrar ubicación más cercana
CREATE OR REPLACE FUNCTION encontrar_ubicacion_cercana(
    lat_punto FLOAT,
    lng_punto FLOAT
) RETURNS TABLE (
    ubicacion_id INTEGER,
    nombre_ubicacion VARCHAR(100),
    distancia_metros FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.nombre,
        ST_Distance(
            u.punto_geo,
            ST_SetSRID(ST_MakePoint(lng_punto, lat_punto), 4326)::geography
        ) as distancia
    FROM "ubicaciones_permitidas" u
    WHERE u.activo = true
    ORDER BY distancia
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Función 3: Listar todas las ubicaciones dentro de un radio
CREATE OR REPLACE FUNCTION ubicaciones_en_radio(
    lat_punto FLOAT,
    lng_punto FLOAT,
    radio_busqueda INTEGER DEFAULT 1000
) RETURNS TABLE (
    ubicacion_id INTEGER,
    nombre_ubicacion VARCHAR(100),
    distancia_metros FLOAT,
    dentro_de_radio BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.nombre,
        ST_Distance(
            u.punto_geo,
            ST_SetSRID(ST_MakePoint(lng_punto, lat_punto), 4326)::geography
        ) as distancia,
        ST_DWithin(
            u.punto_geo,
            ST_SetSRID(ST_MakePoint(lng_punto, lat_punto), 4326)::geography,
            u.radio_metros
        ) as en_radio
    FROM "ubicaciones_permitidas" u
    WHERE u.activo = true
    AND ST_DWithin(
        u.punto_geo,
        ST_SetSRID(ST_MakePoint(lng_punto, lat_punto), 4326)::geography,
        radio_busqueda
    )
    ORDER BY distancia;
END;
$$ LANGUAGE plpgsql STABLE;

-- Función 4: Calcular distancia entre dos puntos
CREATE OR REPLACE FUNCTION calcular_distancia(
    lat1 FLOAT,
    lng1 FLOAT,
    lat2 FLOAT,
    lng2 FLOAT
) RETURNS FLOAT AS $$
BEGIN
    RETURN ST_Distance(
        ST_SetSRID(ST_MakePoint(lng1, lat1), 4326)::geography,
        ST_SetSRID(ST_MakePoint(lng2, lat2), 4326)::geography
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- TRIGGER: Auto-actualizar punto_geo
-- =====================================================

CREATE OR REPLACE FUNCTION actualizar_punto_geo()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.latitud != NEW.latitud OR OLD.longitud != NEW.longitud)) THEN
        NEW.punto_geo := ST_SetSRID(
            ST_MakePoint(
                CAST(NEW.longitud AS FLOAT8), 
                CAST(NEW.latitud AS FLOAT8)
            ),
            4326
        )::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_actualizar_punto_geo ON "ubicaciones_permitidas";
CREATE TRIGGER trigger_actualizar_punto_geo
    BEFORE INSERT OR UPDATE OF latitud, longitud
    ON "ubicaciones_permitidas"
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_punto_geo();

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

DO $$
DECLARE
    extension_installed BOOLEAN;
    column_exists BOOLEAN;
    index_exists BOOLEAN;
    functions_count INTEGER;
BEGIN
    -- Verificar extensión
    SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'postgis') INTO extension_installed;
    
    -- Verificar columna
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ubicaciones_permitidas' AND column_name = 'punto_geo'
    ) INTO column_exists;
    
    -- Verificar índice
    SELECT EXISTS(
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_ubicaciones_punto_geo'
    ) INTO index_exists;
    
    -- Contar funciones
    SELECT COUNT(*) INTO functions_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN (
        'validar_ubicacion_en_radio',
        'encontrar_ubicacion_cercana',
        'ubicaciones_en_radio',
        'calcular_distancia'
    );
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '    RESUMEN DE INSTALACIÓN POSTGIS     ';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PostGIS instalado: %', CASE WHEN extension_installed THEN '✅ SÍ' ELSE '❌ NO' END;
    RAISE NOTICE 'Columna punto_geo creada: %', CASE WHEN column_exists THEN '✅ SÍ' ELSE '❌ NO' END;
    RAISE NOTICE 'Índice espacial creado: %', CASE WHEN index_exists THEN '✅ SÍ' ELSE '❌ NO' END;
    RAISE NOTICE 'Funciones creadas: % de 4', functions_count;
    RAISE NOTICE '========================================';
    
    IF extension_installed AND column_exists AND index_exists AND functions_count = 4 THEN
        RAISE NOTICE '✅ MIGRACIÓN COMPLETADA EXITOSAMENTE';
    ELSE
        RAISE WARNING '⚠️ Revisar migración, algunos elementos faltan';
    END IF;
END$$;

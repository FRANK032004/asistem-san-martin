-- ========================================
-- CREACIÓN MANUAL DE BASE DE DATOS
-- Instituto San Martín - Sistema de Asistencia
-- ========================================

-- PASO 1: Crear la base de datos (ejecutar como superusuario)
CREATE DATABASE instituto_san_martin
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'Spanish_Spain.1252'
    LC_CTYPE = 'Spanish_Spain.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- PASO 2: Conectarse a la nueva base de datos
\c instituto_san_martin;

-- PASO 3: Agregar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "postgis_topology";

-- PASO 4: Verificar que las extensiones están instaladas
SELECT 
    name,
    default_version,
    installed_version
FROM pg_available_extensions 
WHERE name IN ('uuid-ossp', 'postgis', 'postgis_topology')
ORDER BY name;

-- PASO 5: Verificar funciones PostGIS
SELECT PostGIS_Version();

-- ========================================
-- LISTO! Ahora ejecuta el script create_database.sql
-- ========================================

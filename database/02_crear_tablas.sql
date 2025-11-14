-- ========================================
-- SISTEMA DE ASISTENCIA INSTITUTO SAN MARTÍN
-- Script de creación de tablas y estructura
-- Fecha: 26 de Agosto 2025
-- ========================================

-- IMPORTANTE: 
-- 1. Crear la base de datos 'instituto_san_martin' manualmente
-- 2. Agregar extensiones PostGIS y uuid-ossp al template
-- 3. Conectarse a la base de datos antes de ejecutar este script

-- Verificar que estamos en la base de datos correcta
SELECT current_database() as base_datos_actual;

-- ========================================
-- EXTENSIONES NECESARIAS
-- ========================================

-- Extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extensión para funciones de geolocalización
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ========================================
-- TABLA: ROLES
-- ========================================

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar roles por defecto
INSERT INTO roles (nombre, descripcion) VALUES 
('admin', 'Administrador del sistema'),
('docente', 'Docente del instituto'),
('supervisor', 'Supervisor académico');

-- ========================================
-- TABLA: USUARIOS
-- ========================================

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dni VARCHAR(20) NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    rol_id INTEGER NOT NULL REFERENCES roles(id),
    activo BOOLEAN DEFAULT true,
    ultimo_acceso TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TABLA: ÁREAS/DEPARTAMENTOS
-- ========================================

CREATE TABLE areas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar áreas por defecto
INSERT INTO areas (nombre, descripcion) VALUES 
('Matemáticas', 'Departamento de Matemáticas'),
('Comunicación', 'Departamento de Comunicación'),
('Ciencias', 'Departamento de Ciencias Naturales'),
('Historia', 'Departamento de Ciencias Sociales'),
('Educación Física', 'Departamento de Educación Física'),
('Inglés', 'Departamento de Idiomas'),
('Arte', 'Departamento de Arte y Cultura'),
('Psicología', 'Departamento de Psicología');

-- ========================================
-- TABLA: DOCENTES (Información adicional)
-- ========================================

CREATE TABLE docentes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    area_id INTEGER REFERENCES areas(id),
    codigo_docente VARCHAR(20) UNIQUE,
    fecha_ingreso DATE,
    horario_entrada TIME DEFAULT '07:30:00',
    horario_salida TIME DEFAULT '17:30:00',
    sueldo DECIMAL(10,2),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TABLA: UBICACIONES PERMITIDAS
-- ========================================

CREATE TABLE ubicaciones_permitidas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    latitud DECIMAL(10, 8) NOT NULL,
    longitud DECIMAL(11, 8) NOT NULL,
    radio_metros INTEGER DEFAULT 100, -- Radio permitido en metros
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar ubicación del instituto (ejemplo - reemplazar con coordenadas reales)
INSERT INTO ubicaciones_permitidas (nombre, descripcion, latitud, longitud, radio_metros) VALUES 
('Instituto San Martín - Sede Principal', 'Ubicación principal del instituto', -12.0464, -77.0428, 50),
('Instituto San Martín - Sede Secundaria', 'Sede secundaria del instituto', -12.0500, -77.0450, 50);

-- ========================================
-- TABLA: ASISTENCIAS
-- ========================================

CREATE TABLE asistencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    docente_id UUID NOT NULL REFERENCES docentes(id),
    fecha DATE NOT NULL,
    hora_entrada TIMESTAMP,
    hora_salida TIMESTAMP,
    latitud_entrada DECIMAL(10, 8),
    longitud_entrada DECIMAL(11, 8),
    latitud_salida DECIMAL(10, 8),
    longitud_salida DECIMAL(11, 8),
    ubicacion_entrada_id INTEGER REFERENCES ubicaciones_permitidas(id),
    ubicacion_salida_id INTEGER REFERENCES ubicaciones_permitidas(id),
    estado VARCHAR(20) DEFAULT 'presente', -- presente, tarde, ausente, justificado
    observaciones TEXT,
    ip_entrada INET,
    ip_salida INET,
    dispositivo_entrada TEXT,
    dispositivo_salida TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TABLA: JUSTIFICACIONES
-- ========================================

CREATE TABLE justificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    docente_id UUID NOT NULL REFERENCES docentes(id),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- enfermedad, personal, capacitacion, etc.
    motivo TEXT NOT NULL,
    documento_adjunto VARCHAR(255), -- ruta del archivo
    estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, aprobado, rechazado
    aprobado_por UUID REFERENCES usuarios(id),
    fecha_aprobacion TIMESTAMP,
    observaciones_admin TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TABLA: HORARIOS ESPECIALES
-- ========================================

CREATE TABLE horarios_especiales (
    id SERIAL PRIMARY KEY,
    docente_id UUID NOT NULL REFERENCES docentes(id),
    fecha DATE NOT NULL,
    hora_entrada_especial TIME,
    hora_salida_especial TIME,
    motivo TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TABLA: REPORTES GENERADOS
-- ========================================

CREATE TABLE reportes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generado_por UUID NOT NULL REFERENCES usuarios(id),
    tipo_reporte VARCHAR(50) NOT NULL, -- asistencia_mensual, asistencia_docente, etc.
    parametros JSONB, -- Parámetros del reporte en formato JSON
    fecha_inicio DATE,
    fecha_fin DATE,
    archivo_generado VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TABLA: CONFIGURACIONES DEL SISTEMA
-- ========================================

CREATE TABLE configuraciones (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar configuraciones por defecto
INSERT INTO configuraciones (clave, valor, descripcion, tipo) VALUES 
('tolerancia_entrada_minutos', '15', 'Minutos de tolerancia para entrada', 'number'),
('tolerancia_salida_minutos', '10', 'Minutos de tolerancia para salida', 'number'),
('radio_gps_metros', '50', 'Radio permitido en metros para GPS', 'number'),
('horario_entrada_general', '07:30', 'Horario general de entrada', 'string'),
('horario_salida_general', '17:30', 'Horario general de salida', 'string'),
('nombre_instituto', 'Instituto San Martín', 'Nombre oficial del instituto', 'string'),
('email_admin', 'admin@sanmartin.edu.pe', 'Email del administrador', 'string');

-- ========================================
-- TABLA: LOG DE ACTIVIDADES
-- ========================================

CREATE TABLE logs_actividad (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id),
    accion VARCHAR(100) NOT NULL,
    tabla_afectada VARCHAR(50),
    registro_id UUID,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- ÍNDICES PARA OPTIMIZAR CONSULTAS
-- ========================================

-- Índices para búsquedas frecuentes
CREATE INDEX idx_usuarios_dni ON usuarios(dni);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol_id);
CREATE INDEX idx_docentes_codigo ON docentes(codigo_docente);
CREATE INDEX idx_asistencias_docente_fecha ON asistencias(docente_id, fecha);
CREATE INDEX idx_asistencias_fecha ON asistencias(fecha);
CREATE INDEX idx_justificaciones_docente ON justificaciones(docente_id);
CREATE INDEX idx_justificaciones_estado ON justificaciones(estado);

-- Índices geoespaciales para ubicaciones
CREATE INDEX idx_ubicaciones_coords ON ubicaciones_permitidas USING GIST(ST_MakePoint(longitud, latitud));

-- ========================================
-- TRIGGERS PARA UPDATED_AT
-- ========================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a todas las tablas que tienen updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_docentes_updated_at BEFORE UPDATE ON docentes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_areas_updated_at BEFORE UPDATE ON areas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ubicaciones_updated_at BEFORE UPDATE ON ubicaciones_permitidas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_asistencias_updated_at BEFORE UPDATE ON asistencias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_justificaciones_updated_at BEFORE UPDATE ON justificaciones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- FUNCIONES ÚTILES
-- ========================================

-- Función para calcular distancia entre dos puntos GPS
CREATE OR REPLACE FUNCTION calcular_distancia_gps(
    lat1 DECIMAL, lon1 DECIMAL, 
    lat2 DECIMAL, lon2 DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
    RETURN ST_Distance(
        ST_GeogFromText('POINT(' || lon1 || ' ' || lat1 || ')'),
        ST_GeogFromText('POINT(' || lon2 || ' ' || lat2 || ')')
    );
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si una ubicación está dentro del radio permitido
CREATE OR REPLACE FUNCTION verificar_ubicacion_valida(
    lat DECIMAL, lon DECIMAL, ubicacion_id INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    ubicacion_record RECORD;
    distancia DECIMAL;
BEGIN
    SELECT * INTO ubicacion_record 
    FROM ubicaciones_permitidas 
    WHERE id = ubicacion_id AND activo = true;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    distancia := calcular_distancia_gps(lat, lon, ubicacion_record.latitud, ubicacion_record.longitud);
    
    RETURN distancia <= ubicacion_record.radio_metros;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- DATOS DE PRUEBA (OPCIONAL)
-- ========================================

-- Usuario administrador por defecto
INSERT INTO usuarios (dni, nombres, apellidos, email, password_hash, rol_id) VALUES 
('12345678', 'Admin', 'Sistema', 'admin@sanmartin.edu.pe', '$2b$10$example_hash_here', 1);

-- Docente de prueba
DO $$
DECLARE
    user_id UUID;
BEGIN
    INSERT INTO usuarios (dni, nombres, apellidos, email, password_hash, rol_id) 
    VALUES ('87654321', 'María', 'García López', 'maria.garcia@sanmartin.edu.pe', '$2b$10$example_hash_here', 2)
    RETURNING id INTO user_id;
    
    INSERT INTO docentes (usuario_id, area_id, codigo_docente, fecha_ingreso) 
    VALUES (user_id, 1, 'DOC001', '2024-01-15');
END $$;

-- ========================================
-- SCRIPT COMPLETADO
-- ========================================

COMMENT ON DATABASE instituto_san_martin IS 'Base de datos del Sistema de Asistencia - Instituto San Martín';

-- Mostrar resumen de tablas creadas
SELECT 
    tablename,
    schemaname
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ========================================
-- INSTRUCCIONES DE USO:
-- 1. Ejecutar este script como superusuario de PostgreSQL
-- 2. Cambiar las coordenadas GPS reales del instituto
-- 3. Actualizar los hashes de contraseñas con valores reales
-- 4. Personalizar las áreas según el instituto
-- ========================================

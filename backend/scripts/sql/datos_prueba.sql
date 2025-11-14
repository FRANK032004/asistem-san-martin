-- Insertar datos de prueba para el sistema
-- Solo si no existen datos

-- Insertar roles si no existen
INSERT INTO roles (nombre, descripcion) 
SELECT 'ADMIN', 'Administrador del sistema'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre = 'ADMIN');

INSERT INTO roles (nombre, descripcion) 
SELECT 'DOCENTE', 'Docente del instituto'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre = 'DOCENTE');

-- Insertar usuario admin si no existe
INSERT INTO usuarios (nombres, apellidos, dni, email, password_hash, rol_id, activo)
SELECT 'Admin', 'Sistema', '12345678', 'admin@sanmartin.edu', '$2b$10$rOEGVG.DEVb8fZC/YLLXqO7k8C/5fF5Iq4GqXY5Fs3rAS5Jdwy7wK', 
       (SELECT id FROM roles WHERE nombre = 'ADMIN'), true
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'admin@sanmartin.edu');

-- Insertar áreas si no existen
INSERT INTO areas (nombre, descripcion, color_hex)
SELECT 'Matemáticas', 'Área de Matemáticas', '#3B82F6'
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE nombre = 'Matemáticas');

INSERT INTO areas (nombre, descripcion, color_hex)
SELECT 'Ciencias', 'Área de Ciencias Naturales', '#10B981'
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE nombre = 'Ciencias');

-- Insertar ubicaciones permitidas si no existen
INSERT INTO ubicaciones_permitidas (nombre, latitud, longitud, radio_metros, activa)
SELECT 'Campus Principal', -6.7836, -79.8365, 50, true
WHERE NOT EXISTS (SELECT 1 FROM ubicaciones_permitidas WHERE nombre = 'Campus Principal');

INSERT INTO ubicaciones_permitidas (nombre, latitud, longitud, radio_metros, activa)
SELECT 'Laboratorio Externo', -6.7840, -79.8370, 30, true
WHERE NOT EXISTS (SELECT 1 FROM ubicaciones_permitidas WHERE nombre = 'Laboratorio Externo');

-- Insertar docentes de prueba si no existen
DO $$
DECLARE
    area_matematicas_id INTEGER;
    area_ciencias_id INTEGER;
    rol_docente_id INTEGER;
BEGIN
    -- Obtener IDs
    SELECT id INTO area_matematicas_id FROM areas WHERE nombre = 'Matemáticas';
    SELECT id INTO area_ciencias_id FROM areas WHERE nombre = 'Ciencias';
    SELECT id INTO rol_docente_id FROM roles WHERE nombre = 'DOCENTE';
    
    -- Insertar usuarios docentes
    INSERT INTO usuarios (nombres, apellidos, dni, email, password_hash, rol_id, activo)
    SELECT 'Juan Carlos', 'Pérez López', '20456789', 'jperez@sanmartin.edu', 
           '$2b$10$rOEGVG.DEVb8fZC/YLLXqO7k8C/5fF5Iq4GqXY5Fs3rAS5Jdwy7wK', rol_docente_id, true
    WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'jperez@sanmartin.edu');
    
    INSERT INTO usuarios (nombres, apellidos, dni, email, password_hash, rol_id, activo)
    SELECT 'María Elena', 'García Ruiz', '20456790', 'mgarcia@sanmartin.edu', 
           '$2b$10$rOEGVG.DEVb8fZC/YLLXqO7k8C/5fF5Iq4GqXY5Fs3rAS5Jdwy7wK', rol_docente_id, true
    WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'mgarcia@sanmartin.edu');
    
    INSERT INTO usuarios (nombres, apellidos, dni, email, password_hash, rol_id, activo)
    SELECT 'Carlos Alberto', 'Rodríguez Silva', '20456791', 'crodriguez@sanmartin.edu', 
           '$2b$10$rOEGVG.DEVb8fZC/YLLXqO7k8C/5fF5Iq4GqXY5Fs3rAS5Jdwy7wK', rol_docente_id, true
    WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'crodriguez@sanmartin.edu');
    
    -- Insertar datos de docentes
    INSERT INTO docentes (usuario_id, area_id, codigo_docente, fecha_ingreso, horario_entrada, horario_salida)
    SELECT u.id, area_matematicas_id, 'DOC001', CURRENT_DATE - INTERVAL '1 year', '08:00:00', '17:00:00'
    FROM usuarios u 
    WHERE u.email = 'jperez@sanmartin.edu' 
    AND NOT EXISTS (SELECT 1 FROM docentes WHERE usuario_id = u.id);
    
    INSERT INTO docentes (usuario_id, area_id, codigo_docente, fecha_ingreso, horario_entrada, horario_salida)
    SELECT u.id, area_ciencias_id, 'DOC002', CURRENT_DATE - INTERVAL '6 months', '08:00:00', '16:00:00'
    FROM usuarios u 
    WHERE u.email = 'mgarcia@sanmartin.edu' 
    AND NOT EXISTS (SELECT 1 FROM docentes WHERE usuario_id = u.id);
    
    INSERT INTO docentes (usuario_id, area_id, codigo_docente, fecha_ingreso, horario_entrada, horario_salida)
    SELECT u.id, area_matematicas_id, 'DOC003', CURRENT_DATE - INTERVAL '2 months', '09:00:00', '18:00:00'
    FROM usuarios u 
    WHERE u.email = 'crodriguez@sanmartin.edu' 
    AND NOT EXISTS (SELECT 1 FROM docentes WHERE usuario_id = u.id);
    
END $$;

-- Insertar asistencias de hoy para pruebas
DO $$
DECLARE
    docente_rec RECORD;
    ubicacion_id INTEGER;
BEGIN
    SELECT id INTO ubicacion_id FROM ubicaciones_permitidas WHERE nombre = 'Campus Principal' LIMIT 1;
    
    FOR docente_rec IN (SELECT id FROM docentes LIMIT 3)
    LOOP
        INSERT INTO asistencias (
            docente_id, fecha, hora_entrada, ubicacion_entrada_id, 
            latitud_entrada, longitud_entrada, gps_valido_entrada
        )
        SELECT docente_rec.id, CURRENT_DATE, '08:05:00', ubicacion_id, -6.7836, -79.8365, true
        WHERE NOT EXISTS (
            SELECT 1 FROM asistencias 
            WHERE docente_id = docente_rec.id AND fecha = CURRENT_DATE
        );
    END LOOP;
END $$;
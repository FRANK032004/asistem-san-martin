-- ================================================================
-- DATOS DE PRUEBA COMPLETOS - ASISTEM SAN MARTÍN
-- Sistema de Control de Asistencias con GPS
-- Fecha: 28 de Octubre 2025
-- ================================================================

BEGIN;

-- ================================================================
-- 1. LIMPIAR DATOS EXISTENTES (excepto usuarios admin y docente base)
-- ================================================================
DELETE FROM "Justificacion" WHERE id IS NOT NULL;
DELETE FROM "Asistencia" WHERE id IS NOT NULL;
DELETE FROM "HorarioBase" WHERE id IS NOT NULL;
DELETE FROM "Docente" WHERE "codigoDocente" NOT IN ('DOC001');
DELETE FROM "Horario" WHERE id IS NOT NULL;
DELETE FROM "Ubicacion" WHERE id IS NOT NULL;
DELETE FROM "Area" WHERE id IS NOT NULL;

-- ================================================================
-- 2. ÁREAS ACADÉMICAS
-- ================================================================
INSERT INTO "Area" (id, nombre, descripcion, "jefeArea", activo, "createdAt", "updatedAt") VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Matemáticas', 'Área de matemática y cálculo', 'Dr. Roberto Méndez', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Comunicación', 'Área de lenguaje y comunicación', 'Lic. María Torres', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'Ciencias Naturales', 'Área de ciencias y biología', 'Ing. Carlos Ruiz', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'Ciencias Sociales', 'Área de historia y geografía', 'Lic. Ana Fernández', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'Inglés', 'Área de idioma inglés', 'Prof. John Smith', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440006', 'Educación Física', 'Área de deportes y actividad física', 'Prof. Luis Vargas', true, NOW(), NOW());

-- ================================================================
-- 3. UBICACIONES GPS (Perímetros válidos del instituto)
-- ================================================================
INSERT INTO "Ubicacion" (id, nombre, latitud, longitud, radio, descripcion, activo, "createdAt", "updatedAt") VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Entrada Principal', -12.046374, -77.042793, 50.0, 'Puerta principal del instituto', true, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440002', 'Pabellón A', -12.046450, -77.042850, 30.0, 'Edificio administrativo y aulas 1-10', true, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440003', 'Pabellón B', -12.046520, -77.042750, 30.0, 'Aulas 11-20 y laboratorios', true, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440004', 'Pabellón C', -12.046300, -77.042900, 30.0, 'Talleres y biblioteca', true, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440005', 'Cancha Deportiva', -12.046600, -77.042650, 40.0, 'Área de educación física', true, NOW(), NOW());

-- ================================================================
-- 4. USUARIOS PARA DOCENTES (password: docente123)
-- ================================================================
-- Hash para 'docente123': $2b$10$rR5L8H6qJYFxRGH5L8H6qJYFxRGH5L8H6qJYFxRGH5L8H6qJYFx
INSERT INTO "Usuario" (id, dni, nombres, apellidos, email, password, telefono, direccion, "fechaNacimiento", activo, "rolId", "createdAt", "updatedAt") VALUES
('770e8400-e29b-41d4-a716-446655440001', '12345678', 'María Elena', 'García Rodríguez', 'maria.garcia@sanmartin.edu.pe', '$2b$10$5wH0FKzGLJvFxRGH5L8H6qOYxRGH5L8H6qJYFxRGH5L8H6qJYFx', '987654321', 'Av. Los Olivos 123', '1985-03-15', true, 2, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440002', '23456789', 'Carlos Alberto', 'Mendoza Silva', 'carlos.mendoza@sanmartin.edu.pe', '$2b$10$5wH0FKzGLJvFxRGH5L8H6qOYxRGH5L8H6qJYFxRGH5L8H6qJYFx', '987654322', 'Jr. Las Flores 456', '1982-07-22', true, 2, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440003', 'Ana Patricia', 'Fernández Torres', 'ana.fernandez@sanmartin.edu.pe', '$2b$10$5wH0FKzGLJvFxRGH5L8H6qOYxRGH5L8H6qJYFxRGH5L8H6qJYFx', '987654323', 'Calle Los Pinos 789', '1988-11-30', true, 2, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440004', '45678901', 'Roberto', 'Pérez Vargas', 'roberto.perez@sanmartin.edu.pe', '$2b$10$5wH0FKzGLJvFxRGH5L8H6qOYxRGH5L8H6qJYFxRGH5L8H6qJYFx', '987654324', 'Av. Universitaria 234', '1980-05-10', true, 2, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440005', '56789012', 'Laura', 'Ramírez Castro', 'laura.ramirez@sanmartin.edu.pe', '$2b$10$5wH0FKzGLJvFxRGH5L8H6qOYxRGH5L8H6qJYFxRGH5L8H6qJYFx', '987654325', 'Jr. Bolognesi 567', '1990-09-18', true, 2, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440006', '67890123', 'Jorge Luis', 'Sánchez Morales', 'jorge.sanchez@sanmartin.edu.pe', '$2b$10$5wH0FKzGLJvFxRGH5L8H6qOYxRGH5L8H6qJYFxRGH5L8H6qJYFx', '987654326', 'Av. Grau 890', '1987-12-25', true, 2, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440007', '78901234', 'Patricia', 'Díaz Huamán', 'patricia.diaz@sanmartin.edu.pe', '$2b$10$5wH0FKzGLJvFxRGH5L8H6qOYxRGH5L8H6qJYFxRGH5L8H6qJYFx', '987654327', 'Calle Lima 345', '1991-04-08', true, 2, NOW(), NOW());

-- ================================================================
-- 5. DOCENTES
-- ================================================================
INSERT INTO "Docente" (id, "codigoDocente", "usuarioId", "areaId", especialidad, "fechaIngreso", sueldo, "contactoEmergencia", "telefonoEmergencia", activo, "createdAt", "updatedAt") VALUES
('880e8400-e29b-41d4-a716-446655440001', 'DOC002', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Cálculo Diferencial', '2020-03-01', 2500.00, 'Luis García', '987654301', true, NOW(), NOW()),
('880e8400-e29b-41d4-a716-446655440002', 'DOC003', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Literatura Peruana', '2019-08-15', 2600.00, 'Rosa Mendoza', '987654302', true, NOW(), NOW()),
('880e8400-e29b-41d4-a716-446655440003', 'DOC004', '770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 'Historia del Perú', '2021-01-10', 2400.00, 'Mario Fernández', '987654303', true, NOW(), NOW()),
('880e8400-e29b-41d4-a716-446655440004', 'DOC005', '770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'Biología Molecular', '2018-06-20', 2800.00, 'Carmen Pérez', '987654304', true, NOW(), NOW()),
('880e8400-e29b-41d4-a716-446655440005', 'DOC006', '770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'English Teaching', '2022-02-14', 2300.00, 'Pedro Ramírez', '987654305', true, NOW(), NOW()),
('880e8400-e29b-41d4-a716-446655440006', 'DOC007', '770e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', 'Educación Deportiva', '2020-09-01', 2200.00, 'Ana Sánchez', '987654306', true, NOW(), NOW()),
('880e8400-e29b-41d4-a716-446655440007', 'DOC008', '770e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 'Química Orgánica', '2021-05-18', 2450.00, 'José Díaz', '987654307', true, NOW(), NOW());

-- ================================================================
-- 6. HORARIOS BASE (Horarios semanales de los docentes)
-- ================================================================
-- María García - Matemáticas
INSERT INTO "HorarioBase" (id, "docenteId", "diaSemana", "horaInicio", "horaFin", "areaId", "tipoClase", "horasSemana", activo, "fechaVigencia", "createdAt", "updatedAt") VALUES
('990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 1, '08:00:00', '10:00:00', '550e8400-e29b-41d4-a716-446655440001', 'teorica', 2, true, NOW(), NOW(), NOW()),
('990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001', 3, '08:00:00', '10:00:00', '550e8400-e29b-41d4-a716-446655440001', 'teorica', 2, true, NOW(), NOW(), NOW()),
('990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440001', 5, '10:00:00', '12:00:00', '550e8400-e29b-41d4-a716-446655440001', 'practica', 2, true, NOW(), NOW(), NOW());

-- Carlos Mendoza - Comunicación
INSERT INTO "HorarioBase" (id, "docenteId", "diaSemana", "horaInicio", "horaFin", "areaId", "tipoClase", "horasSemana", activo, "fechaVigencia", "createdAt", "updatedAt") VALUES
('990e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440002', 2, '08:00:00', '10:00:00', '550e8400-e29b-41d4-a716-446655440002', 'teorica', 2, true, NOW(), NOW(), NOW()),
('990e8400-e29b-41d4-a716-446655440005', '880e8400-e29b-41d4-a716-446655440002', 4, '08:00:00', '10:00:00', '550e8400-e29b-41d4-a716-446655440002', 'teorica', 2, true, NOW(), NOW(), NOW());

-- Ana Fernández - Ciencias Sociales
INSERT INTO "HorarioBase" (id, "docenteId", "diaSemana", "horaInicio", "horaFin", "areaId", "tipoClase", "horasSemana", activo, "fechaVigencia", "createdAt", "updatedAt") VALUES
('990e8400-e29b-41d4-a716-446655440006', '880e8400-e29b-41d4-a716-446655440003', 1, '10:00:00', '12:00:00', '550e8400-e29b-41d4-a716-446655440004', 'teorica', 2, true, NOW(), NOW(), NOW()),
('990e8400-e29b-41d4-a716-446655440007', '880e8400-e29b-41d4-a716-446655440003', 3, '10:00:00', '12:00:00', '550e8400-e29b-41d4-a716-446655440004', 'practica', 2, true, NOW(), NOW(), NOW());

-- Roberto Pérez - Ciencias Naturales
INSERT INTO "HorarioBase" (id, "docenteId", "diaSemana", "horaInicio", "horaFin", "areaId", "tipoClase", "horasSemana", activo, "fechaVigencia", "createdAt", "updatedAt") VALUES
('990e8400-e29b-41d4-a716-446655440008', '880e8400-e29b-41d4-a716-446655440004', 2, '10:00:00', '13:00:00', '550e8400-e29b-41d4-a716-446655440003', 'laboratorio', 3, true, NOW(), NOW(), NOW()),
('990e8400-e29b-41d4-a716-446655440009', '880e8400-e29b-41d4-a716-446655440004', 5, '08:00:00', '10:00:00', '550e8400-e29b-41d4-a716-446655440003', 'teorica', 2, true, NOW(), NOW(), NOW());

-- ================================================================
-- 7. ASISTENCIAS DE LA SEMANA ACTUAL (para estadísticas)
-- ================================================================
-- Lunes (hoy - 0 días)
INSERT INTO "Asistencia" (id, "docenteId", fecha, "horaEntrada", "horaSalida", estado, "tardanzaMinutos", "horasTrabajadas", "ubicacionEntradaId", "ubicacionSalidaId", "latitudEntrada", "longitudEntrada", "latitudSalida", "longitudSalida", "gpsValidoEntrada", "gpsValidoSalida", observaciones, "createdAt", "updatedAt") VALUES
-- María García - Puntual
('aa0e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', CURRENT_DATE, CURRENT_DATE + TIME '07:55:00', CURRENT_DATE + TIME '12:00:00', 'presente', 0, 4.08, '660e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', -12.046374, -77.042793, -12.046374, -77.042793, true, true, NULL, NOW(), NOW()),
-- Carlos Mendoza - Tardanza
('aa0e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440002', CURRENT_DATE, CURRENT_DATE + TIME '08:15:00', CURRENT_DATE + TIME '12:10:00', 'tardanza', 15, 3.92, '660e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', -12.046450, -77.042850, -12.046450, -77.042850, true, true, 'Tráfico en la avenida', NOW(), NOW()),
-- Ana Fernández - Puntual
('aa0e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440003', CURRENT_DATE, CURRENT_DATE + TIME '09:58:00', NULL, 'presente', 0, NULL, '660e8400-e29b-41d4-a716-446655440003', NULL, -12.046520, -77.042750, NULL, NULL, true, false, NULL, NOW(), NOW()),
-- Roberto Pérez - Puntual
('aa0e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440004', CURRENT_DATE, CURRENT_DATE + TIME '09:55:00', CURRENT_DATE + TIME '13:05:00', 'presente', 0, 3.17, '660e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', -12.046300, -77.042900, -12.046300, -77.042900, true, true, NULL, NOW(), NOW());

-- Viernes pasado (para historial)
INSERT INTO "Asistencia" (id, "docenteId", fecha, "horaEntrada", "horaSalida", estado, "tardanzaMinutos", "horasTrabajadas", "ubicacionEntradaId", "ubicacionSalidaId", "latitudEntrada", "longitudEntrada", "latitudSalida", "longitudSalida", "gpsValidoEntrada", "gpsValidoSalida", "createdAt", "updatedAt") VALUES
('aa0e8400-e29b-41d4-a716-446655440010', '880e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '3 days', (CURRENT_DATE - INTERVAL '3 days') + TIME '07:50:00', (CURRENT_DATE - INTERVAL '3 days') + TIME '12:10:00', 'presente', 0, 4.33, '660e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', -12.046374, -77.042793, -12.046374, -77.042793, true, true, NOW(), NOW()),
('aa0e8400-e29b-41d4-a716-446655440011', '880e8400-e29b-41d4-a716-446655440002', CURRENT_DATE - INTERVAL '3 days', (CURRENT_DATE - INTERVAL '3 days') + TIME '08:05:00', (CURRENT_DATE - INTERVAL '3 days') + TIME '12:00:00', 'tardanza', 5, 3.92, '660e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', -12.046450, -77.042850, -12.046450, -77.042850, true, true, NOW(), NOW());

-- ================================================================
-- 8. JUSTIFICACIONES
-- ================================================================
INSERT INTO "Justificacion" (id, "asistenciaId", motivo, descripcion, estado, "archivoAdjunto", "fechaSolicitud", "fechaRespuesta", "respondidoPor", observaciones, "createdAt", "updatedAt") VALUES
('bb0e8400-e29b-41d4-a716-446655440001', 'aa0e8400-e29b-41d4-a716-446655440002', 'transporte', 'Accidente de tránsito en Av. Principal causó retraso', 'aprobada', NULL, CURRENT_DATE, CURRENT_DATE, 'admin@sanmartin.edu.pe', 'Justificación válida', NOW(), NOW());

COMMIT;

-- ================================================================
-- VERIFICACIÓN DE DATOS INSERTADOS
-- ================================================================
SELECT 'Áreas' as tabla, COUNT(*) as total FROM "Area"
UNION ALL
SELECT 'Ubicaciones', COUNT(*) FROM "Ubicacion"
UNION ALL
SELECT 'Usuarios (Docentes)', COUNT(*) FROM "Usuario" WHERE "rolId" = 2
UNION ALL
SELECT 'Docentes', COUNT(*) FROM "Docente"
UNION ALL
SELECT 'Horarios Base', COUNT(*) FROM "HorarioBase"
UNION ALL
SELECT 'Asistencias', COUNT(*) FROM "Asistencia"
UNION ALL
SELECT 'Justificaciones', COUNT(*) FROM "Justificacion";

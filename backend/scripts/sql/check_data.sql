SELECT count(*) as total_usuarios FROM usuarios;
SELECT count(*) as total_docentes FROM docentes;
SELECT count(*) as asistencias_hoy FROM asistencias WHERE DATE(fecha) = CURRENT_DATE;
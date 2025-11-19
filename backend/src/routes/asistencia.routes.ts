import express from 'express';
import { 
  registrarEntrada, 
  registrarSalida, 
  obtenerAsistenciasHoy, 
  generarReporte, 
  validarUbicacion,
  getEstadisticasDocente,
  obtenerMisAsistencias
} from '../controllers/asistencia.controller';
import { authenticateToken, requireDocente, requireValidLocation, requireRole } from '../middleware/auth';
import { validateDTO } from '../middleware/validate.middleware';
import { 
  RegistroEntradaDTO, 
  RegistroSalidaDTO, 
  FiltrarAsistenciasDTO
} from '../dtos/asistencia.dto';

const router = express.Router();

// ========================================
// RUTAS PROTEGIDAS PARA DOCENTES
// ========================================

/**
 * POST /api/asistencias/entrada
 * Registrar entrada con validación GPS
 * Acceso: Solo Docentes
 */
router.post('/entrada', 
  authenticateToken, 
  requireDocente, 
  validateDTO(RegistroEntradaDTO),
  requireValidLocation,
  registrarEntrada
);

/**
 * PUT /api/asistencias/salida
 * Registrar salida con validación GPS
 * Acceso: Solo Docentes
 */
router.put('/salida', 
  authenticateToken, 
  requireDocente, 
  validateDTO(RegistroSalidaDTO),
  requireValidLocation,
  registrarSalida
);

/**
 * GET /api/asistencias/hoy
 * Obtener asistencia del día actual
 * Acceso: Docentes (su propia asistencia) y Administradores (todas las asistencias)
 */
router.get('/hoy', 
  authenticateToken, 
  requireRole(['ADMIN', 'docente']), 
  obtenerAsistenciasHoy
);

/**
 * GET /api/asistencias/historial
 * Obtener historial de asistencias del docente
 * Acceso: Solo Docentes (su propio historial)
 */
router.get('/historial', 
  authenticateToken, 
  requireDocente, 
  validateDTO(FiltrarAsistenciasDTO, 'query'),
  generarReporte
);

/**
 * POST /api/asistencias/validar-ubicacion
 * Validar si las coordenadas están en ubicación permitida
 * Acceso: Solo Docentes
 */
router.post('/validar-ubicacion', 
  authenticateToken, 
  requireDocente, 
  validateDTO(RegistroEntradaDTO),
  validarUbicacion
);

/**
 * GET /api/asistencias/estadisticas
 * Obtener estadísticas del docente logueado
 * Acceso: Solo Docentes
 */
router.get('/estadisticas', 
  authenticateToken, 
  requireDocente,
  getEstadisticasDocente
);

/**
 * GET /api/asistencias/mis-asistencias
 * Obtener todas las asistencias del docente logueado
 * Acceso: Solo Docentes
 */
router.get('/mis-asistencias', 
  authenticateToken, 
  requireDocente,
  obtenerMisAsistencias
);

export default router;

/**
 * Rutas de Justificaciones
 * Endpoints para gestionar justificaciones de asistencias
 */

import express from 'express';
import { 
  crearJustificacion,
  obtenerMisJustificaciones,
  obtenerJustificacionesPendientes,
  cambiarEstadoJustificacion,
  eliminarJustificacion
} from '../controllers/justificacion.controller';
import { authenticateToken, requireDocente, requireRole } from '../middleware/auth';
import { validateDTO } from '../middleware/validate.middleware';
import { CreateJustificacionDTO, AprobarJustificacionDTO } from '../dtos/asistencia.dto';
import { justificacionLimiter } from '../middleware/rate-limiter.middleware';

const router = express.Router();

// ========================================
// RUTAS PARA DOCENTES
// ========================================

/**
 * POST /api/justificaciones
 * Crear una nueva justificación
 * Acceso: Solo Docentes
 * Rate limited: 20 justificaciones por hora
 */
router.post('/', 
  authenticateToken, 
  requireDocente,
  justificacionLimiter,
  validateDTO(CreateJustificacionDTO),
  crearJustificacion
);

/**
 * GET /api/justificaciones/mis-justificaciones
 * Obtener justificaciones del docente logueado
 * Acceso: Solo Docentes
 */
router.get('/mis-justificaciones', 
  authenticateToken, 
  requireDocente,
  obtenerMisJustificaciones
);

/**
 * DELETE /api/justificaciones/:id
 * Eliminar una justificación pendiente
 * Acceso: Solo Docentes (propietario)
 */
router.delete('/:id', 
  authenticateToken, 
  requireDocente,
  eliminarJustificacion
);

// ========================================
// RUTAS PARA ADMINISTRADORES
// ========================================

/**
 * GET /api/justificaciones/pendientes
 * Obtener todas las justificaciones pendientes
 * Acceso: Solo Administradores
 */
router.get('/pendientes', 
  authenticateToken, 
  requireRole(['Administrador']),
  obtenerJustificacionesPendientes
);

/**
 * PATCH /api/justificaciones/:id/estado
 * Aprobar o rechazar una justificación
 * Acceso: Solo Administradores
 */
router.patch('/:id/estado', 
  authenticateToken, 
  requireRole(['Administrador']),
  validateDTO(AprobarJustificacionDTO),
  cambiarEstadoJustificacion
);

export default router;

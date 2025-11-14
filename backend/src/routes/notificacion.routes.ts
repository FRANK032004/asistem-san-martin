/**
 * Rutas de Notificaciones
 * Endpoints para gestión de notificaciones de usuarios
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { sanitizeInput } from '../middleware/validation';
import {
  obtenerMisNotificaciones,
  marcarComoLeida,
  marcarTodasComoLeidas,
  eliminarNotificacion,
  contadorNoLeidas,
  limpiarNotificacionesAntiguas,
  crearNotificacion,
  crearNotificacionMasiva,
} from '../controllers/notificacion.controller';

const router = Router();

/**
 * Rutas para docentes y usuarios
 */

/**
 * GET /api/notificaciones
 * Obtener notificaciones del usuario autenticado
 * Query params opcionales: tipo, leido, importante
 */
router.get(
  '/',
  authenticateToken,
  obtenerMisNotificaciones
);

/**
 * GET /api/notificaciones/contador-no-leidas
 * Obtener contador de notificaciones no leídas
 */
router.get(
  '/contador-no-leidas',
  authenticateToken,
  contadorNoLeidas
);

/**
 * PATCH /api/notificaciones/marcar-todas-leidas
 * Marcar todas las notificaciones como leídas
 */
router.patch(
  '/marcar-todas-leidas',
  authenticateToken,
  marcarTodasComoLeidas
);

/**
 * PATCH /api/notificaciones/:id/marcar-leida
 * Marcar una notificación como leída
 */
router.patch(
  '/:id/marcar-leida',
  authenticateToken,
  marcarComoLeida
);

/**
 * DELETE /api/notificaciones/limpiar-antiguas
 * Eliminar notificaciones antiguas (más de 30 días y leídas)
 */
router.delete(
  '/limpiar-antiguas',
  authenticateToken,
  limpiarNotificacionesAntiguas
);

/**
 * DELETE /api/notificaciones/:id
 * Eliminar una notificación
 */
router.delete(
  '/:id',
  authenticateToken,
  eliminarNotificacion
);

/**
 * Rutas solo para administradores
 */

/**
 * POST /api/notificaciones
 * Crear una notificación (solo admin)
 */
router.post(
  '/',
  authenticateToken,
  sanitizeInput,
  crearNotificacion
);

/**
 * POST /api/notificaciones/masiva
 * Crear notificaciones masivas (solo admin)
 */
router.post(
  '/masiva',
  authenticateToken,
  sanitizeInput,
  crearNotificacionMasiva
);

export default router;

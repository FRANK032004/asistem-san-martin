/**
 * Rutas de Asignaciones
 * Endpoints para asignar áreas y consultar horarios de docentes
 */

import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateDTO } from '../middleware/validate.middleware';
import { AsignarAreaDocenteDTO } from '../modules/admin/dtos/gestion-docentes.dto';
import {
  asignarAreaDocente,
  obtenerHorariosDocente
} from '../controllers/asignacion.controller';

const router = Router();

// ========================================
// RUTAS DE ADMIN - Asignaciones
// ========================================

/**
 * @route   PATCH /api/admin/asignaciones/area
 * @desc    Asignar área a un docente
 * @access  Admin
 */
router.patch(
  '/area',
  authenticateToken,
  requireRole(['Administrador']),
  validateDTO(AsignarAreaDocenteDTO),
  asignarAreaDocente
);

/**
 * @route   GET /api/admin/asignaciones/docente/:docenteId/horarios
 * @desc    Obtener horarios asignados a un docente específico
 * @access  Admin
 */
router.get(
  '/docente/:docenteId/horarios',
  authenticateToken,
  requireRole(['Administrador']),
  obtenerHorariosDocente
);

export default router;

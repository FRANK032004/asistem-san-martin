/**
 * @module AdminDocentesRoutes
 * @description Rutas administrativas para gestión de docentes
 * 
 * Responsabilidades:
 * - CRUD de docentes (solo admin)
 * - Consulta de asistencias de docentes
 * - Estadísticas de docentes
 * 
 * Requiere rol: ADMIN o SUPERVISOR
 */

import express from 'express';
import {
  getDocentes,
  getDocenteById,
  createDocente,
  updateDocente,
  deleteDocente,
  getDocenteAsistencias,
  getEstadisticasDocente,
  getEstadoDocentes
} from '../controllers/gestion-docentes.controller';
import { authenticateToken, requireAdmin, requireAdminOrSupervisor } from '../../../shared/middleware/auth';
import { validateDTO } from '../../../shared/middleware/validate.middleware';
import {
  UpdatePerfilDocenteDTO,
  UpdateEstadoDocenteDTO,
  FiltrarDocentesDTO
} from '../dtos/gestion-docentes.dto';

const router = express.Router();

// ========================================
// RUTAS ADMINISTRATIVAS - GESTIÓN DOCENTES
// ========================================

/**
 * GET /api/admin/docentes
 * Listar todos los docentes con filtros
 * Acceso: Admin, Supervisor
 */
router.get('/', 
  authenticateToken, 
  requireAdminOrSupervisor,
  validateDTO(FiltrarDocentesDTO, 'query'),
  getDocentes
);

/**
 * GET /api/admin/docentes/estado
 * Obtener estado resumido de todos los docentes (para dashboard)
 * Acceso: Admin, Supervisor
 */
router.get('/estado', 
  authenticateToken, 
  requireAdminOrSupervisor,
  getEstadoDocentes
);

/**
 * GET /api/admin/docentes/:id
 * Obtener docente específico por ID
 * Acceso: Admin, Supervisor
 */
router.get('/:id', 
  authenticateToken, 
  requireAdminOrSupervisor,
  getDocenteById
);

/**
 * POST /api/admin/docentes
 * Crear nuevo docente
 * Acceso: Solo Admin
 */
router.post('/', 
  authenticateToken, 
  requireAdmin,
  createDocente
);

/**
 * PUT /api/admin/docentes/:id
 * Actualizar información completa de docente
 * Acceso: Solo Admin
 */
router.put('/:id', 
  authenticateToken, 
  requireAdmin,
  validateDTO(UpdatePerfilDocenteDTO),
  updateDocente
);

/**
 * PATCH /api/admin/docentes/:id/estado
 * Actualizar estado de docente (activo/inactivo)
 * Acceso: Solo Admin
 */
router.patch('/:id/estado', 
  authenticateToken, 
  requireAdmin,
  validateDTO(UpdateEstadoDocenteDTO),
  updateDocente
);

/**
 * DELETE /api/admin/docentes/:id
 * Eliminar (desactivar) docente
 * Acceso: Solo Admin
 */
router.delete('/:id', 
  authenticateToken, 
  requireAdmin,
  deleteDocente
);

/**
 * GET /api/admin/docentes/:id/asistencias
 * Obtener asistencias de un docente específico
 * Acceso: Admin, Supervisor
 * Query params: fecha_inicio, fecha_fin
 */
router.get('/:id/asistencias', 
  authenticateToken,
  requireAdminOrSupervisor,
  getDocenteAsistencias
);

/**
 * GET /api/admin/docentes/:docenteId/estadisticas
 * Obtener estadísticas detalladas de un docente
 * Acceso: Admin, Supervisor
 */
router.get('/:docenteId/estadisticas', 
  authenticateToken,
  requireAdminOrSupervisor,
  getEstadisticasDocente
);

export default router;

/**
 * Rutas de Planillas para Administradores
 * Gestión completa de planillas
 */

import express from 'express';
import adminPlanillaController from '../controllers/admin-planilla.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { body, query } from 'express-validator';

const router = express.Router();

// Todos los endpoints requieren autenticación de admin
router.use(authenticateToken, requireAdmin);

/**
 * GET /api/admin/planillas/estadisticas/general
 * Obtener estadísticas generales
 */
router.get('/estadisticas/general',
  query('anio').optional().isInt({ min: 2020, max: 2100 }),
  query('mes').optional().isInt({ min: 1, max: 12 }),
  adminPlanillaController.obtenerEstadisticasGenerales
);

/**
 * GET /api/admin/planillas/docentes
 * Obtener lista de docentes con planillas
 */
router.get('/docentes',
  adminPlanillaController.obtenerDocentesConPlanillas
);

/**
 * POST /api/admin/planillas/generar-masivo
 * Generar planillas para múltiples docentes
 */
router.post('/generar-masivo',
  body('mes').isInt({ min: 1, max: 12 }).withMessage('Mes debe estar entre 1 y 12'),
  body('anio').isInt({ min: 2020, max: 2100 }).withMessage('Año inválido'),
  body('docenteIds').isArray({ min: 1 }).withMessage('Debe proporcionar al menos un docente'),
  adminPlanillaController.generarPlanillasMasivo
);

/**
 * GET /api/admin/planillas
 * Listar todas las planillas con filtros
 */
router.get('/',
  query('anio').optional().isInt({ min: 2020, max: 2100 }),
  query('mes').optional().isInt({ min: 1, max: 12 }),
  query('estado').optional().isIn(['PENDIENTE', 'EN_PROCESO', 'PAGADO', 'ANULADO', 'TODOS']),
  query('docenteId').optional().isUUID(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  adminPlanillaController.obtenerTodasPlanillas
);

/**
 * POST /api/admin/planillas
 * Generar nueva planilla
 */
router.post('/',
  body('docenteId').isUUID().withMessage('ID de docente inválido'),
  body('mes').isInt({ min: 1, max: 12 }).withMessage('Mes debe estar entre 1 y 12'),
  body('anio').isInt({ min: 2020, max: 2100 }).withMessage('Año inválido'),
  adminPlanillaController.generarPlanilla
);

/**
 * GET /api/admin/planillas/:id
 * Obtener detalle de planilla
 */
router.get('/:id',
  adminPlanillaController.obtenerDetallePlanilla
);

/**
 * PUT /api/admin/planillas/:id/estado
 * Actualizar estado de planilla
 */
router.put('/:id/estado',
  body('estado').isIn(['PENDIENTE', 'EN_PROCESO', 'PAGADO', 'ANULADO']).withMessage('Estado inválido'),
  body('observaciones').optional().isString(),
  adminPlanillaController.actualizarEstado
);

/**
 * PUT /api/admin/planillas/:id
 * Actualizar datos de planilla
 */
router.put('/:id',
  body('montoBase').optional().isFloat({ min: 0 }),
  body('bonificaciones').optional().isFloat({ min: 0 }),
  body('descuentos').optional().isFloat({ min: 0 }),
  body('observaciones').optional().isString(),
  adminPlanillaController.actualizarPlanilla
);

/**
 * DELETE /api/admin/planillas/:id
 * Anular planilla
 */
router.delete('/:id',
  adminPlanillaController.eliminarPlanilla
);

export default router;

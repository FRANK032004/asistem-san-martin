/**
 * Rutas de Planillas para Docentes
 * Endpoints para consultar planillas y boletas de pago
 */

import express from 'express';
import planillaDocenteController from '../controllers/planilla-docente.controller';
import { authenticateToken, requireDocente } from '../middleware/auth';
import { query } from 'express-validator';

const router = express.Router();

// ========================================
// RUTAS PARA DOCENTES
// ========================================

/**
 * GET /api/docente/planillas/estadisticas
 * Obtener estadísticas generales de planillas
 * Acceso: Solo Docentes
 * Nota: Esta ruta DEBE estar antes de /api/docente/planillas/:id
 */
router.get('/estadisticas', 
  authenticateToken, 
  requireDocente,
  planillaDocenteController.obtenerEstadisticas
);

/**
 * GET /api/docente/planillas/anios
 * Obtener años disponibles con planillas
 * Acceso: Solo Docentes
 */
router.get('/anios', 
  authenticateToken, 
  requireDocente,
  planillaDocenteController.obtenerAniosDisponibles
);

/**
 * GET /api/docente/planillas
 * Obtener lista de planillas del docente con filtros opcionales
 * Query params:
 *   - anio?: number (2020-2100)
 *   - mes?: number (1-12)
 *   - estado?: string (PENDIENTE | EN_PROCESO | PAGADO | ANULADO | TODOS)
 * Acceso: Solo Docentes
 */
router.get('/', 
  authenticateToken, 
  requireDocente,
  [
    query('anio').optional().isInt({ min: 2020, max: 2100 }).toInt(),
    query('mes').optional().isInt({ min: 1, max: 12 }).toInt(),
    query('estado').optional().isIn(['PENDIENTE', 'EN_PROCESO', 'PAGADO', 'ANULADO', 'TODOS'])
  ],
  planillaDocenteController.obtenerMisPlanillas
);

/**
 * GET /api/docente/planillas/:id
 * Obtener detalle completo de una planilla específica
 * Params:
 *   - id: string (UUID de la planilla)
 * Acceso: Solo Docentes (propietario)
 */
router.get('/:id', 
  authenticateToken, 
  requireDocente,
  planillaDocenteController.obtenerDetallePlanilla
);

/**
 * GET /api/docente/planillas/:id/pdf
 * Descargar boleta de planilla en PDF
 * Params:
 *   - id: string (UUID de la planilla)
 * Acceso: Solo Docentes (propietario)
 * Estado: En desarrollo
 */
router.get('/:id/pdf', 
  authenticateToken, 
  requireDocente,
  planillaDocenteController.descargarBoletaPDF
);

export default router;

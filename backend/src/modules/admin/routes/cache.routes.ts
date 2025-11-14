/**
 * Cache Routes
 * Rutas para administración y monitoreo del sistema de caché
 */

import { Router } from 'express';
import {
  getCacheStats,
  getCacheHealth,
  flushAllCache,
  flushCacheByPrefix,
  invalidateDocenteCache,
  invalidateInstitucionalCache
} from '../controllers/cache.controller';
import { authenticateToken, requireAdmin } from '../../../shared/middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación y rol de admin
router.use(authenticateToken);
router.use(requireAdmin);

// ========================================
// RUTAS DE MONITOREO (GET)
// ========================================

/**
 * GET /api/admin/cache/stats
 * Obtener estadísticas del caché
 */
router.get('/stats', getCacheStats);

/**
 * GET /api/admin/cache/health
 * Verificar salud del sistema de caché
 */
router.get('/health', getCacheHealth);

// ========================================
// RUTAS DE ADMINISTRACIÓN (POST)
// ========================================

/**
 * POST /api/admin/cache/flush
 * Limpiar todo el caché
 */
router.post('/flush', flushAllCache);

/**
 * POST /api/admin/cache/flush/:prefix
 * Limpiar caché por prefijo
 */
router.post('/flush/:prefix', flushCacheByPrefix);

/**
 * POST /api/admin/cache/invalidate/docente/:docenteId
 * Invalidar caché de un docente específico
 */
router.post('/invalidate/docente/:docenteId', invalidateDocenteCache);

/**
 * POST /api/admin/cache/invalidate/institucional
 * Invalidar caché institucional
 */
router.post('/invalidate/institucional', invalidateInstitucionalCache);

export default router;

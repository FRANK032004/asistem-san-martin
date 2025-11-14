/**
 * Cache Controller
 * Endpoints para administración y monitoreo del sistema de caché
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../../../shared/middleware/error-handler';
import { ResponseFormatter } from '../../../shared/utils/response-formatter';
import { cacheService } from '../../../services/cache.service';

/**
 * GET /api/admin/cache/stats
 * Obtener estadísticas del sistema de caché
 */
export const getCacheStats = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const stats = cacheService.getStats();
  const hitRate = cacheService.getHitRate();

  const response = {
    ...stats,
    hitRate: `${hitRate.toFixed(2)}%`,
    performance: {
      efficiency: hitRate > 70 ? 'Excelente' : hitRate > 50 ? 'Buena' : hitRate > 30 ? 'Regular' : 'Baja',
      recommendation: hitRate < 50 
        ? 'Considera aumentar los TTL o revisar patrones de acceso'
        : 'Rendimiento óptimo'
    },
    timestamp: new Date().toISOString()
  };

  res.status(200).json(
    ResponseFormatter.success(response, 'Estadísticas de caché obtenidas')
  );
});

/**
 * POST /api/admin/cache/flush
 * Limpiar todo el caché del sistema
 */
export const flushAllCache = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  cacheService.flush();

  res.status(200).json(
    ResponseFormatter.success(
      { 
        message: 'Todo el caché ha sido limpiado',
        timestamp: new Date().toISOString()
      },
      'Caché limpiado exitosamente'
    )
  );
});

/**
 * POST /api/admin/cache/flush/:prefix
 * Limpiar caché por prefijo específico
 */
export const flushCacheByPrefix = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { prefix } = req.params;

  if (!prefix) {
    res.status(400).json(
      ResponseFormatter.error('BAD_REQUEST', 'Prefijo requerido')
    );
    return;
  }

  // Validar prefijo
  const validPrefixes = [
    'dashboard',
    'asistencia_hoy',
    'historial',
    'estadisticas_mes',
    'comparativa',
    'ubicaciones',
    'horarios',
    'institucional'
  ];

  if (!validPrefixes.includes(prefix)) {
    res.status(400).json(
      ResponseFormatter.error('INVALID_PREFIX', 'Prefijo de caché inválido', {
        validPrefixes
      })
    );
    return;
  }

  // Flush por prefijo
  const keysDeleted = cacheService.delPattern(prefix as any, '*');

  res.status(200).json(
    ResponseFormatter.success(
      {
        prefix,
        keysDeleted,
        timestamp: new Date().toISOString()
      },
      `Caché del prefijo '${prefix}' limpiado exitosamente`
    )
  );
});

/**
 * POST /api/admin/cache/invalidate/docente/:docenteId
 * Invalidar caché de un docente específico
 */
export const invalidateDocenteCache = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { docenteId } = req.params;

  if (!docenteId) {
    res.status(400).json(
      ResponseFormatter.error('BAD_REQUEST', 'ID de docente requerido')
    );
    return;
  }

  cacheService.invalidateDocente(docenteId);

  res.status(200).json(
    ResponseFormatter.success(
      {
        docenteId,
        invalidated: ['dashboard', 'asistencia_hoy', 'historial', 'estadisticas_mes'],
        timestamp: new Date().toISOString()
      },
      `Caché del docente ${docenteId} invalidado exitosamente`
    )
  );
});

/**
 * POST /api/admin/cache/invalidate/institucional
 * Invalidar caché institucional (comparativas, estadísticas globales)
 */
export const invalidateInstitucionalCache = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  cacheService.invalidateInstitucional();

  res.status(200).json(
    ResponseFormatter.success(
      {
        invalidated: ['comparativa', 'institucional'],
        timestamp: new Date().toISOString()
      },
      'Caché institucional invalidado exitosamente'
    )
  );
});

/**
 * GET /api/admin/cache/health
 * Verificar salud del sistema de caché
 */
export const getCacheHealth = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const stats = cacheService.getStats();
  const hitRate = cacheService.getHitRate();

  const health = {
    status: 'healthy',
    checks: {
      mainCache: {
        status: stats.main.keys > 0 ? 'active' : 'idle',
        keys: stats.main.keys
      },
      statsCache: {
        status: stats.stats.keys > 0 ? 'active' : 'idle',
        keys: stats.stats.keys
      },
      staticCache: {
        status: stats.static.keys > 0 ? 'active' : 'idle',
        keys: stats.static.keys
      },
      performance: {
        status: hitRate > 50 ? 'good' : hitRate > 30 ? 'acceptable' : 'poor',
        hitRate: `${hitRate.toFixed(2)}%`
      }
    },
    timestamp: new Date().toISOString()
  };

  res.status(200).json(
    ResponseFormatter.success(health, 'Estado del caché verificado')
  );
});

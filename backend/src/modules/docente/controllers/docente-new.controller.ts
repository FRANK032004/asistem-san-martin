/**
 * @module DocenteControllerNew
 * @description Nuevos handlers que usan Service Layer
 * Estos handlers complementan el controller existente
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../../../shared/middleware/error-handler';
import { ResponseFormatter } from '../../../shared/utils/response-formatter';
import { ValidationError } from '../../../shared/utils/app-error';
import { asistenciaService } from '../services/asistencia.service';
import { estadisticasService } from '../services/estadisticas.service';
import { cacheService, CachePrefix, CacheTTL } from '../../../services/cache.service';

// ========================================
// HANDLERS DE ASISTENCIAS CON GPS
// ========================================

/**
 * POST /api/docente/asistencia/entrada
 * Registrar entrada con validación GPS
 */
export const registrarEntrada = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const docenteId = req.usuario?.docenteId;

  if (!docenteId) {
    throw new ValidationError('Usuario no es un docente');
  }

  const { latitud, longitud, precision, timestamp } = req.body;

  // Llamar al service
  const resultado = await asistenciaService.registrarEntrada({
    docente_id: docenteId,
    gpsData: {
      latitud,
      longitud,
      precision,
      timestamp
    }
  });

  // 🔥 Invalidar cache del docente después de registrar
  cacheService.invalidateDocente(docenteId);

  res.status(201).json(
    ResponseFormatter.success(resultado, resultado.mensaje)
  );
});

/**
 * POST /api/docente/asistencia/salida
 * Registrar salida con validación GPS
 */
export const registrarSalida = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const docenteId = req.usuario?.docenteId;

  if (!docenteId) {
    throw new ValidationError('Usuario no es un docente');
  }

  const { latitud, longitud, precision, timestamp } = req.body;

  // Llamar al service
  const resultado = await asistenciaService.registrarSalida({
    docente_id: docenteId,
    gpsData: {
      latitud,
      longitud,
      precision,
      timestamp
    }
  });

  // 🔥 Invalidar cache del docente después de registrar
  cacheService.invalidateDocente(docenteId);

  res.status(200).json(
    ResponseFormatter.success(resultado, resultado.mensaje)
  );
});

/**
 * GET /api/docente/asistencia/hoy
 * Obtener asistencia de hoy + CACHE
 */
export const obtenerAsistenciaHoy = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const docenteId = req.usuario?.docenteId;

  if (!docenteId) {
    throw new ValidationError('Usuario no es un docente');
  }

  // 🔥 Cache de 3 minutos (se actualiza frecuentemente)
  const asistencia = await cacheService.getOrSet(
    CachePrefix.ASISTENCIA_HOY,
    docenteId,
    () => asistenciaService.obtenerAsistenciaHoyCompleta(docenteId),
    180 // 3 minutos
  );

  res.status(200).json(
    ResponseFormatter.success({
      asistencia,
      mensaje: asistencia 
        ? 'Asistencia encontrada' 
        : 'No has registrado asistencia hoy'
    })
  );
});

/**
 * GET /api/docente/asistencia/historial
 * Obtener historial de asistencias con paginación + CACHE
 */
export const obtenerHistorialAsistencias = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const docenteId = req.usuario?.docenteId;

  if (!docenteId) {
    throw new ValidationError('Usuario no es un docente');
  }

  const { limit = 50, offset = 0, fecha_inicio, fecha_fin } = req.query;

  const opciones: any = {
    limit: Number(limit),
    offset: Number(offset)
  };

  if (fecha_inicio) {
    opciones.fecha_inicio = new Date(fecha_inicio as string);
  }

  if (fecha_fin) {
    opciones.fecha_fin = new Date(fecha_fin as string);
  }

  // 🔥 Cache key incluye paginación
  const cacheKey = `${docenteId}_${limit}_${offset}`;

  const resultado = await cacheService.getOrSet(
    CachePrefix.HISTORIAL,
    cacheKey,
    () => estadisticasService.obtenerHistorico(docenteId, opciones),
    300 // 5 minutos
  );

  res.status(200).json(
    ResponseFormatter.success(resultado, 'Historial obtenido correctamente')
  );
});

// ========================================
// HANDLERS DE ESTADÍSTICAS
// ========================================

/**
 * GET /api/docente/mi-dashboard
 * Dashboard optimizado con aggregations + CACHE
 */
export const getMiDashboardOptimizado = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const docenteId = req.usuario?.docenteId;

  if (!docenteId) {
    throw new ValidationError('Usuario no es un docente');
  }

  // 🔥 Usar cache con getOrSet pattern
  const dashboard = await cacheService.getOrSet(
    CachePrefix.DASHBOARD,
    docenteId,
    () => estadisticasService.obtenerDashboard(docenteId),
    CacheTTL.DASHBOARD // 5 minutos
  );

  res.status(200).json(
    ResponseFormatter.success(dashboard, 'Dashboard cargado correctamente')
  );
});

/**
 * GET /api/docente/estadisticas/mes
 * Estadísticas mensuales detalladas + CACHE
 */
export const obtenerEstadisticasMes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const docenteId = req.usuario?.docenteId;

  if (!docenteId) {
    throw new ValidationError('Usuario no es un docente');
  }

  const { mes, anio } = req.query;
  const mesNum = mes ? Number(mes) : new Date().getMonth() + 1;
  const anioNum = anio ? Number(anio) : new Date().getFullYear();

  // 🔥 Sin cache temporalmente para debugging
  const estadisticas = await estadisticasService.obtenerEstadisticasMes(docenteId, mesNum, anioNum);

  res.status(200).json(
    ResponseFormatter.success(estadisticas, 'Estadísticas obtenidas correctamente')
  );
});

/**
 * GET /api/docente/estadisticas/comparativa
 * Comparativa con promedio institucional + CACHE
 */
export const obtenerComparativa = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const docenteId = req.usuario?.docenteId;

  if (!docenteId) {
    throw new ValidationError('Usuario no es un docente');
  }

  // 🔥 Sin cache temporalmente para debugging
  const comparativa = await estadisticasService.obtenerComparativa(docenteId);

  res.status(200).json(
    ResponseFormatter.success(comparativa, 'Comparativa obtenida correctamente')
  );
});

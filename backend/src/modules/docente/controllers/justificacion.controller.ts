/**
 * 🎯 CONTROLLER: JUSTIFICACIONES DOCENTE
 * 
 * Endpoints para auto-gestión de justificaciones por el docente
 * 
 * Rutas:
 * - POST   /api/docente/justificaciones              - Crear justificación
 * - GET    /api/docente/justificaciones              - Listar mis justificaciones
 * - GET    /api/docente/justificaciones/:id          - Obtener una justificación
 * - PUT    /api/docente/justificaciones/:id          - Actualizar justificación (solo PENDIENTE)
 * - DELETE /api/docente/justificaciones/:id          - Eliminar justificación (solo PENDIENTE)
 * - GET    /api/docente/justificaciones/estadisticas - Estadísticas de justificaciones
 * 
 * @module DocenteJustificacionController
 */

import { Response } from 'express';
import { asyncHandler } from '../../../shared/middleware/error-handler';
import { ResponseFormatter } from '../../../shared/utils/response-formatter';
import justificacionService from '../services/justificacion.service';
import { AuthRequest } from '../../../shared/types/auth.types';
import { 
  CrearJustificacionDTO, 
  ActualizarJustificacionDTO, 
  FiltrosJustificacionDTO 
} from '../dtos/justificacion.dto';

/**
 * POST /api/docente/justificaciones
 * Crear una nueva justificación
 * 
 * Body: CrearJustificacionDTO
 * Returns: Justificación creada
 */
export const crearJustificacion = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const docenteId = req.usuario?.docenteId;
    const dto = req.body as CrearJustificacionDTO;

    if (!docenteId) {
      return res.status(403).json(
        ResponseFormatter.error('FORBIDDEN', 'Usuario no identificado como docente')
      );
    }

    // Construir input solo con propiedades definidas
    const input: any = {
      fechaInicio: dto.fechaInicio,
      fechaFin: dto.fechaFin,
      tipo: dto.tipo,
      motivo: dto.motivo,
      afectaPago: dto.afectaPago ?? false
    };
    
    // Solo agregar opcionales si están presentes
    if (dto.asistenciaId) {
      input.asistenciaId = dto.asistenciaId;
    }
    if (dto.evidenciaUrl) {
      input.evidenciaUrl = dto.evidenciaUrl;
    }

    const justificacion = await justificacionService.crearJustificacion(docenteId, input);

    return res.status(201).json(
      ResponseFormatter.success(
        justificacion,
        'Justificación creada exitosamente. Será revisada por un administrador.'
      )
    );
  }
);

/**
 * GET /api/docente/justificaciones
 * Listar mis justificaciones con filtros opcionales
 * 
 * Query params: FiltrosJustificacionDTO
 * Returns: Lista paginada de justificaciones
 */
export const listarMisJustificaciones = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const docenteId = req.usuario?.docenteId;

    if (!docenteId) {
      return res.status(403).json(
        ResponseFormatter.error('FORBIDDEN', 'Usuario no identificado como docente')
      );
    }

    const filtros: FiltrosJustificacionDTO = {
      estado: req.query.estado as any,
      tipo: req.query.tipo as any,
      fechaDesde: req.query.fechaDesde as string,
      fechaHasta: req.query.fechaHasta as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50
    };

    const resultado = await justificacionService.obtenerMisJustificaciones(docenteId, filtros);

    return res.json(
      ResponseFormatter.success(
        resultado,
        'Justificaciones obtenidas exitosamente'
      )
    );
  }
);

/**
 * GET /api/docente/justificaciones/:id
 * Obtener detalle de una justificación
 * 
 * Params: id (UUID)
 * Returns: Justificación completa
 */
export const obtenerJustificacion = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const docenteId = req.usuario?.docenteId;
    const { id } = req.params;

    if (!docenteId) {
      return res.status(403).json(
        ResponseFormatter.error('FORBIDDEN', 'Usuario no identificado como docente')
      );
    }

    if (!id) {
      return res.status(400).json(
        ResponseFormatter.error('BAD_REQUEST', 'ID de justificación requerido')
      );
    }

    const justificacion = await justificacionService.obtenerJustificacionPorId(id, docenteId);

    return res.json(
      ResponseFormatter.success(
        justificacion,
        'Justificación obtenida exitosamente'
      )
    );
  }
);

/**
 * PUT /api/docente/justificaciones/:id
 * Actualizar una justificación (solo si está PENDIENTE)
 * 
 * Params: id (UUID)
 * Body: ActualizarJustificacionDTO
 * Returns: Justificación actualizada
 */
export const actualizarJustificacion = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const docenteId = req.usuario?.docenteId;
    const { id } = req.params;
    const dto = req.body as ActualizarJustificacionDTO;

    if (!docenteId) {
      return res.status(403).json(
        ResponseFormatter.error('FORBIDDEN', 'Usuario no identificado como docente')
      );
    }

    if (!id) {
      return res.status(400).json(
        ResponseFormatter.error('BAD_REQUEST', 'ID de justificación requerido')
      );
    }

    // Construir input solo con propiedades definidas
    const input: any = {};
    if (dto.tipo) input.tipo = dto.tipo;
    if (dto.motivo) input.motivo = dto.motivo;
    if (dto.evidenciaUrl) input.evidenciaUrl = dto.evidenciaUrl;

    const justificacion = await justificacionService.actualizarJustificacion(id, docenteId, input);

    return res.json(
      ResponseFormatter.success(
        justificacion,
        'Justificación actualizada exitosamente'
      )
    );
  }
);

/**
 * DELETE /api/docente/justificaciones/:id
 * Eliminar una justificación (solo si está PENDIENTE)
 * 
 * Params: id (UUID)
 * Returns: Confirmación de eliminación
 */
export const eliminarJustificacion = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const docenteId = req.usuario?.docenteId;
    const { id } = req.params;

    if (!docenteId) {
      return res.status(403).json(
        ResponseFormatter.error('FORBIDDEN', 'Usuario no identificado como docente')
      );
    }

    if (!id) {
      return res.status(400).json(
        ResponseFormatter.error('BAD_REQUEST', 'ID de justificación requerido')
      );
    }

    const resultado = await justificacionService.eliminarJustificacion(id, docenteId);

    return res.json(
      ResponseFormatter.success(
        resultado,
        'Justificación eliminada exitosamente'
      )
    );
  }
);

/**
 * GET /api/docente/justificaciones/estadisticas
 * Obtener estadísticas de mis justificaciones
 * 
 * Returns: Resumen (total, pendientes, aprobadas, rechazadas, tasa)
 */
export const obtenerEstadisticas = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const docenteId = req.usuario?.docenteId;

    if (!docenteId) {
      return res.status(403).json(
        ResponseFormatter.error('FORBIDDEN', 'Usuario no identificado como docente')
      );
    }

    const estadisticas = await justificacionService.obtenerEstadisticas(docenteId);

    return res.json(
      ResponseFormatter.success(
        estadisticas,
        'Estadísticas obtenidas exitosamente'
      )
    );
  }
);

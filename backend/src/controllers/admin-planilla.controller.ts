/**
 * Controlador de Planillas para Administradores
 * Gestión completa de planillas de todos los docentes
 */

import { Request, Response, NextFunction } from 'express';
import { AdminPlanillaService } from '../services/admin-planilla.service';
import { ValidationError } from '../utils/app-error';
import { validationResult } from 'express-validator';

type AuthRequest = Request & {
  usuario?: {
    id: string;
    email: string;
    roles: string;
  };
};

const adminPlanillaService = new AdminPlanillaService();

export class AdminPlanillaController {
  /**
   * GET /api/admin/planillas
   * Obtener todas las planillas con filtros
   */
  async obtenerTodasPlanillas(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Parámetros de filtro inválidos', errors.array());
      }

      const filters: any = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      if (req.query.anio) filters.anio = parseInt(req.query.anio as string);
      if (req.query.mes) filters.mes = parseInt(req.query.mes as string);
      if (req.query.estado) filters.estado = req.query.estado as string;
      if (req.query.docenteId) filters.docenteId = req.query.docenteId as string;

      const result = await adminPlanillaService.obtenerTodasPlanillas(filters);

      res.status(200).json({
        success: true,
        message: 'Planillas obtenidas exitosamente',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/planillas/:id
   * Obtener detalle de planilla por ID
   */
  async obtenerDetallePlanilla(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('ID de planilla requerido');
      }

      const planilla = await adminPlanillaService.obtenerDetallePlanilla(id);

      res.status(200).json({
        success: true,
        message: 'Detalle de planilla obtenido',
        data: planilla
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/planillas
   * Generar planilla para un docente en un período
   */
  async generarPlanilla(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Datos de planilla inválidos', errors.array());
      }

      const { docenteId, mes, anio } = req.body;
      const adminId = req.usuario?.id;

      if (!adminId) {
        throw new ValidationError('Usuario no autenticado');
      }

      const planilla = await adminPlanillaService.generarPlanilla({
        docenteId,
        mes,
        anio,
        createdBy: adminId
      });

      res.status(201).json({
        success: true,
        message: 'Planilla generada exitosamente',
        data: planilla
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/admin/planillas/:id/estado
   * Actualizar estado de planilla
   */
  async actualizarEstado(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Datos inválidos', errors.array());
      }

      const { id } = req.params;
      const { estado, observaciones } = req.body;
      const adminId = req.usuario?.id;

      if (!adminId || !id) {
        throw new ValidationError('Usuario no autenticado o ID inválido');
      }

      const planilla = await adminPlanillaService.actualizarEstado(
        id,
        estado,
        adminId,
        observaciones
      );

      res.status(200).json({
        success: true,
        message: `Planilla marcada como ${estado}`,
        data: planilla
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/admin/planillas/:id
   * Actualizar datos de planilla
   */
  async actualizarPlanilla(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Datos inválidos', errors.array());
      }

      const { id } = req.params;
      const adminId = req.usuario?.id;

      if (!adminId || !id) {
        throw new ValidationError('Usuario no autenticado o ID inválido');
      }

      const planilla = await adminPlanillaService.actualizarPlanilla(id, req.body, adminId);

      res.status(200).json({
        success: true,
        message: 'Planilla actualizada exitosamente',
        data: planilla
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/planillas/:id
   * Eliminar/anular planilla
   */
  async eliminarPlanilla(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.usuario?.id;

      if (!adminId || !id) {
        throw new ValidationError('Usuario no autenticado o ID inválido');
      }

      await adminPlanillaService.eliminarPlanilla(id, adminId);

      res.status(200).json({
        success: true,
        message: 'Planilla anulada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/planillas/estadisticas/general
   * Obtener estadísticas generales de planillas
   */
  async obtenerEstadisticasGenerales(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { anio, mes } = req.query;

      const filtros: any = {};
      if (anio) filtros.anio = parseInt(anio as string);
      if (mes) filtros.mes = parseInt(mes as string);

      const estadisticas = await adminPlanillaService.obtenerEstadisticasGenerales(filtros);

      res.status(200).json({
        success: true,
        message: 'Estadísticas obtenidas',
        data: estadisticas
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/planillas/docentes
   * Obtener lista de docentes con planillas
   */
  async obtenerDocentesConPlanillas(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const docentes = await adminPlanillaService.obtenerDocentesConPlanillas();

      res.status(200).json({
        success: true,
        message: 'Docentes obtenidos',
        data: docentes
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/planillas/generar-masivo
   * Generar planillas para múltiples docentes
   */
  async generarPlanillasMasivo(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Datos inválidos', errors.array());
      }

      const { mes, anio, docenteIds } = req.body;
      const adminId = req.usuario?.id;

      if (!adminId) {
        throw new ValidationError('Usuario no autenticado');
      }

      const resultado = await adminPlanillaService.generarPlanillasMasivo({
        mes,
        anio,
        docenteIds,
        createdBy: adminId
      });

      res.status(201).json({
        success: true,
        message: 'Planillas generadas',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminPlanillaController();

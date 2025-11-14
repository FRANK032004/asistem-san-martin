import { Request, Response, NextFunction } from 'express';
import planillaDocenteService from '../services/planilla-docente.service';
import { ValidationError, AuthenticationError, AuthorizationError } from '../utils/app-error';
import { validationResult } from 'express-validator';

type AuthRequest = Request & {
  user?: {
    id: string;
    email: string;
    rol: string;
  };
};

export class PlanillaDocenteController {
  /**
   * GET /api/docente/planillas
   * Obtener lista de planillas del docente con filtros
   */
  async obtenerMisPlanillas(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validar errores de entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Datos de filtro inválidos');
      }

      const docenteId = req.user?.id;
      if (!docenteId) {
        throw new AuthenticationError('Usuario no autenticado');
      }

      // Verificar que el usuario es docente
      if (req.user?.rol !== 'DOCENTE') {
        throw new AuthorizationError('Acceso denegado. Solo docentes pueden acceder');
      }

      const filters = {
        anio: req.query.anio ? parseInt(req.query.anio as string) : undefined,
        mes: req.query.mes ? parseInt(req.query.mes as string) : undefined,
        estado: req.query.estado as string | undefined
      };

      const planillas = await planillaDocenteService.obtenerMisPlanillas(docenteId, filters as any);

      res.json({
        success: true,
        message: 'Planillas obtenidas correctamente',
        data: planillas,
        total: planillas.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/docente/planillas/:id
   * Obtener detalle completo de una planilla específica
   */
  async obtenerDetallePlanilla(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const docenteId = req.user?.id;
      if (!docenteId) {
        throw new AuthenticationError('Usuario no autenticado');
      }

      if (req.user?.rol !== 'DOCENTE') {
        throw new AuthorizationError('Acceso denegado. Solo docentes pueden acceder');
      }

      const { id } = req.params;
      if (!id) {
        throw new ValidationError('ID de planilla requerido');
      }

      // Verificar acceso antes de obtener detalle
      const tieneAcceso = await planillaDocenteService.verificarAcceso(id, docenteId);
      if (!tieneAcceso) {
        throw new AuthorizationError('No tienes acceso a esta planilla');
      }

      const detalle = await planillaDocenteService.obtenerDetallePlanilla(id, docenteId);

      res.json({
        success: true,
        message: 'Detalle de planilla obtenido correctamente',
        data: detalle
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/docente/planillas/estadisticas
   * Obtener estadísticas generales de planillas
   */
  async obtenerEstadisticas(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const docenteId = req.user?.id;
      if (!docenteId) {
        throw new AuthenticationError('Usuario no autenticado');
      }

      if (req.user?.rol !== 'DOCENTE') {
        throw new AuthorizationError('Acceso denegado. Solo docentes pueden acceder');
      }

      const estadisticas = await planillaDocenteService.obtenerEstadisticas(docenteId);

      res.json({
        success: true,
        message: 'Estadísticas obtenidas correctamente',
        data: estadisticas
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/docente/planillas/anios
   * Obtener lista de años disponibles con planillas
   */
  async obtenerAniosDisponibles(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const docenteId = req.user?.id;
      if (!docenteId) {
        throw new AuthenticationError('Usuario no autenticado');
      }

      if (req.user?.rol !== 'DOCENTE') {
        throw new AuthorizationError('Acceso denegado. Solo docentes pueden acceder');
      }

      const anios = await planillaDocenteService.obtenerAniosDisponibles(docenteId);

      res.json({
        success: true,
        message: 'Años disponibles obtenidos correctamente',
        data: anios
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/docente/planillas/:id/pdf
   * Generar y descargar boleta PDF (placeholder para implementación futura)
   */
  async descargarBoletaPDF(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const docenteId = req.user?.id;
      if (!docenteId) {
        throw new AuthenticationError('Usuario no autenticado');
      }

      if (req.user?.rol !== 'DOCENTE') {
        throw new AuthorizationError('Acceso denegado. Solo docentes pueden acceder');
      }

      const { id } = req.params;
      if (!id) {
        throw new ValidationError('ID de planilla requerido');
      }

      // Verificar acceso
      const tieneAcceso = await planillaDocenteService.verificarAcceso(id, docenteId);
      if (!tieneAcceso) {
        throw new AuthorizationError('No tienes acceso a esta planilla');
      }

      // TODO: Implementar generación de PDF con librería como pdfkit o puppeteer
      // Por ahora retornamos un mensaje indicando que la funcionalidad está pendiente
      
      res.json({
        success: false,
        message: 'Generación de PDF en desarrollo. Próximamente disponible.',
        data: {
          planillaId: id,
          funcionalidad: 'PDF',
          estado: 'PENDIENTE_IMPLEMENTACION'
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PlanillaDocenteController();


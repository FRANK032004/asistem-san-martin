/**
 * Controlador de Notificaciones
 * Endpoints para gestión de notificaciones
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import notificacionService from '../services/notificacion.service';
import { TipoNotificacion } from '../dtos/notificacion.dto';

/**
 * Obtener notificaciones del usuario autenticado
 * GET /api/notificaciones
 */
export const obtenerMisNotificaciones = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuario_id = req.usuario?.id;

    if (!usuario_id) {
      res.status(401).json({
        ok: false,
        mensaje: 'Usuario no autenticado',
      });
      return;
    }

    const { tipo, leido, importante } = req.query;

    const filtros: any = {};

    if (tipo) {
      filtros.tipo = tipo as TipoNotificacion;
    }

    if (leido !== undefined) {
      filtros.leido = leido === 'true';
    }

    if (importante !== undefined) {
      filtros.importante = importante === 'true';
    }

    const notificaciones = await notificacionService.obtenerNotificaciones(
      usuario_id,
      filtros
    );

    res.status(200).json({
      ok: true,
      data: notificaciones,
      total: notificaciones.length,
    });
  } catch (error: any) {
    console.error('❌ Error al obtener notificaciones:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener notificaciones',
      error: error.message,
    });
  }
};

/**
 * Marcar notificación como leída
 * PATCH /api/notificaciones/:id/marcar-leida
 */
export const marcarComoLeida = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuario_id = req.usuario?.id;

    if (!usuario_id) {
      res.status(401).json({
        ok: false,
        mensaje: 'Usuario no autenticado',
      });
      return;
    }

    const { id } = req.params;
    // TypeScript necesita confirmación explícita después del null check
    // @ts-expect-error - usuario_id is guaranteed to be string after null check above
    const notificacion = await notificacionService.marcarComoLeida(id, usuario_id);

    res.status(200).json({
      ok: true,
      data: notificacion,
      mensaje: 'Notificación marcada como leída',
    });
  } catch (error: any) {
    console.error('❌ Error al marcar notificación:', error);
    
    if (error.message === 'Notificación no encontrada') {
      res.status(404).json({
        ok: false,
        mensaje: error.message,
      });
      return;
    }

    res.status(500).json({
      ok: false,
      mensaje: 'Error al marcar notificación',
      error: error.message,
    });
  }
};

/**
 * Marcar todas las notificaciones como leídas
 * PATCH /api/notificaciones/marcar-todas-leidas
 */
export const marcarTodasComoLeidas = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuario_id = req.usuario?.id;

    if (!usuario_id) {
      res.status(401).json({
        ok: false,
        mensaje: 'Usuario no autenticado',
      });
      return;
    }

    const resultado = await notificacionService.marcarTodasComoLeidas(usuario_id as string);

    res.status(200).json({
      ok: true,
      data: resultado,
    });
  } catch (error: any) {
    console.error('❌ Error al marcar todas las notificaciones:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al marcar notificaciones',
      error: error.message,
    });
  }
};

/**
 * Eliminar notificación
 * DELETE /api/notificaciones/:id
 */
export const eliminarNotificacion = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuario_id = req.usuario?.id;

    if (!usuario_id) {
      res.status(401).json({
        ok: false,
        mensaje: 'Usuario no autenticado',
      });
      return;
    }

    const { id } = req.params;
    // TypeScript necesita confirmación explícita después del null check
    // @ts-expect-error - usuario_id is guaranteed to be string after null check above
    const resultado = await notificacionService.eliminarNotificacion(id, usuario_id);

    res.status(200).json({
      ok: true,
      data: resultado,
    });
  } catch (error: any) {
    console.error('❌ Error al eliminar notificación:', error);
    
    if (error.message === 'Notificación no encontrada') {
      res.status(404).json({
        ok: false,
        mensaje: error.message,
      });
      return;
    }

    res.status(500).json({
      ok: false,
      mensaje: 'Error al eliminar notificación',
      error: error.message,
    });
  }
};

/**
 * Obtener contador de notificaciones no leídas
 * GET /api/notificaciones/contador-no-leidas
 */
export const contadorNoLeidas = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuario_id = req.usuario?.id;

    if (!usuario_id) {
      res.status(401).json({
        ok: false,
        mensaje: 'Usuario no autenticado',
      });
      return;
    }

    const resultado = await notificacionService.contarNoLeidas(usuario_id as string);

    res.status(200).json({
      ok: true,
      data: resultado,
    });
  } catch (error: any) {
    console.error('❌ Error al contar notificaciones:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al contar notificaciones',
      error: error.message,
    });
  }
};

/**
 * Limpiar notificaciones antiguas (más de 30 días y leídas)
 * DELETE /api/notificaciones/limpiar-antiguas
 */
export const limpiarNotificacionesAntiguas = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuario_id = req.usuario?.id;

    if (!usuario_id) {
      res.status(401).json({
        ok: false,
        mensaje: 'Usuario no autenticado',
      });
      return;
    }

    const resultado = await notificacionService.limpiarNotificacionesAntiguas(usuario_id as string);

    res.status(200).json({
      ok: true,
      data: resultado,
    });
  } catch (error: any) {
    console.error('❌ Error al limpiar notificaciones:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al limpiar notificaciones',
      error: error.message,
    });
  }
};

/**
 * Crear notificación (solo admin)
 * POST /api/notificaciones
 */
export const crearNotificacion = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Errores de validación',
        errors: errors.array(),
      });
    }

    const { usuario_id, tipo, titulo, mensaje, datos, importante } = req.body;

    const notificacion = await notificacionService.crearNotificacion({
      usuario_id,
      tipo,
      titulo,
      mensaje,
      datos,
      importante,
    });

    return res.status(201).json({
      ok: true,
      data: notificacion,
      mensaje: 'Notificación creada exitosamente',
    });
  } catch (error: any) {
    console.error('❌ Error al crear notificación:', error);
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al crear notificación',
      error: error.message,
    });
  }
};

/**
 * Crear notificación masiva (solo admin)
 * POST /api/notificaciones/masiva
 */
export const crearNotificacionMasiva = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Errores de validación',
        errors: errors.array(),
      });
    }

    const { usuarios_ids, tipo, titulo, mensaje, datos, importante } = req.body;

    const resultado = await notificacionService.crearNotificacionMasiva(
      usuarios_ids,
      tipo,
      titulo,
      mensaje,
      datos,
      importante
    );

    return res.status(201).json({
      ok: true,
      data: resultado,
    });
  } catch (error: any) {
    console.error('❌ Error al crear notificaciones masivas:', error);
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al crear notificaciones masivas',
      error: error.message,
    });
  }
};

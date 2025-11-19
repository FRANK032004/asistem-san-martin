/**
 * Controlador de Justificaciones
 * Maneja las justificaciones de ausencias/tardanzas
 */

import { Request, Response } from 'express';
import prisma from '../utils/database';
import { asyncHandler } from '../middleware/error-handler';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/app-error';
import { ResponseFormatter } from '../utils/response-formatter';
import { CreateJustificacionDTO, AprobarJustificacionDTO } from '../dtos/asistencia.dto';

type AuthRequest = Request & {
  usuario?: {
    id: string;
    email: string;
    rol: string;
    rol_id: number;
    isDocente: boolean;
    docenteId?: string;
  };
  id?: string;
}

/**
 * Crear una justificación para una asistencia
 * POST /api/justificaciones
 */
export const crearJustificacion = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const dto = req.body as CreateJustificacionDTO;
    const usuario_id = req.usuario?.id;
    const docenteId = req.usuario?.docenteId;

    if (!usuario_id || !docenteId) {
      throw new ValidationError('Usuario no es un docente');
    }

    // Verificar que la asistencia existe
    const asistencia = await prisma.asistencias.findUnique({
      where: { id: dto.asistencia_id }
    });

    if (!asistencia) {
      throw new NotFoundError('Asistencia no encontrada');
    }

    // Verificar que el docente es dueño de la asistencia
    if (asistencia.docenteId !== docenteId) {
      throw new AuthorizationError('No tienes permiso para justificar esta asistencia');
    }

    // Verificar que no tiene justificación previa
    const justificacionExistente = await prisma.justificaciones.findFirst({
      where: { asistencia_id: dto.asistencia_id }
    });

    if (justificacionExistente) {
      throw new ValidationError('Esta asistencia ya tiene una justificación');
    }

    // Crear justificación
    const justificacion = await prisma.justificaciones.create({
      data: {
        docente_id: docenteId,
        asistencia_id: dto.asistencia_id,
        motivo: dto.motivo,
        tipo: dto.tipo || 'Otros',
        documento_adjunto: dto.documento || null,
        estado: 'pendiente',
        fecha_inicio: asistencia.fecha,
        fecha_fin: asistencia.fecha,
        afecta_pago: false
      },
      include: {
        asistencias: {
          select: {
            id: true,
            fecha: true,
            horaEntrada: true,
            horaSalida: true,
            estado: true
          }
        },
        docentes: {
          select: {
            id: true,
            codigo_docente: true,
            usuarios: {
              select: {
                nombres: true,
                apellidos: true,
                email: true
              }
            }
          }
        }
      }
    });

    res.status(201).json(
      ResponseFormatter.success(
        justificacion, 
        'Justificación creada exitosamente'
      )
    );
  }
);

/**
 * Obtener justificaciones del docente logueado
 * GET /api/justificaciones/mis-justificaciones
 */
export const obtenerMisJustificaciones = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const docenteId = req.usuario?.docenteId;

    if (!docenteId) {
      throw new ValidationError('Usuario no es un docente');
    }

    const justificaciones = await prisma.justificaciones.findMany({
      where: {
        docente_id: docenteId
      },
      include: {
        asistencias: {
          select: {
            id: true,
            fecha: true,
            horaEntrada: true,
            horaSalida: true,
            estado: true
          }
        },
        usuarios: {
          select: {
            nombres: true,
            apellidos: true,
            email: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json(
      ResponseFormatter.success(
        justificaciones, 
        'Justificaciones obtenidas exitosamente'
      )
    );
  }
);

/**
 * Obtener todas las justificaciones pendientes (Admin)
 * GET /api/justificaciones/pendientes
 */
export const obtenerJustificacionesPendientes = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    const justificaciones = await prisma.justificaciones.findMany({
      where: {
        estado: 'pendiente'
      },
      include: {
        docentes: {
          include: {
            usuarios: {
              select: {
                nombres: true,
                apellidos: true,
                email: true,
                telefono: true
              }
            },
            areas: {
              select: {
                nombre: true
              }
            }
          }
        },
        asistencias: {
          select: {
            id: true,
            fecha: true,
            horaEntrada: true,
            horaSalida: true,
            estado: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json(
      ResponseFormatter.success(
        justificaciones, 
        'Justificaciones pendientes obtenidas exitosamente'
      )
    );
  }
);

/**
 * Aprobar o rechazar justificación (Admin)
 * PATCH /api/justificaciones/:id/estado
 */
export const cambiarEstadoJustificacion = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const dto = req.body as AprobarJustificacionDTO;
    const usuario_id = req.usuario?.id;

    if (!usuario_id) {
      throw new ValidationError('Usuario no autenticado');
    }

    // Verificar que la justificación existe
    const justificacion = await prisma.justificaciones.findUnique({
      where: { id },
      include: {
        asistencias: true
      }
    });

    if (!justificacion) {
      throw new NotFoundError('Justificación no encontrada');
    }

    if (justificacion.estado !== 'pendiente') {
      throw new ValidationError('Esta justificación ya fue procesada');
    }

    const nuevoEstado = dto.estado === 'APROBADO' ? 'aprobada' : 'rechazada';

    // Actualizar justificación
    const justificacionActualizada = await prisma.justificaciones.update({
      where: { id },
      data: {
        estado: nuevoEstado,
        observaciones_admin: dto.comentario || null,
        aprobado_por: usuario_id,
        fecha_aprobacion: new Date()
      },
      include: {
        asistencias: {
          select: {
            id: true,
            fecha: true,
            estado: true
          }
        },
        docentes: {
          include: {
            usuarios: {
              select: {
                nombres: true,
                apellidos: true,
                email: true
              }
            }
          }
        },
        usuarios: {
          select: {
            nombres: true,
            apellidos: true
          }
        }
      }
    });

    // Si fue aprobada, actualizar estado de la asistencia
    if (dto.estado === 'APROBADO' && justificacion.asistencia_id) {
      await prisma.asistencias.update({
        where: { id: justificacion.asistencia_id },
        data: {
          estado: 'JUSTIFICADO'
        }
      });
    }

    res.json(
      ResponseFormatter.success(
        justificacionActualizada, 
        `Justificación ${nuevoEstado} exitosamente`
      )
    );
  }
);

/**
 * Eliminar justificación (antes de ser revisada)
 * DELETE /api/justificaciones/:id
 */
export const eliminarJustificacion = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const usuario_id = req.usuario?.id;
    const docenteId = req.usuario?.docenteId;

    if (!usuario_id || !docenteId) {
      throw new ValidationError('Usuario no es un docente');
    }

    const justificacion = await prisma.justificaciones.findUnique({
      where: { id }
    });

    if (!justificacion) {
      throw new NotFoundError('Justificación no encontrada');
    }

    // Verificar que el docente es dueño
    if (justificacion.docente_id !== docenteId) {
      throw new AuthorizationError('No tienes permiso para eliminar esta justificación');
    }

    // Solo se puede eliminar si está pendiente
    if (justificacion.estado !== 'pendiente') {
      throw new ValidationError('No puedes eliminar una justificación ya procesada');
    }

    await prisma.justificaciones.delete({
      where: { id }
    });

    res.json(
      ResponseFormatter.success(
        null, 
        'Justificación eliminada exitosamente'
      )
    );
  }
);



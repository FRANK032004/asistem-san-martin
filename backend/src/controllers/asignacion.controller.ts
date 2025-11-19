/**
 * Controlador de Asignaciones
 * Maneja asignaciones de horarios y �reas a docentes
 * NOTA: HorarioBase ya tiene docenteId, no se necesita tabla intermedia
 */

import { Request, Response } from 'express';
import prisma from '../utils/database';
import { asyncHandler } from '../middleware/error-handler';
import { NotFoundError } from '../utils/app-error';
import { ResponseFormatter } from '../utils/response-formatter';
import { AsignarAreaDocenteDTO } from '../modules/admin/dtos/gestion-docentes.dto';

type AuthRequest = Request & { 
  user?: { 
    id: string; 
    email: string; 
    rol: string; 
    rol_id: number; 
    isDocente: boolean; 
    docenteId?: string; 
  }; 
  usuario?: { 
    id: string; 
    email: string; 
    rol: string; 
    rol_id: number; 
    isDocente: boolean; 
    docenteId?: string; 
  }; 
};

/**
 * Asignar �rea a un docente
 * PATCH /api/admin/asignaciones/area
 */
export const asignarAreaDocente = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const dto = req.body as AsignarAreaDocenteDTO;

    // Verificar que el docente existe
    const docente = await prisma.docentes.findUnique({
      where: { id: dto.docenteId }
    });

    if (!docente) {
      throw new NotFoundError('Docente no encontrado');
    }

    // Verificar que el �rea existe
    const area = await prisma.areas.findUnique({
      where: { id: dto.area_id }
    });

    if (!area) {
      throw new NotFoundError('�rea no encontrada');
    }

    // Actualizar docente
    const docenteActualizado = await prisma.docentes.update({
      where: { id: dto.docenteId },
      data: {
        area_id: dto.area_id
      },
      include: {
        areas: {
          select: {
            nombre: true,
            descripcion: true
          }
        },
        usuarios: {
          select: {
            nombres: true,
            apellidos: true,
            email: true
          }
        }
      }
    });

    res.json(
      ResponseFormatter.success(
        docenteActualizado, 
        '�rea asignada exitosamente al docente'
      )
    );
  }
);

/**
 * Obtener horarios asignados a un docente
 * GET /api/admin/asignaciones/docente/:docenteId/horarios
 */
export const obtenerHorariosDocente = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const docenteId = req.params.docenteId as string;

    const docente = await prisma.docentes.findUnique({
      where: { id: docenteId }
    });

    if (!docente) {
      throw new NotFoundError('Docente no encontrado');
    }

    const horarios = await prisma.horarios_base.findMany({
      where: {
        docente_id: docenteId,
        activo: true
      },
      include: {
        areas: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: [
        { dia_semana: 'asc' },
        { hora_inicio: 'asc' }
      ]
    });

    res.json(
      ResponseFormatter.success(
        horarios, 
        'Horarios del docente obtenidos exitosamente'
      )
    );
  }
);



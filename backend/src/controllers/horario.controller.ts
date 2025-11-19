import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Interface para datos de horario
export interface DatosHorario {
  docenteId: string;
  area_id: number;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  tipo_clase?: string;
  horas_semana: number;
  activo?: boolean;
}

// Interface para filtros de horarios
export interface FiltrosHorarios {
  activo?: boolean;
  dia_semana?: number;
  docenteId?: string;
  area_id?: number;
}

// Interface para estadísticas de horarios
export interface EstadisticasHorarios {
  total: number;
  activos: number;
  inactivos: number;
  totalHorasSemana: number;
  promedioHorasSemana: number;
  distribuciones: Array<{
    dia_semana: number;
    nombreDia: string;
    cantidad: number;
    totalHoras: number;
  }>;
}

/**
 * Obtener todos los horarios con estadísticas
 */
export const obtenerHorarios = async (req: Request, res: Response) => {
  try {
    const { activo, dia_semana, docenteId, area_id } = req.query;
    
    // Construir filtros
    const whereClause: any = {};
    
    if (activo !== undefined) {
      whereClause.activo = activo === 'true';
    }
    
    if (dia_semana !== undefined) {
      whereClause.dia_semana = parseInt(dia_semana as string);
    }
    
    if (docenteId) {
      whereClause.docenteId = docenteId as string;
    }
    
    if (area_id !== undefined) {
      whereClause.area_id = parseInt(area_id as string);
    }

    // Obtener horarios con relaciones
    const horarios = await prisma.horarios_base.findMany({
      where: whereClause,
      include: {
        docentes: {
          include: {
            usuarios: {
              select: {
                nombres: true,
                apellidos: true
              }
            }
          }
        },
        areas: {
          select: {
            id: true,
            nombre: true,
            descripcion: true
          }
        }
      },
      orderBy: [
        { dia_semana: 'asc' },
        { hora_inicio: 'asc' }
      ]
    });

    // Calcular estadísticas
    const totalHorarios = horarios.length;
    const horariosActivos = horarios.filter((h: any) => h.activo).length;
    const horariosInactivos = totalHorarios - horariosActivos;
    const totalHorasSemana = horarios.reduce((sum: number, h: any) => sum + (h.horas_semana || 0), 0);
    const promedioHorasSemana = totalHorarios > 0 ? totalHorasSemana / totalHorarios : 0;

    // Calcular distribución por días
    const distribucionPorDia = horarios.reduce((acc: any, horario: any) => {
      const dia = horario.dia_semana;
      if (!acc[dia]) {
        acc[dia] = {
          dia_semana: dia,
          nombreDia: obtenerNombreDia(dia),
          cantidad: 0,
          totalHoras: 0
        };
      }
      acc[dia].cantidad++;
      acc[dia].totalHoras += horario.horas_semana || 0;
      return acc;
    }, {});

    const distribuciones = Object.values(distribucionPorDia) as Array<{
      dia_semana: number;
      nombreDia: string;
      cantidad: number;
      totalHoras: number;
    }>;

    const estadisticas: EstadisticasHorarios = {
      total: totalHorarios,
      activos: horariosActivos,
      inactivos: horariosInactivos,
      totalHorasSemana: totalHorasSemana,
      promedioHorasSemana: Math.round(promedioHorasSemana * 100) / 100,
      distribuciones: distribuciones.sort((a, b) => a.dia_semana - b.dia_semana)
    };

    return res.status(200).json({
      success: true,
      message: 'Horarios obtenidos correctamente',
      data: {
        horarios,
        estadisticas
      }
    });

  } catch (error) {
    console.error('Error obteniendo horarios:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * Crear nuevo horario
 */
export const crearHorario = async (req: Request, res: Response) => {
  try {
    const { 
      docenteId, 
      area_id, 
      dia_semana, 
      hora_inicio, 
      hora_fin, 
      tipo_clase = 'TEORICA',
      horas_semana,
      activo = true 
    }: DatosHorario = req.body;

    // Validaciones
    if (!docenteId || docenteId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El ID del docente es requerido'
      });
    }

    if (!area_id || area_id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El ID del área es requerido'
      });
    }

    if (!dia_semana || dia_semana < 1 || dia_semana > 7) {
      return res.status(400).json({
        success: false,
        message: 'Día de la semana debe estar entre 1 (Lunes) y 7 (Domingo)'
      });
    }

    if (!hora_inicio || !hora_fin) {
      return res.status(400).json({
        success: false,
        message: 'Hora de inicio y fin son requeridas'
      });
    }

    // Validar formato de hora (HH:MM)
    const formatoHora = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!formatoHora.test(hora_inicio) || !formatoHora.test(hora_fin)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de hora inválido. Use HH:MM'
      });
    }

    // Verificar que hora inicio sea menor que hora fin
    const inicio = new Date(`2000-01-01T${hora_inicio}:00`);
    const fin = new Date(`2000-01-01T${hora_fin}:00`);
    
    if (inicio >= fin) {
      return res.status(400).json({
        success: false,
        message: 'La hora de inicio debe ser menor que la hora de fin'
      });
    }

    // Verificar que el docente existe
    const docenteExiste = await prisma.docentes.findUnique({
      where: { id: docenteId }
    });

    if (!docenteExiste) {
      return res.status(404).json({
        success: false,
        message: 'Docente no encontrado'
      });
    }

    // Verificar que el área existe
    const areaExiste = await prisma.areas.findUnique({
      where: { id: area_id }
    });

    if (!areaExiste) {
      return res.status(404).json({
        success: false,
        message: 'Área no encontrada'
      });
    }

    // Verificar conflictos de horario (mismo docente, mismo día, horas superpuestas)
    const horariosConflicto = await prisma.horarios_base.findMany({
      where: {
        docente_id: docenteId,
        dia_semana: dia_semana,
        activo: true,
        OR: [
          {
            AND: [
              { hora_inicio: { lte: hora_inicio } },
              { hora_fin: { gt: hora_inicio } }
            ]
          },
          {
            AND: [
              { hora_inicio: { lt: hora_fin } },
              { hora_fin: { gte: hora_fin } }
            ]
          },
          {
            AND: [
              { hora_inicio: { gte: hora_inicio } },
              { hora_fin: { lte: hora_fin } }
            ]
          }
        ]
      }
    });

    if (horariosConflicto.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'El docente ya tiene un horario asignado en ese día y rango de horas'
      });
    }

    // Crear el horario
    const nuevoHorario = await prisma.horarios_base.create({
      data: {
        docente_id: docenteId,
        area_id: area_id,
        dia_semana: dia_semana,
        hora_inicio: hora_inicio,
        hora_fin: hora_fin,
        tipo_clase: tipo_clase,
        horas_semana: horas_semana,
        activo: Boolean(activo)
      },
      include: {
        docentes: {
          include: {
            usuarios: {
              select: {
                nombres: true,
                apellidos: true
              }
            }
          }
        },
        areas: {
          select: {
            id: true,
            nombre: true,
            descripcion: true
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Horario creado correctamente',
      data: { horario: nuevoHorario }
    });

  } catch (error) {
    console.error('Error creando horario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * Eliminar horario
 */
export const eliminarHorario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de horario inválido'
      });
    }

    // Verificar que el horario existe
    const horarioExistente = await prisma.horarios_base.findUnique({
      where: { id: parseInt(id) }
    });

    if (!horarioExistente) {
      return res.status(404).json({
        success: false,
        message: 'Horario no encontrado'
      });
    }

    // Verificar si el horario está siendo usado en horas trabajadas
    const horasTrabajadasConHorario = await prisma.horas_trabajadas.findFirst({
      where: { horario_base_id: parseInt(id) }
    });

    if (horasTrabajadasConHorario) {
      // En lugar de eliminar, marcar como inactivo
      const horarioDesactivado = await prisma.horarios_base.update({
        where: { id: parseInt(id) },
        data: { activo: false }
      });

      return res.status(200).json({
        success: true,
        message: 'Horario desactivado correctamente (tiene registros de horas trabajadas)',
        data: { horario: horarioDesactivado }
      });
    }

    // Eliminar el horario si no tiene dependencias
    await prisma.horarios_base.delete({
      where: { id: parseInt(id) }
    });

    return res.status(200).json({
      success: true,
      message: 'Horario eliminado correctamente'
    });

  } catch (error) {
    console.error('Error eliminando horario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * Función auxiliar para obtener nombre del día
 */
function obtenerNombreDia(dia: number): string {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return dias[dia] || 'Desconocido';
}

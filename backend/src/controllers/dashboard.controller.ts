import { Request, Response } from 'express';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import prisma from '../utils/database';

/**
 * Obtener estadísticas generales del panel de administración
 */
export const obtenerEstadisticasAdmin = async (_req: Request, res: Response) => {
  try {
    const hoy = new Date();
    const inicioHoy = startOfDay(hoy);
    const finHoy = endOfDay(hoy);

    // Contar todos los usuarios del sistema
    const totalUsuarios = await prisma.usuarios.count({
      where: {
        activo: true
      }
    });

    // Contar docentes totales
    const totalDocentes = await prisma.docentes.count();

    // Contar presentes hoy (obtener IDs únicos de docentes)
    const asistenciasConDocentes = await prisma.asistencias.findMany({
      where: {
        fecha: {
          gte: inicioHoy,
          lte: finHoy
        },
        horaEntrada: { not: null }
      },
      select: { docenteId: true }
    });

    // Contar docentes únicos presentes
    const docentesPresentes = new Set(asistenciasConDocentes.map(a => a.docenteId)).size;

    // Contar total de asistencias de hoy
    const totalAsistenciasHoy = await prisma.asistencias.count({
      where: {
        fecha: {
          gte: inicioHoy,
          lte: finHoy
        }
      }
    });

    // Calcular puntualidad promedio (llegadas antes de las 8:15 AM)
    const asistenciasConHora = await prisma.asistencias.findMany({
      where: {
        fecha: {
          gte: inicioHoy,
          lte: finHoy
        },
        horaEntrada: { not: null }
      },
      select: { horaEntrada: true }
    });

    const llegadasPuntuales = asistenciasConHora.filter(a => {
      if (!a.horaEntrada) return false;
      const horaLlegada = new Date(a.horaEntrada);
      const horaLimite = new Date(horaLlegada);
      horaLimite.setHours(8, 15, 0, 0);
      return horaLlegada <= horaLimite;
    }).length;

    const porcentajePuntualidad = asistenciasConHora.length > 0 
      ? (llegadasPuntuales / asistenciasConHora.length * 100) 
      : 0;

    // Estadísticas de ubicaciones
    const totalUbicaciones = await prisma.ubicaciones_permitidas.count();
    const ubicacionesActivas = await prisma.ubicaciones_permitidas.count({
      where: { activo: true }
    });

    // Estadísticas de horarios
    const totalHorarios = await prisma.horarios_base.count();
    const horariosActivos = await prisma.horarios_base.count({
      where: { activo: true }
    });

    // Estadísticas de áreas
    const totalAreas = await prisma.areas.count();
    const areasActivas = await prisma.areas.count({
      where: { activo: true }
    });

    // Estadísticas de los últimos 7 días
    const hace7Dias = subDays(hoy, 7);
    const asistenciasUltimos7Dias = await prisma.asistencias.count({
      where: {
        fecha: {
          gte: hace7Dias,
          lte: hoy
        }
      }
    });

    const estadisticas = {
      usuarios: {
        total: totalUsuarios,
        activos: totalUsuarios // Asumiendo que solo contamos activos
      },
      docentes: {
        total: totalDocentes,
        presentesHoy: docentesPresentes,
        porcentajeAsistencia: totalDocentes > 0 ? (docentesPresentes / totalDocentes * 100) : 0
      },
      asistencia: {
        hoy: totalAsistenciasHoy,
        ultimos7Dias: asistenciasUltimos7Dias,
        porcentajePuntualidad: Math.round(porcentajePuntualidad * 100) / 100
      },
      ubicaciones: {
        total: totalUbicaciones,
        activas: ubicacionesActivas,
        porcentajeActivas: totalUbicaciones > 0 ? (ubicacionesActivas / totalUbicaciones * 100) : 0
      },
      horarios: {
        total: totalHorarios,
        activos: horariosActivos,
        porcentajeActivos: totalHorarios > 0 ? (horariosActivos / totalHorarios * 100) : 0
      },
      areas: {
        total: totalAreas,
        activas: areasActivas,
        porcentajeActivas: totalAreas > 0 ? (areasActivas / totalAreas * 100) : 0
      }
    };

    return res.status(200).json({
      success: true,
      message: 'Estadísticas obtenidas correctamente',
      data: {
        estadisticas,
        ultimaActualizacion: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * Obtener resumen de actividad del sistema
 */
export const obtenerResumenActividad = async (req: Request, res: Response) => {
  try {
    const { dias = 30 } = req.query;
    const fecha_inicio = subDays(new Date(), parseInt(dias as string));

    // Actividad de asistencias por día
    const asistenciasPorDia = await prisma.asistencias.groupBy({
      by: ['fecha'],
      where: {
        fecha: {
          gte: fecha_inicio
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        fecha: 'asc'
      }
    });

    // Actividad de usuarios por día (últimos accesos)
    const actividadUsuarios = await prisma.usuarios.groupBy({
      by: ['ultimo_acceso'],
      where: {
        ultimo_acceso: {
          gte: fecha_inicio
        }
      },
      _count: {
        id: true
      }
    });

    // Distribución de asistencias por áreas
    const asistenciasPorArea = await prisma.asistencias.findMany({
      where: {
        fecha: {
          gte: fecha_inicio
        }
      },
      include: {
        docente: {
          include: {
            areas: true
          }
        }
      }
    });

    const distribucionPorArea = asistenciasPorArea.reduce((acc: any, asistencia) => {
      const areaNombre = asistencia.docente?.areas?.nombre || 'Sin área';
      if (!acc[areaNombre]) {
        acc[areaNombre] = 0;
      }
      acc[areaNombre]++;
      return acc;
    }, {});

    const resumenActividad = {
      asistenciasPorDia: asistenciasPorDia.map(item => ({
        fecha: format(new Date(item.fecha), 'yyyy-MM-dd'),
        cantidad: item._count.id
      })),
      actividadUsuarios: actividadUsuarios.length,
      distribucionPorArea: Object.entries(distribucionPorArea).map(([area, cantidad]) => ({
        area,
        cantidad
      })),
      periodoAnalisis: {
        desde: format(fecha_inicio, 'yyyy-MM-dd'),
        hasta: format(new Date(), 'yyyy-MM-dd'),
        dias: parseInt(dias as string)
      }
    };

    return res.status(200).json({
      success: true,
      message: 'Resumen de actividad obtenido correctamente',
      data: resumenActividad
    });

  } catch (error) {
    console.error('Error obteniendo resumen de actividad:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * Obtener métricas del sistema en tiempo real
 */
export const obtenerMetricasTiempoReal = async (_req: Request, res: Response) => {
  try {
    const ahora = new Date();
    const inicioHoy = startOfDay(ahora);

    // Docentes actualmente en la institución
    const docentesPresentes = await prisma.asistencias.count({
      where: {
        fecha: inicioHoy,
        horaEntrada: { not: null },
        horaSalida: null
      }
    });

    // Última actividad registrada
    const ultimaAsistencia = await prisma.asistencias.findFirst({
      orderBy: { horaEntrada: 'desc' },
      include: {
        docente: {
          include: {
            usuarios: {
              select: {
                nombres: true,
                apellidos: true
              }
            }
          }
        }
      }
    });

    // Estado del sistema
    const sistemaSaludable = true; // Aquí podrías agregar lógica de health checks

    const metricas = {
      docentesPresentes,
      ultimaActividad: ultimaAsistencia ? {
        docente: `${ultimaAsistencia.docente?.usuarios?.nombres} ${ultimaAsistencia.docente?.usuarios?.apellidos}`,
        hora: ultimaAsistencia.horaEntrada,
        tipo: ultimaAsistencia.horaSalida ? 'salida' : 'entrada'
      } : null,
      estadoSistema: {
        saludable: sistemaSaludable,
        timestamp: ahora.toISOString()
      },
      horaServidor: ahora.toISOString()
    };

    return res.status(200).json({
      success: true,
      message: 'Métricas en tiempo real obtenidas correctamente',
      data: metricas
    });

  } catch (error) {
    console.error('Error obteniendo métricas en tiempo real:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

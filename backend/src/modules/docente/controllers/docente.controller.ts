/**
 * @module DocenteController
 * @description Controller para auto-gestión del docente autenticado
 * 
 * Responsabilidades:
 * - Gestión de perfil propio
 * - Consulta de horarios propios
 * - Dashboard personal
 * - Consulta de asistencias propias
 * 
 * Este módulo es independiente del módulo admin para cumplir SRP
 * Solo permite operaciones sobre el docente autenticado (self-service)
 */

import { Request, Response } from 'express';
import prisma from '../../../shared/utils/database';
import { asyncHandler } from '../../../shared/middleware/error-handler';
import { ResponseFormatter } from '../../../shared/utils/response-formatter';
import { NotFoundError, ValidationError } from '../../../shared/utils/app-error';

// ========================================
// OBTENER MI PERFIL (DOCENTE AUTENTICADO)
// ========================================
export const getMiPerfil = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const docenteId = req.usuario?.docenteId;

  if (!docenteId) {
    throw new ValidationError('Usuario no es un docente');
  }

  // Obtener perfil completo del docente
  const docente = await prisma.docentes.findUnique({
    where: { id: docenteId },
    include: {
      usuarios: {
        select: {
          id: true,
          dni: true,
          nombres: true,
          apellidos: true,
          email: true,
          telefono: true,
          activo: true,
          roles: {
            select: {
              nombre: true
            }
          }
        }
      },
      areas: {
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          activo: true
        }
      },
      _count: {
        select: {
          asistencias: true,
          horarios_base: true
        }
      }
    }
  });

  if (!docente) {
    throw new NotFoundError('Docente');
  }

  // Calcular estadísticas básicas del mes actual
  const now = new Date();
  const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1);
  const ultimoDiaMes = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [asistenciasEsteMes, tardanzasEsteMes, justificacionesPendientes] = await Promise.all([
    // Asistencias del mes
    prisma.asistencias.count({
      where: {
        docenteId,
        fecha: { gte: primerDiaMes, lte: ultimoDiaMes },
        horaEntrada: { not: null }
      }
    }),
    // Tardanzas del mes
    prisma.asistencias.count({
      where: {
        docenteId,
        fecha: { gte: primerDiaMes, lte: ultimoDiaMes },
        tardanzaMinutos: { gt: 0 }
      }
    }),
    // Justificaciones pendientes
    prisma.justificaciones.count({
      where: {
        asistencias: { docenteId },
        estado: 'pendiente'
      }
    })
  ]);

  // Calcular puntualidad
  const puntualidad = asistenciasEsteMes > 0
    ? Math.round(((asistenciasEsteMes - tardanzasEsteMes) / asistenciasEsteMes) * 100)
    : 0;

  const perfil = {
    docentes: {
      id: docente.id,
      codigo_docente: docente.codigo_docente,
      fecha_ingreso: docente.fecha_ingreso,
      horario_entrada: docente.horario_entrada,
      horario_salida: docente.horario_salida,
      estado: docente.estado,
      estado_civil: docente.estado_civil,
      fecha_nacimiento: docente.fecha_nacimiento,
      direccion: docente.direccion,
      contacto_emergencia: docente.contacto_emergencia,
      telefono_emergencia: docente.telefono_emergencia,
      banco: docente.banco,
      cuenta_bancaria: docente.cuenta_bancaria,
      observaciones: docente.observaciones
    },
    usuarios: {
      id: docente.usuarios.id,
      dni: docente.usuarios.dni,
      nombres: docente.usuarios.nombres,
      apellidos: docente.usuarios.apellidos,
      nombreCompleto: `${docente.usuarios.nombres} ${docente.usuarios.apellidos}`,
      email: docente.usuarios.email,
      telefono: docente.usuarios.telefono,
      activo: docente.usuarios.activo,
      rol: docente.usuarios.roles.nombre
    },
    areas: docente.areas ? {
      id: docente.areas.id,
      nombre: docente.areas.nombre,
      descripcion: docente.areas.descripcion,
      activo: docente.areas.activo
    } : null,
    estadisticas: {
      totalAsistencias: docente._count.asistencias,
      totalHorarios: docente._count.horarios_base,
      asistenciasEsteMes,
      tardanzasEsteMes,
      puntualidad,
      justificacionesPendientes
    }
  };

  const response = ResponseFormatter.success(
    perfil,
    'Perfil obtenido exitosamente'
  );

  res.status(200).json(response);
});

// ========================================
// ACTUALIZAR MI PERFIL (DOCENTE AUTENTICADO)
// ========================================
export const updateMiPerfil = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const docenteId = req.usuario?.docenteId;
  const { telefono, direccion, contacto_emergencia, telefono_emergencia } = req.body;

  if (!docenteId) {
    throw new ValidationError('Usuario no es un docente');
  }

  // Verificar que el docente existe
  const docenteExistente = await prisma.docentes.findUnique({
    where: { id: docenteId },
    include: { usuarios: true }
  });

  if (!docenteExistente) {
    throw new NotFoundError('Docente');
  }

  // Actualizar en una transacción
  const resultado = await prisma.$transaction(async (tx) => {
    // Actualizar teléfono en usuario si se proporciona
    if (telefono !== undefined) {
      await tx.usuarios.update({
        where: { id: docenteExistente.usuario_id },
        data: { telefono }
      });
    }

    // Actualizar datos del docente
    const docenteActualizado = await tx.docentes.update({
      where: { id: docenteId },
      data: {
        direccion: direccion !== undefined ? direccion : docenteExistente.direccion,
        contacto_emergencia: contacto_emergencia !== undefined ? contacto_emergencia : docenteExistente.contacto_emergencia,
        telefono_emergencia: telefono_emergencia !== undefined ? telefono_emergencia : docenteExistente.telefono_emergencia
      },
      include: {
        usuarios: {
          select: {
            id: true,
            dni: true,
            nombres: true,
            apellidos: true,
            email: true,
            telefono: true,
            activo: true
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

    return docenteActualizado;
  });

  const response = ResponseFormatter.updated(
    resultado,
    'Perfil actualizado exitosamente'
  );

  res.status(200).json(response);
});

// ========================================
// OBTENER MIS HORARIOS (DOCENTE AUTENTICADO)
// ========================================
export const getMisHorarios = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const docenteId = req.usuario?.docenteId;
  const { activo } = req.query;

  if (!docenteId) {
    throw new ValidationError('Usuario no es un docente');
  }

  // Construir filtros
  const filtros: any = {
    docente_id: docenteId,
    activo: activo === 'false' ? false : true // Por defecto solo activos
  };

  // Obtener horarios del docente
  const horarios = await prisma.horarios_base.findMany({
    where: filtros,
    include: {
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

  // Mapear días de la semana
  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Formatear horarios
  const horariosFormateados = horarios.map(horario => ({
    id: horario.id,
    dia_semana: horario.dia_semana,
    diaNombre: diasSemana[horario.dia_semana],
    hora_inicio: horario.hora_inicio,
    hora_fin: horario.hora_fin,
    tipo_clase: horario.tipo_clase,
    horas_semana: horario.horas_semana,
    activo: horario.activo,
    areas: horario.areas ? {
      id: horario.areas.id,
      nombre: horario.areas.nombre,
      descripcion: horario.areas.descripcion
    } : null,
    fecha_vigencia: horario.fecha_vigencia,
    fecha_fin: horario.fecha_fin
  }));

  // Agrupar por día
  const horariosPorDia = horariosFormateados.reduce((acc: Record<string, typeof horariosFormateados>, horario) => {
    const dia = horario.diaNombre;
    if (dia) {
      if (!acc[dia]) {
        acc[dia] = [];
      }
      acc[dia].push(horario);
    }
    return acc;
  }, {});

  // Calcular estadísticas
  const estadisticas = {
    totalHorarios: horarios.length,
    horasSemanaTotales: horarios.reduce((sum, h) => sum + Number(h.horas_semana || 0), 0),
    diasConClases: new Set(horarios.map(h => h.dia_semana)).size,
    distribuciones: Object.entries(horariosPorDia).map(([dia, horarios]) => ({
      dia,
      cantidad: (horarios as any[]).length,
      horas: (horarios as any[]).reduce((sum, h) => sum + (h.horas_semana || 0), 0)
    }))
  };

  const response = ResponseFormatter.success(
    {
      horarios: horariosFormateados,
      horariosPorDia,
      estadisticas
    },
    'Horarios obtenidos exitosamente'
  );

  res.status(200).json(response);
});

// ========================================
// OBTENER MI DASHBOARD (DOCENTE AUTENTICADO)
// ========================================
export const getMiDashboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const docenteId = req.usuario?.docenteId;

  if (!docenteId) {
    throw new ValidationError('Usuario no es un docente');
  }

  // Fechas del mes actual
  const now = new Date();
  const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1);
  const ultimoDiaMes = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Obtener datos en paralelo para mejor performance
  const [
    asistenciasEsteMes,
    tardanzasEsteMes,
    horasLaboradasData,
    justificacionesPendientes,
    ultimasAsistencias,
    proximoHorario
  ] = await Promise.all([
    // 1. Contar asistencias del mes
    prisma.asistencias.count({
      where: {
        docenteId,
        fecha: { gte: primerDiaMes, lte: ultimoDiaMes },
        horaEntrada: { not: null }
      }
    }),

    // 2. Contar tardanzas del mes
    prisma.asistencias.count({
      where: {
        docenteId,
        fecha: { gte: primerDiaMes, lte: ultimoDiaMes },
        tardanzaMinutos: { gt: 0 }
      }
    }),

    // 3. Calcular horas laboradas
    prisma.asistencias.findMany({
      where: {
        docenteId,
        fecha: { gte: primerDiaMes, lte: ultimoDiaMes },
        horaEntrada: { not: null },
        horaSalida: { not: null }
      },
      select: {
        horaEntrada: true,
        horaSalida: true
      }
    }),

    // 4. Contar justificaciones pendientes
    prisma.justificaciones.count({
      where: {
        asistencias: { docenteId },
        estado: 'pendiente'
      }
    }),

    // 5. Últimas 5 asistencias
    prisma.asistencias.findMany({
      where: { docenteId },
      select: {
        id: true,
        fecha: true,
        horaEntrada: true,
        horaSalida: true,
        estado: true,
        tardanzaMinutos: true,
        horasTrabajadas: true,
        ubicacionEntrada: {
          select: { nombre: true }
        }
      },
      orderBy: { fecha: 'desc' },
      take: 5
    }),

    // 6. Próximo horario (hoy o mañana)
    prisma.horarios_base.findFirst({
      where: {
        docente_id: docenteId,
        activo: true,
        dia_semana: { in: [now.getDay(), (now.getDay() + 1) % 7] }
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
    })
  ]);

  // Calcular horas laboradas
  let horasLaboradas = 0;
  horasLaboradasData.forEach(asistencia => {
    if (asistencia.horaEntrada && asistencia.horaSalida) {
      const entrada = new Date(asistencia.horaEntrada);
      const salida = new Date(asistencia.horaSalida);
      const diferencia = salida.getTime() - entrada.getTime();
      horasLaboradas += diferencia / (1000 * 60 * 60);
    }
  });

  // Calcular puntualidad
  const puntualidad = asistenciasEsteMes > 0
    ? Math.round(((asistenciasEsteMes - tardanzasEsteMes) / asistenciasEsteMes) * 100)
    : 0;

  // Formatear próximo horario
  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const proximoHorarioFormateado = proximoHorario ? {
    id: proximoHorario.id,
    dia: diasSemana[proximoHorario.dia_semana],
    hora_inicio: proximoHorario.hora_inicio,
    hora_fin: proximoHorario.hora_fin,
    areas: proximoHorario.areas?.nombre || 'Sin área',
    tipo_clase: proximoHorario.tipo_clase
  } : null;

  const dashboard = {
    estadisticas: {
      asistenciasEsteMes,
      tardanzasEsteMes,
      horasLaboradas: Math.round(horasLaboradas * 10) / 10, // 1 decimal
      puntualidad,
      justificacionesPendientes
    },
    proximoHorario: proximoHorarioFormateado,
    ultimasAsistencias: ultimasAsistencias.map(a => ({
      id: a.id,
      fecha: a.fecha,
      horaEntrada: a.horaEntrada,
      horaSalida: a.horaSalida,
      estado: a.estado,
      tardanzaMinutos: a.tardanzaMinutos,
      horas_trabajadas: a.horasTrabajadas,
      ubicacion: a.ubicacionEntrada?.nombre || 'N/A'
    })),
    periodo: {
      inicio: primerDiaMes,
      fin: ultimoDiaMes,
      mes: now.toLocaleString('es-ES', { month: 'long', year: 'numeric' })
    }
  };

  const response = ResponseFormatter.success(
    dashboard,
    'Dashboard obtenido exitosamente'
  );

  res.status(200).json(response);
});

// ========================================
// EXPORTAR NUEVOS HANDLERS (Service Layer)
// ========================================
export {
  registrarEntrada,
  registrarSalida,
  obtenerAsistenciaHoy,
  obtenerHistorialAsistencias,
  getMiDashboardOptimizado,
  obtenerEstadisticasMes,
  obtenerComparativa
} from './docente-new.controller';

/**
 * @fileoverview Servicio de Estad�sticas Docente - Nivel Senior
 * @description C�lculo optimizado de m�tricas y estad�sticas:
 * - Dashboard con aggregations
 * - Estad�sticas mensuales
 * - Queries optimizadas sin N+1
 * - Cach� para performance
 */

import prisma from '../../../utils/database';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface DashboardDocente {
  asistenciaHoy: {
    id: string;
    hora_entrada: Date | null;
    hora_salida: Date | null;
    ubicacionEntrada: string | null;
    ubicacionSalida: string | null;
    estado: string;
  } | null;
  estadisticasMes: {
    totalAsistencias: number;
    diasTrabajados: number;
    totalTardanzas: number;
    promedioTardanza: number;
    puntualidad: number;
  };
  proximosHorarios: Array<{
    dia: string;
    hora_inicio: string;
    hora_fin: string;
    area: string;
  }>;
}

export class EstadisticasService {
  /**
   * Dashboard del docente con datos optimizados
   * Query �nica con aggregations para mejor performance
   */
  async obtenerDashboard(docente_id: string): Promise<DashboardDocente> {
    const hoy = new Date();
    const inicioMes = startOfMonth(hoy);
    const finMes = endOfMonth(hoy);

    // Queries en paralelo para mejor performance
    const [asistenciaHoy, estadisticasMes, diasTrabajadosResult, tardanzas, proximosHorarios] = 
      await Promise.all([
        // 1. Asistencia de hoy
        this.obtenerAsistenciaHoy(docente_id, hoy),

        // 2. Estad�sticas del mes con aggregation
        prisma.asistencias.aggregate({
          where: {
            docenteId: docente_id,
            fecha: { gte: inicioMes, lte: finMes }
          },
          _count: { id: true },
          _sum: { tardanzaMinutos: true },
          _avg: { tardanzaMinutos: true }
        }),

        // 3. D�as trabajados (DISTINCT)
        prisma.$queryRaw<Array<{ dias: bigint }>>`
          SELECT COUNT(DISTINCT fecha) as dias
          FROM asistencias
          WHERE docente_id = ${docente_id}::uuid
          AND fecha BETWEEN ${inicioMes} AND ${finMes}
          AND hora_entrada IS NOT NULL
        `,

        // 4. Total de tardanzas
        prisma.asistencias.count({
          where: {
            docenteId: docente_id,
            fecha: { gte: inicioMes, lte: finMes },
            tardanzaMinutos: { gt: 0 }
          }
        }),

        // 5. Pr�ximos horarios
        this.obtenerProximosHorarios(docente_id)
      ]);

    // Calcular d�as trabajados
    const diasTrabajados = Number(diasTrabajadosResult[0]?.dias || 0);

    // Calcular puntualidad
    const totalAsistencias = estadisticasMes._count?.id || 0;
    const puntualidad = totalAsistencias > 0
      ? ((totalAsistencias - tardanzas) / totalAsistencias) * 100
      : 100;

    return {
      asistenciaHoy: asistenciaHoy ? {
        id: asistenciaHoy.id,
        hora_entrada: asistenciaHoy.horaEntrada,
        hora_salida: asistenciaHoy.horaSalida,
        ubicacionEntrada: asistenciaHoy.ubicacionEntrada?.nombre || null,
        ubicacionSalida: asistenciaHoy.ubicacionSalida?.nombre || null,
        estado: this.calcularEstadoAsistencia(asistenciaHoy)
      } : null,

      estadisticasMes: {
        totalAsistencias,
        diasTrabajados,
        totalTardanzas: tardanzas,
        promedioTardanza: Math.round(estadisticasMes._avg?.tardanzaMinutos || 0),
        puntualidad: Math.round(puntualidad * 10) / 10
      },

      proximosHorarios: proximosHorarios.map((h: any) => ({
        dia: this.formatearDia(String(h.dia_semana)),
        hora_inicio: format(h.hora_inicio, 'HH:mm'),
        hora_fin: format(h.hora_fin, 'HH:mm'),
        area: h.areas?.nombre || 'Sin área'
      }))
    };
  }

  /**
   * Obtiene asistencia de hoy con ubicaciones
   */
  private async obtenerAsistenciaHoy(docente_id: string, fecha: Date) {
    return await prisma.asistencias.findFirst({
      where: {
        docenteId: docente_id,
        fecha: {
          gte: startOfDay(fecha),
          lte: endOfDay(fecha)
        }
      },
      include: {
        ubicacionEntrada: {
          select: {
            nombre: true
          }
        },
        ubicacionSalida: {
          select: {
            nombre: true
          }
        }
      }
    });
  }

  /**
   * Obtiene pr�ximos horarios del docente
   */
  private async obtenerProximosHorarios(docente_id: string) {
    return await prisma.horarios_base.findMany({
      where: {
        docente_id,
        activo: true
      },
      take: 5,
      orderBy: [
        { dia_semana: 'asc' },
        { hora_inicio: 'asc' }
      ],
      include: {
        areas: {
          select: {
            nombre: true
          }
        }
      }
    });
  }

  /**
   * Calcula el estado de la asistencia
   */
  private calcularEstadoAsistencia(asistencia: any): string {
    if (!asistencia.hora_entrada) return 'FALTA';
    if (asistencia.tardanza_minutos > 0) return 'TARDANZA';
    return 'PRESENTE';
  }

  /**
   * Formatea el d�a de la semana
   */
  private formatearDia(dia: string): string {
    const dias: { [key: string]: string } = {
      'LUNES': 'Lunes',
      'MARTES': 'Martes',
      'MIERCOLES': 'Mi�rcoles',
      'JUEVES': 'Jueves',
      'VIERNES': 'Viernes',
      'SABADO': 'S�bado',
      'DOMINGO': 'Domingo'
    };
    return dias[dia] || dia;
  }

  /**
   * Obtiene estad�sticas mensuales detalladas CON detalle por d�a
   * ACTUALIZADO: Devuelve estructura completa que espera el frontend
   */
  async obtenerEstadisticasMes(
    docente_id: string,
    mes?: number,
    anio?: number
  ): Promise<{
    periodo: {
      mes: number;
      anio: number;
      nombre: string;
    };
    estadisticas: {
      diasTrabajados: number;
      asistencias: number;
      tardanzas: number;
      puntualidad: number;
      horasTotales: number;
      promedioHorasDiarias: number;
    };
    detallePorDia: Array<{
      fecha: string;
      estado: string;
      hora_entrada: string | null;
      hora_salida: string | null;
      tardanza_minutos: number | null;
      horasTrabajadas: number | null;
    }>;
  }> {
    const fecha = new Date();
    const mesNum = mes || fecha.getMonth() + 1;
    const anioNum = anio || fecha.getFullYear();
    
    fecha.setMonth(mesNum - 1);
    fecha.setFullYear(anioNum);

    const inicioMes = startOfMonth(fecha);
    const finMes = endOfMonth(fecha);

    // Queries optimizadas en paralelo
    const [asistenciasCount, tardanzasAgg, diasTrabajados, asistenciasDetalle] = await Promise.all([
      // Total asistencias
      prisma.asistencias.count({
        where: {
          docenteId: docente_id,
          fecha: { gte: inicioMes, lte: finMes },
          horaEntrada: { not: null }
        }
      }),

      // Tardanzas
      prisma.asistencias.aggregate({
        where: {
          docenteId: docente_id,
          fecha: { gte: inicioMes, lte: finMes },
          tardanzaMinutos: { gt: 0 }
        },
        _count: { id: true },
        _avg: { tardanzaMinutos: true }
      }),

      // D�as trabajados
      prisma.$queryRaw<Array<{ dias: bigint }>>`
        SELECT COUNT(DISTINCT fecha) as dias
        FROM asistencias
        WHERE docente_id = ${docente_id}::uuid
        AND fecha BETWEEN ${inicioMes} AND ${finMes}
        AND hora_entrada IS NOT NULL
      `,

      // NUEVO: Obtener todas las asistencias del mes para detalle por día
      prisma.asistencias.findMany({
        where: {
          docenteId: docente_id,
          fecha: { gte: inicioMes, lte: finMes }
        },
        orderBy: { fecha: 'asc' },
        select: {
          fecha: true,
          horaEntrada: true,
          horaSalida: true,
          tardanzaMinutos: true
        }
      })
    ]);

    const diasTrabajadosNum = Number(diasTrabajados[0]?.dias || 0);
    const puntualidad = asistenciasCount > 0
      ? ((asistenciasCount - (tardanzasAgg._count?.id || 0)) / asistenciasCount) * 100
      : 100;

    // Calcular horas totales y detalle por día
    let horasTotales = 0;
    const detallePorDia = asistenciasDetalle.map((asistencia: any) => {
      let horasTrabajadas: number | null = null;
      let estado = 'FALTA';

      if (asistencia.horaEntrada) {
        estado = asistencia.tardanzaMinutos && asistencia.tardanzaMinutos > 0 ? 'TARDANZA' : 'PRESENTE';
        
        // Calcular horas trabajadas si hay entrada y salida
        if (asistencia.horaSalida && asistencia.horaEntrada) {
          const diffMs = new Date(asistencia.horaSalida).getTime() - new Date(asistencia.horaEntrada).getTime();
          horasTrabajadas = diffMs / (1000 * 60 * 60); // Convertir a horas
          horasTotales += horasTrabajadas;
        }
      }

      return {
        fecha: format(asistencia.fecha, 'yyyy-MM-dd'),
        estado,
        hora_entrada: asistencia.horaEntrada ? format(asistencia.horaEntrada, "yyyy-MM-dd'T'HH:mm:ss'Z'") : null,
        hora_salida: asistencia.horaSalida ? format(asistencia.horaSalida, "yyyy-MM-dd'T'HH:mm:ss'Z'") : null,
        tardanza_minutos: asistencia.tardanzaMinutos,
        horasTrabajadas
      };
    });

    const promedioHorasDiarias = diasTrabajadosNum > 0 ? horasTotales / diasTrabajadosNum : 0;

    return {
      periodo: {
        mes: mesNum,
        anio: anioNum,
        nombre: format(fecha, 'MMMM', { locale: es })
      },
      estadisticas: {
        diasTrabajados: diasTrabajadosNum,
        asistencias: asistenciasCount,
        tardanzas: tardanzasAgg._count?.id || 0,
        puntualidad: Math.round(puntualidad * 10) / 10,
        horasTotales: Math.round(horasTotales * 10) / 10,
        promedioHorasDiarias: Math.round(promedioHorasDiarias * 10) / 10
      },
      detallePorDia
    };
  }

  /**
   * Obtiene hist�rico de asistencias con filtros
   */
  async obtenerHistorico(
    docente_id: string,
    opciones: {
      fecha_inicio?: Date;
      fecha_fin?: Date;
      limit?: number;
      offset?: number;
    }
  ) {
    const {
      fecha_inicio = startOfMonth(new Date()),
      fecha_fin = endOfMonth(new Date()),
      limit = 50,
      offset = 0
    } = opciones;

    const [asistencias, total] = await Promise.all([
      // Asistencias con paginaci�n
      prisma.asistencias.findMany({
        where: {
          docenteId: docente_id,
          fecha: { gte: fecha_inicio, lte: fecha_fin }
        },
        include: {
          ubicacionEntrada: {
            select: { nombre: true }
          },
          ubicacionSalida: {
            select: { nombre: true }
          },
          justificaciones: {
            select: {
              id: true,
              motivo: true,
              estado: true
            }
          }
        },
        orderBy: { fecha: 'desc' },
        take: limit,
        skip: offset
      }),

      // Total
      prisma.asistencias.count({
        where: {
          docenteId: docente_id,
          fecha: { gte: fecha_inicio, lte: fecha_fin }
        }
      })
    ]);

    return {
      asistencia: asistencias.map((a: any) => ({
        id: a.id,
        fecha: format(a.fecha, 'dd/MM/yyyy', { locale: es }),
        hora_entrada: a.horaEntrada ? format(a.horaEntrada, 'HH:mm') : null,
        hora_salida: a.horaSalida ? format(a.horaSalida, 'HH:mm') : null,
        ubicacionEntrada: a.ubicacionEntrada?.nombre,
        ubicacionSalida: a.ubicacionSalida?.nombre,
        tardanza_minutos: a.tardanzaMinutos,
        estado: this.calcularEstadoAsistencia(a),
        justificaciones: a.justificaciones
      })),
      paginacion: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }

  /**
   * Obtiene comparativa con promedio institucional
   * ACTUALIZADO: Devuelve estructura completa que espera el frontend
   */
  async obtenerComparativa(docente_id: string) {
    const inicioMes = startOfMonth(new Date());
    const finMes = endOfMonth(new Date());

    // 🔥 Obtener mis estad�sticas completas
    const [misEstadisticas, promedioEstadisticas] = await Promise.all([
      // Mis estad�sticas
      prisma.$queryRaw<Array<{
        asistencias: bigint;
        tardanzas: bigint;
        puntualidad: number;
        horas_totales: number;
      }>>`
        SELECT 
          COUNT(*) as asistencias,
          COUNT(*) FILTER (WHERE tardanza_minutos > 0) as tardanzas,
          CASE 
            WHEN COUNT(*) > 0 THEN
              ROUND((COUNT(*) FILTER (WHERE tardanza_minutos = 0)::numeric / COUNT(*)::numeric) * 100, 2)
            ELSE 100
          END as puntualidad,
          COALESCE(SUM(
            CASE 
              WHEN hora_salida IS NOT NULL AND hora_entrada IS NOT NULL THEN
                EXTRACT(EPOCH FROM (hora_salida - hora_entrada)) / 3600
              ELSE 0
            END
          ), 0) as horas_totales
        FROM asistencias
        WHERE docente_id = ${docente_id}::uuid
        AND fecha BETWEEN ${inicioMes} AND ${finMes}
        AND hora_entrada IS NOT NULL
      `,

      // Promedio institucional
      prisma.$queryRaw<Array<{
        asistencias: number;
        tardanzas: bigint;
        puntualidad: number;
        horas_totales: number;
      }>>`
        SELECT 
          ROUND(COUNT(*)::numeric / NULLIF(COUNT(DISTINCT docente_id), 0), 2) as asistencias,
          ROUND((COUNT(*) FILTER (WHERE tardanza_minutos > 0)::numeric / NULLIF(COUNT(DISTINCT docente_id), 0)), 2) as tardanzas,
          CASE 
            WHEN COUNT(*) > 0 THEN
              ROUND((COUNT(*) FILTER (WHERE tardanza_minutos = 0)::numeric / COUNT(*)::numeric) * 100, 2)
            ELSE 100
          END as puntualidad,
          COALESCE(SUM(
            CASE 
              WHEN hora_salida IS NOT NULL AND hora_entrada IS NOT NULL THEN
                EXTRACT(EPOCH FROM (hora_salida - hora_entrada)) / 3600
              ELSE 0
            END
          ) / NULLIF(COUNT(DISTINCT docente_id), 0), 0) as horas_totales
        FROM asistencias
        WHERE fecha BETWEEN ${inicioMes} AND ${finMes}
        AND hora_entrada IS NOT NULL
      `
    ]);

    const miAsistencias = Number(misEstadisticas[0]?.asistencias || 0);
    const miTardanzas = Number(misEstadisticas[0]?.tardanzas || 0);
    const miPuntualidad = Number(misEstadisticas[0]?.puntualidad || 100);
    const miHoras = Number(misEstadisticas[0]?.horas_totales || 0);

    const promedioAsistencias = Number(promedioEstadisticas[0]?.asistencias || 0);
    const promedioTardanzas = Number(promedioEstadisticas[0]?.tardanzas || 0);
    const promedioPuntualidad = Number(promedioEstadisticas[0]?.puntualidad || 100);
    const promedioHoras = Number(promedioEstadisticas[0]?.horas_totales || 0);

    // Calcular diferencias y porcentajes
    const difAsistencias = miAsistencias - promedioAsistencias;
    const difTardanzas = miTardanzas - promedioTardanzas;
    const difPuntualidad = miPuntualidad - promedioPuntualidad;
    const difHoras = miHoras - promedioHoras;

    const pctAsistencias = promedioAsistencias > 0 ? (difAsistencias / promedioAsistencias) * 100 : 0;
    const pctTardanzas = promedioTardanzas > 0 ? (difTardanzas / promedioTardanzas) * 100 : 0;
    const pctPuntualidad = promedioPuntualidad > 0 ? (difPuntualidad / promedioPuntualidad) * 100 : 0;
    const pctHoras = promedioHoras > 0 ? (difHoras / promedioHoras) * 100 : 0;

    // Determinar posicionamiento
    let posicionamiento = 'Regular';
    if (miPuntualidad >= 95) posicionamiento = 'Sobresaliente';
    else if (miPuntualidad >= 90) posicionamiento = 'Muy Bueno';
    else if (miPuntualidad >= 80) posicionamiento = 'Bueno';
    else if (miPuntualidad < 70) posicionamiento = 'Mejorable';

    return {
      miRendimiento: {
        asistencias: miAsistencias,
        tardanzas: miTardanzas,
        puntualidad: Math.round(miPuntualidad * 10) / 10,
        horasTrabajadas: Math.round(miHoras * 10) / 10
      },
      promedioInstitucional: {
        asistencias: Math.round(promedioAsistencias * 10) / 10,
        tardanzas: Math.round(promedioTardanzas * 10) / 10,
        puntualidad: Math.round(promedioPuntualidad * 10) / 10,
        horasTrabajadas: Math.round(promedioHoras * 10) / 10
      },
      comparativa: {
        asistencias: {
          diferencia: Math.round(difAsistencias * 10) / 10,
          porcentaje: Math.round(pctAsistencias * 10) / 10
        },
        tardanzas: {
          diferencia: Math.round(difTardanzas * 10) / 10,
          porcentaje: Math.round(pctTardanzas * 10) / 10
        },
        puntualidad: {
          diferencia: Math.round(difPuntualidad * 10) / 10,
          porcentaje: Math.round(pctPuntualidad * 10) / 10
        },
        horasTrabajadas: {
          diferencia: Math.round(difHoras * 10) / 10,
          porcentaje: Math.round(pctHoras * 10) / 10
        }
      },
      posicionamiento
    };
  }
}

// Exportar instancia singleton
export const estadisticasService = new EstadisticasService();

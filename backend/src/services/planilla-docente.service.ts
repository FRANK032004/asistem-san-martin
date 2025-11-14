import prisma from '../utils/database';
import { ValidationError } from '../utils/app-error';
import { 
  ObtenerPlanillasDocenteDto, 
  PlanillaDetalleDto,
  EstadisticasPlanillaDto 
} from '../dtos/planilla.dto';

export class PlanillaDocenteService {
  /**
   * Obtener lista de planillas del docente con filtros
   */
  async obtenerMisPlanillas(
    docenteId: string,
    filters: {
      anio?: number;
      mes?: number;
      estado?: string;
    }
  ): Promise<ObtenerPlanillasDocenteDto[]> {
    try {
      const whereConditions: any = {
        usuario_id: docenteId
      };

      if (filters.anio) {
        whereConditions.anio = filters.anio;
      }

      if (filters.mes) {
        whereConditions.mes = filters.mes;
      }

      if (filters.estado && filters.estado !== 'TODOS') {
        whereConditions.estado = filters.estado;
      }

      const planillas = await prisma.planillas.findMany({
        where: whereConditions,
        include: {
          usuarios_planillas_usuario_idTousuarios: {
            select: {
              nombres: true,
              apellidos: true,
              dni: true,
              rol_id: true
            }
          }
        },
        orderBy: [
          { anio: 'desc' },
          { mes: 'desc' }
        ]
      });

      return planillas.map((planilla: any) => ({
        id: planilla.id,
        mes: planilla.mes,
        anio: planilla.anio,
        periodo: `${this.getNombreMes(planilla.mes)} ${planilla.anio}`,
        estado: planilla.estado,
        horasRegulares: Number(planilla.horas_regulares),
        horasExtras: Number(planilla.horas_extras),
        totalHoras: Number(planilla.horas_regulares) + Number(planilla.horas_extras),
        montoBase: Number(planilla.monto_base),
        bonificaciones: Number(planilla.bonificaciones),
        descuentos: Number(planilla.descuentos),
        totalNeto: Number(planilla.total_neto),
        fechaEmision: planilla.fecha_emision?.toISOString() || null,
        fechaPago: planilla.fecha_pago?.toISOString() || null,
        docente: {
          nombres: planilla.usuarios_planillas_usuario_idTousuarios.nombres,
          apellidos: planilla.usuarios_planillas_usuario_idTousuarios.apellidos,
          dni: planilla.usuarios_planillas_usuario_idTousuarios.dni
        }
      }));
    } catch (error) {
      console.error('Error al obtener planillas del docente:', error);
      throw new ValidationError('Error al obtener planillas');
    }
  }

  /**
   * Obtener detalle completo de una planilla específica
   */
  async obtenerDetallePlanilla(
    planillaId: string,
    docenteId: string
  ): Promise<PlanillaDetalleDto> {
    try {
      const planilla = await prisma.planillas.findFirst({
        where: {
          id: planillaId,
          usuario_id: docenteId
        },
        include: {
          usuarios_planillas_usuario_idTousuarios: {
            select: {
              nombres: true,
              apellidos: true,
              dni: true,
              email: true,
              docentes: {
                select: {
                  codigo_docente: true,
                  area_id: true,
                  sueldo: true,
                  estado: true,
                  areas: {
                    select: {
                      nombre: true
                    }
                  }
                }
              }
            }
          },
          detalle_planillas: {
            include: {
              asistencias: {
                select: {
                  fecha: true,
                  horaEntrada: true,
                  horaSalida: true,
                  estado: true,
                  tardanzaMinutos: true
                }
              }
            },
            orderBy: {
              fecha: 'asc'
            }
          }
        }
      });

      if (!planilla) {
        throw new ValidationError('Planilla no encontrada');
      }

      // Calcular estadísticas de asistencia
      const totalDias = planilla.detalle_planillas.length;
      const diasPresente = planilla.detalle_planillas.filter((d: any) => 
        d.asistencias?.estado === 'PRESENTE'
      ).length;
      const diasTardanza = planilla.detalle_planillas.filter((d: any) => 
        d.asistencias?.estado === 'TARDANZA'
      ).length;
      const diasAusente = planilla.detalle_planillas.filter((d: any) => 
        d.asistencias?.estado === 'AUSENTE' || d.asistencias?.estado === 'FALTA'
      ).length;

      const totalTardanzaMinutos = planilla.detalle_planillas.reduce((sum: number, d: any) => 
        sum + (d.asistencias?.tardanzaMinutos || 0), 0
      );

      return {
        id: planilla.id,
        mes: planilla.mes,
        anio: planilla.anio,
        periodo: `${this.getNombreMes(planilla.mes)} ${planilla.anio}`,
        estado: planilla.estado,
        
        // Información del docente
        docente: {
          nombres: planilla.usuarios_planillas_usuario_idTousuarios.nombres,
          apellidos: planilla.usuarios_planillas_usuario_idTousuarios.apellidos,
          dni: planilla.usuarios_planillas_usuario_idTousuarios.dni,
          email: planilla.usuarios_planillas_usuario_idTousuarios.email,
          especialidad: planilla.usuarios_planillas_usuario_idTousuarios.docentes?.[0]?.areas?.nombre || 'No especificado',
          nivelEducativo: 'No especificado',
          condicionLaboral: planilla.usuarios_planillas_usuario_idTousuarios.docentes?.[0]?.estado || 'No especificado',
          regimen: 'No especificado'
        },

        // Horas trabajadas
        horas: {
          regulares: Number(planilla.horas_regulares),
          extras: Number(planilla.horas_extras),
          total: Number(planilla.horas_regulares) + Number(planilla.horas_extras),
          valorHora: Number(planilla.monto_base) / Number(planilla.horas_regulares)
        },

        // Cálculos monetarios
        montos: {
          base: Number(planilla.monto_base),
          horasExtras: Number(planilla.horas_extras) * (Number(planilla.monto_base) / Number(planilla.horas_regulares)) * 1.5,
          bonificaciones: Number(planilla.bonificaciones),
          descuentos: Number(planilla.descuentos),
          totalBruto: Number(planilla.monto_base) + Number(planilla.bonificaciones),
          totalNeto: Number(planilla.total_neto)
        },

        // Estadísticas de asistencia
        asistencia: {
          totalDias,
          diasPresente,
          diasTardanza,
          diasAusente,
          porcentajeAsistencia: totalDias > 0 ? Math.round((diasPresente / totalDias) * 100) : 0,
          totalTardanzaMinutos,
          promedioTardanzaMinutos: diasTardanza > 0 ? Math.round(totalTardanzaMinutos / diasTardanza) : 0
        },

        // Detalle de días
        detalles: planilla.detalle_planillas.map((detalle: any) => ({
          id: detalle.id,
          fecha: detalle.fecha.toISOString().split('T')[0],
          horasTrabajadas: Number(detalle.horas_trabajadas || 0),
          horasExtras: Number(detalle.horas_extras || 0),
          estado: detalle.asistencias?.estado || 'SIN_REGISTRO',
          horaEntrada: detalle.asistencias?.horaEntrada || null,
          horaSalida: detalle.asistencias?.horaSalida || null,
          tardanzaMinutos: detalle.asistencias?.tardanzaMinutos || 0,
          observaciones: detalle.observaciones
        })),

        // Fechas administrativas
        fechaEmision: planilla.fecha_emision?.toISOString() || null,
        fechaPago: planilla.fecha_pago?.toISOString() || null,
        observaciones: planilla.observaciones
      };
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      console.error('Error al obtener detalle de planilla:', error);
      throw new ValidationError('Error al obtener detalle de planilla');
    }
  }

  /**
   * Obtener estadísticas generales de planillas del docente
   */
  async obtenerEstadisticas(docenteId: string): Promise<EstadisticasPlanillaDto> {
    try {
      const anioActual = new Date().getFullYear();
      
      // Obtener todas las planillas del año actual
      const planillasAnio = await prisma.planillas.findMany({
        where: {
          usuario_id: docenteId,
          anio: anioActual
        },
        include: {
          usuarios_planillas_usuario_idTousuarios: {
            select: {
              id: true,
              rol_id: true
            }
          }
        }
      });

      // Obtener la última planilla
      const ultimaPlanilla = await prisma.planillas.findFirst({
        where: {
          usuario_id: docenteId
        },
        include: {
          usuarios_planillas_usuario_idTousuarios: {
            select: {
              id: true,
              rol_id: true
            }
          }
        },
        orderBy: [
          { anio: 'desc' },
          { mes: 'desc' }
        ]
      });

      const totalPercibidoAnio = planillasAnio.reduce((sum: number, p: any) => sum + Number(p.total_neto), 0);
      const promedioMensual = planillasAnio.length > 0 
        ? totalPercibidoAnio / planillasAnio.length 
        : 0;

      const planillasPendientes = planillasAnio.filter((p: any) => 
        p.estado === 'PENDIENTE' || p.estado === 'EN_PROCESO'
      ).length;

      return {
        ultimaPlanilla: ultimaPlanilla ? {
          periodo: `${this.getNombreMes(ultimaPlanilla.mes)} ${ultimaPlanilla.anio}`,
          estado: ultimaPlanilla.estado,
          totalNeto: Number(ultimaPlanilla.total_neto)
        } : null,
        totalPercibidoAnio,
        promedioMensual: Math.round(promedioMensual * 100) / 100,
        planillasPendientes,
        totalPlanillasAnio: planillasAnio.length
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de planillas:', error);
      throw new ValidationError('Error al obtener estadísticas');
    }
  }

  /**
   * Verificar si el docente tiene acceso a una planilla
   */
  async verificarAcceso(planillaId: string, docenteId: string): Promise<boolean> {
    try {
      const planilla = await prisma.planillas.findFirst({
        where: {
          id: planillaId,
          usuario_id: docenteId
        },
        select: {
          id: true
        }
      });

      return !!planilla;
    } catch (error) {
      console.error('Error al verificar acceso a planilla:', error);
      return false;
    }
  }

  /**
   * Obtener años disponibles con planillas
   */
  async obtenerAniosDisponibles(docenteId: string): Promise<number[]> {
    try {
      const planillas = await prisma.planillas.findMany({
        where: {
          usuario_id: docenteId
        },
        select: {
          anio: true
        },
        distinct: ['anio'],
        orderBy: {
          anio: 'desc'
        }
      });

      return planillas.map((p: any) => p.anio);
    } catch (error) {
      console.error('Error al obtener años disponibles:', error);
      throw new ValidationError('Error al obtener años disponibles');
    }
  }

  // Utilidades
  private getNombreMes(mes: number): string {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes - 1] || 'Mes inválido';
  }
}

export default new PlanillaDocenteService();

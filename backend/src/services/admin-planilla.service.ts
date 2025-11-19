/**
 * Servicio de Planillas para Administradores
 * Lógica de negocio para gestión completa de planillas
 */

import prisma from '../utils/database';
import { ValidationError, NotFoundError } from '../utils/app-error';

export interface FiltrosPlanillas {
  anio?: number;
  mes?: number;
  estado?: string;
  docenteId?: string;
  page?: number;
  limit?: number;
}

export interface GenerarPlanillaDto {
  docenteId: string;
  mes: number;
  anio: number;
  createdBy: string;
}

export class AdminPlanillaService {
  /**
   * Obtener todas las planillas con filtros y paginación
   */
  async obtenerTodasPlanillas(filters: FiltrosPlanillas) {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const whereConditions: any = {};

      if (filters.anio) {
        whereConditions.anio = filters.anio;
      }

      if (filters.mes) {
        whereConditions.mes = filters.mes;
      }

      if (filters.estado && filters.estado !== 'TODOS') {
        whereConditions.estado = filters.estado;
      }

      if (filters.docenteId) {
        whereConditions.usuario_id = filters.docenteId;
      }

      const [planillas, total] = await Promise.all([
        prisma.planillas.findMany({
          where: whereConditions,
          include: {
            usuarios_planillas_usuario_idTousuarios: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
                dni: true,
                email: true,
                docentes: {
                  select: {
                    areas: {
                      select: {
                        nombre: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: [
            { anio: 'desc' },
            { mes: 'desc' },
            { created_at: 'desc' }
          ],
          skip,
          take: limit
        }),
        prisma.planillas.count({ where: whereConditions })
      ]);

      const planillasFormateadas = planillas.map(planilla => ({
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
        observaciones: planilla.observaciones,
        docente: {
          id: planilla.usuarios_planillas_usuario_idTousuarios.id,
          nombres: planilla.usuarios_planillas_usuario_idTousuarios.nombres,
          apellidos: planilla.usuarios_planillas_usuario_idTousuarios.apellidos,
          nombreCompleto: `${planilla.usuarios_planillas_usuario_idTousuarios.nombres} ${planilla.usuarios_planillas_usuario_idTousuarios.apellidos}`,
          dni: planilla.usuarios_planillas_usuario_idTousuarios.dni,
          email: planilla.usuarios_planillas_usuario_idTousuarios.email,
          area: planilla.usuarios_planillas_usuario_idTousuarios.docentes?.[0]?.areas?.nombre || 'N/A'
        },
        createdAt: planilla.created_at?.toISOString(),
        updatedAt: planilla.updated_at?.toISOString()
      }));

      return {
        planillas: planillasFormateadas,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error al obtener planillas:', error);
      throw new ValidationError('Error al obtener planillas');
    }
  }

  /**
   * Obtener detalle completo de una planilla
   */
  async obtenerDetallePlanilla(planillaId: string) {
    try {
      const planilla = await prisma.planillas.findUnique({
        where: { id: planillaId },
        include: {
          usuarios_planillas_usuario_idTousuarios: {
            select: {
              id: true,
              nombres: true,
              apellidos: true,
              dni: true,
              email: true,
              docentes: {
                select: {
                  codigo_docente: true,
                  fecha_ingreso: true,
                  sueldo: true,
                  estado: true,
                  areas: {
                    select: {
                      nombre: true,
                      descripcion: true
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
                  tardanzaMinutos: true,
                  horasTrabajadas: true
                }
              }
            },
            orderBy: {
              fecha: 'asc'
            }
          },
          usuarios_planillas_created_byTousuarios: {
            select: {
              nombres: true,
              apellidos: true
            }
          },
          usuarios_planillas_updated_byTousuarios: {
            select: {
              nombres: true,
              apellidos: true
            }
          }
        }
      });

      if (!planilla) {
        throw new NotFoundError('Planilla no encontrada');
      }

      const docente = planilla.usuarios_planillas_usuario_idTousuarios.docentes?.[0];

      return {
        id: planilla.id,
        mes: planilla.mes,
        anio: planilla.anio,
        periodo: `${this.getNombreMes(planilla.mes)} ${planilla.anio}`,
        estado: planilla.estado,
        docente: {
          id: planilla.usuarios_planillas_usuario_idTousuarios.id,
          nombres: planilla.usuarios_planillas_usuario_idTousuarios.nombres,
          apellidos: planilla.usuarios_planillas_usuario_idTousuarios.apellidos,
          nombreCompleto: `${planilla.usuarios_planillas_usuario_idTousuarios.nombres} ${planilla.usuarios_planillas_usuario_idTousuarios.apellidos}`,
          dni: planilla.usuarios_planillas_usuario_idTousuarios.dni,
          email: planilla.usuarios_planillas_usuario_idTousuarios.email,
          codigoDocente: docente?.codigo_docente || 'N/A',
          fechaIngreso: docente?.fecha_ingreso || null,
          sueldo: docente?.sueldo ? Number(docente.sueldo) : 0,
          estado: docente?.estado || 'N/A',
          area: docente?.areas?.nombre || 'N/A'
        },
        horas: {
          regulares: Number(planilla.horas_regulares),
          extras: Number(planilla.horas_extras),
          total: Number(planilla.horas_regulares) + Number(planilla.horas_extras)
        },
        montos: {
          base: Number(planilla.monto_base),
          bonificaciones: Number(planilla.bonificaciones),
          descuentos: Number(planilla.descuentos),
          totalNeto: Number(planilla.total_neto)
        },
        detalle: planilla.detalle_planillas.map((detalle: any) => ({
          fecha: detalle.fecha.toISOString().split('T')[0],
          horasTrabajadas: Number(detalle.horas_trabajadas),
          horasExtras: Number(detalle.horas_extras),
          tardanzaMinutos: detalle.asistencias?.tardanzaMinutos || 0,
          observaciones: detalle.observaciones,
          asistencia: detalle.asistencias ? {
            horaEntrada: detalle.asistencias.horaEntrada?.toISOString(),
            horaSalida: detalle.asistencias.horaSalida?.toISOString(),
            estado: detalle.asistencias.estado
          } : null
        })),
        fechaEmision: planilla.fecha_emision?.toISOString() || null,
        fechaPago: planilla.fecha_pago?.toISOString() || null,
        observaciones: planilla.observaciones,
        auditoria: {
          creadoPor: planilla.usuarios_planillas_created_byTousuarios ? 
            `${planilla.usuarios_planillas_created_byTousuarios.nombres} ${planilla.usuarios_planillas_created_byTousuarios.apellidos}` : 
            'Sistema',
          actualizadoPor: planilla.usuarios_planillas_updated_byTousuarios ? 
            `${planilla.usuarios_planillas_updated_byTousuarios.nombres} ${planilla.usuarios_planillas_updated_byTousuarios.apellidos}` : 
            null,
          createdAt: planilla.created_at?.toISOString(),
          updatedAt: planilla.updated_at?.toISOString()
        }
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      console.error('Error al obtener detalle de planilla:', error);
      throw new ValidationError('Error al obtener detalle de planilla');
    }
  }

  /**
   * Generar planilla para un docente en un período
   */
  async generarPlanilla(data: GenerarPlanillaDto) {
    try {
      // Verificar si ya existe planilla para ese período
      const existente = await prisma.planillas.findFirst({
        where: {
          usuario_id: data.docenteId,
          mes: data.mes,
          anio: data.anio
        }
      });

      if (existente) {
        throw new ValidationError('Ya existe una planilla para este período');
      }

      // Verificar que el usuario sea docente
      const docente = await prisma.docentes.findFirst({
        where: { usuario_id: data.docenteId }
      });

      if (!docente) {
        throw new ValidationError('El usuario no es un docente');
      }

      // Calcular fechas del período
      const fechaInicio = new Date(data.anio, data.mes - 1, 1);
      const fechaFin = new Date(data.anio, data.mes, 0, 23, 59, 59);

      // Obtener asistencias del período
      const asistencias = await prisma.asistencias.findMany({
        where: {
          docenteId: data.docenteId,
          fecha: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      });

      // Calcular totales
      let horasRegulares = 0;
      let horasExtras = 0;
      let tardanzasTotales = 0;

      asistencias.forEach(asistencia => {
        const horas = Number(asistencia.horasTrabajadas || 0);
        const horasNormales = Math.min(horas, 8); // Máximo 8 horas regulares
        const extras = Math.max(horas - 8, 0);

        horasRegulares += horasNormales;
        horasExtras += extras;
        tardanzasTotales += asistencia.tardanzaMinutos || 0;
      });

      // Calcular montos (valores de ejemplo, ajustar según lógica de negocio)
      const tarifaHora = 25; // S/ por hora (debe venir de contrato del docente)
      const montoBase = horasRegulares * tarifaHora;
      const montoExtras = horasExtras * tarifaHora * 1.5;
      const descuentoTardanzas = (tardanzasTotales / 60) * tarifaHora * 0.5;

      const totalNeto = montoBase + montoExtras - descuentoTardanzas;

      // Crear planilla
      const planilla = await prisma.planillas.create({
        data: {
          usuario_id: data.docenteId,
          mes: data.mes,
          anio: data.anio,
          estado: 'PENDIENTE',
          horas_regulares: horasRegulares,
          horas_extras: horasExtras,
          monto_base: montoBase,
          bonificaciones: montoExtras,
          descuentos: descuentoTardanzas,
          total_neto: totalNeto,
          fecha_emision: new Date(),
          created_by: data.createdBy
        },
        include: {
          usuarios_planillas_usuario_idTousuarios: {
            select: {
              nombres: true,
              apellidos: true,
              dni: true
            }
          }
        }
      });

      // Crear detalles de planilla por cada día con asistencia
      const detallesData = asistencias.map(asistencia => ({
        planilla_id: planilla.id,
        asistencia_id: asistencia.id,
        fecha: asistencia.fecha,
        horas_trabajadas: Number(asistencia.horasTrabajadas || 0),
        horas_extras: Math.max(Number(asistencia.horasTrabajadas || 0) - 8, 0),
        tardanza_minutos: asistencia.tardanzaMinutos || 0,
        observaciones: asistencia.observaciones
      }));

      if (detallesData.length > 0) {
        await prisma.detalle_planillas.createMany({
          data: detallesData
        });
      }

      return {
        id: planilla.id,
        mes: planilla.mes,
        anio: planilla.anio,
        periodo: `${this.getNombreMes(planilla.mes)} ${planilla.anio}`,
        estado: planilla.estado,
        totalNeto: Number(planilla.total_neto),
        docente: {
          nombres: planilla.usuarios_planillas_usuario_idTousuarios.nombres,
          apellidos: planilla.usuarios_planillas_usuario_idTousuarios.apellidos,
          dni: planilla.usuarios_planillas_usuario_idTousuarios.dni
        }
      };
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      console.error('Error al generar planilla:', error);
      throw new ValidationError('Error al generar planilla');
    }
  }

  /**
   * Actualizar estado de planilla
   */
  async actualizarEstado(planillaId: string, estado: string, adminId: string, observaciones?: string) {
    try {
      const estadosValidos = ['PENDIENTE', 'EN_PROCESO', 'PAGADO', 'ANULADO'];
      if (!estadosValidos.includes(estado)) {
        throw new ValidationError('Estado inválido');
      }

      const updateData: any = {
        estado,
        updated_by: adminId,
        updated_at: new Date()
      };

      if (observaciones) {
        updateData.observaciones = observaciones;
      }

      if (estado === 'PAGADO') {
        updateData.fecha_pago = new Date();
      }

      const planilla = await prisma.planillas.update({
        where: { id: planillaId },
        data: updateData
      });

      return {
        id: planilla.id,
        estado: planilla.estado,
        fechaPago: planilla.fecha_pago?.toISOString()
      };
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      throw new ValidationError('Error al actualizar estado de planilla');
    }
  }

  /**
   * Actualizar datos de planilla
   */
  async actualizarPlanilla(planillaId: string, data: any, adminId: string) {
    try {
      const updateData: any = {
        updated_by: adminId,
        updated_at: new Date()
      };

      if (data.montoBase !== undefined) updateData.monto_base = data.montoBase;
      if (data.bonificaciones !== undefined) updateData.bonificaciones = data.bonificaciones;
      if (data.descuentos !== undefined) updateData.descuentos = data.descuentos;
      if (data.observaciones !== undefined) updateData.observaciones = data.observaciones;

      // Recalcular total neto
      if (data.montoBase !== undefined || data.bonificaciones !== undefined || data.descuentos !== undefined) {
        const planillaActual = await prisma.planillas.findUnique({
          where: { id: planillaId }
        });

        if (planillaActual) {
          const base = data.montoBase !== undefined ? data.montoBase : Number(planillaActual.monto_base);
          const bonif = data.bonificaciones !== undefined ? data.bonificaciones : Number(planillaActual.bonificaciones);
          const desc = data.descuentos !== undefined ? data.descuentos : Number(planillaActual.descuentos);
          
          updateData.total_neto = base + bonif - desc;
        }
      }

      const planilla = await prisma.planillas.update({
        where: { id: planillaId },
        data: updateData
      });

      return {
        id: planilla.id,
        totalNeto: Number(planilla.total_neto)
      };
    } catch (error) {
      console.error('Error al actualizar planilla:', error);
      throw new ValidationError('Error al actualizar planilla');
    }
  }

  /**
   * Eliminar/anular planilla
   */
  async eliminarPlanilla(planillaId: string, adminId: string) {
    try {
      // Marcar como anulada en lugar de eliminar físicamente
      await prisma.planillas.update({
        where: { id: planillaId },
        data: {
          estado: 'ANULADO',
          updated_by: adminId,
          updated_at: new Date()
        }
      });

      return true;
    } catch (error) {
      console.error('Error al anular planilla:', error);
      throw new ValidationError('Error al anular planilla');
    }
  }

  /**
   * Obtener estadísticas generales
   */
  async obtenerEstadisticasGenerales(filtros: { anio?: number; mes?: number }) {
    try {
      const whereConditions: any = {};
      
      if (filtros.anio) whereConditions.anio = filtros.anio;
      if (filtros.mes) whereConditions.mes = filtros.mes;

      const [total, pendientes, enProceso, pagadas, anuladas, sumaTotales] = await Promise.all([
        prisma.planillas.count({ where: whereConditions }),
        prisma.planillas.count({ where: { ...whereConditions, estado: 'PENDIENTE' } }),
        prisma.planillas.count({ where: { ...whereConditions, estado: 'EN_PROCESO' } }),
        prisma.planillas.count({ where: { ...whereConditions, estado: 'PAGADO' } }),
        prisma.planillas.count({ where: { ...whereConditions, estado: 'ANULADO' } }),
        prisma.planillas.aggregate({
          where: { ...whereConditions, estado: { not: 'ANULADO' } },
          _sum: {
            total_neto: true,
            horas_regulares: true,
            horas_extras: true
          }
        })
      ]);

      return {
        total,
        porEstado: {
          pendientes,
          enProceso,
          pagadas,
          anuladas
        },
        totales: {
          montoTotal: Number(sumaTotales._sum.total_neto || 0),
          horasRegulares: Number(sumaTotales._sum.horas_regulares || 0),
          horasExtras: Number(sumaTotales._sum.horas_extras || 0)
        }
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw new ValidationError('Error al obtener estadísticas');
    }
  }

  /**
   * Obtener lista de docentes con planillas
   */
  async obtenerDocentesConPlanillas() {
    try {
      const docentes = await prisma.usuarios.findMany({
        where: {
          docentes: {
            some: {}
          }
        },
        select: {
          id: true,
          nombres: true,
          apellidos: true,
          dni: true,
          email: true,
          docentes: {
            select: {
              codigo_docente: true,
              areas: {
                select: {
                  nombre: true
                }
              }
            }
          },
          _count: {
            select: {
              planillas_planillas_usuario_idTousuarios: true
            }
          }
        },
        orderBy: {
          apellidos: 'asc'
        }
      });

      return docentes.map(doc => ({
        id: doc.id,
        nombreCompleto: `${doc.nombres} ${doc.apellidos}`,
        dni: doc.dni,
        email: doc.email,
        codigoDocente: doc.docentes[0]?.codigo_docente || 'N/A',
        area: doc.docentes[0]?.areas?.nombre || 'N/A',
        totalPlanillas: doc._count.planillas_planillas_usuario_idTousuarios
      }));
    } catch (error) {
      console.error('Error al obtener docentes:', error);
      throw new ValidationError('Error al obtener docentes');
    }
  }

  /**
   * Generar planillas masivas
   */
  async generarPlanillasMasivo(data: { mes: number; anio: number; docenteIds: string[]; createdBy: string }) {
    try {
      const resultados = {
        exitosos: [] as any[],
        errores: [] as any[]
      };

      for (const docenteId of data.docenteIds) {
        try {
          const planilla = await this.generarPlanilla({
            docenteId,
            mes: data.mes,
            anio: data.anio,
            createdBy: data.createdBy
          });
          resultados.exitosos.push(planilla);
        } catch (error: any) {
          resultados.errores.push({
            docenteId,
            error: error.message
          });
        }
      }

      return resultados;
    } catch (error) {
      console.error('Error en generación masiva:', error);
      throw new ValidationError('Error al generar planillas masivas');
    }
  }

  /**
   * Utilidad: Obtener nombre del mes
   */
  private getNombreMes(mes: number): string {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes - 1] || 'Desconocido';
  }
}

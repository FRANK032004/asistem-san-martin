/**
 * 🎯 SERVICE LAYER: JUSTIFICACIONES DOCENTE
 * 
 * Responsabilidades:
 * - Crear justificaciones para ausencias/tardanzas
 * - Listar justificaciones propias con filtros
 * - Validar solapamientos de fechas
 * - Validar ownership de asistencias
 * - Upload y gestión de evidencias (certificados médicos)
 * 
 * Arquitectura:
 * - Service Layer Pattern
 * - Transacciones ACID con Prisma
 * - Validaciones robustas
 * - Error handling completo
 * 
 * @module JustificacionService
 */

import prisma from '../../../shared/utils/database';
import { 
  ValidationError, 
  NotFoundError, 
  AuthorizationError,
  BusinessLogicError 
} from '../../../shared/utils/app-error';
import { startOfDay, endOfDay, parseISO, isWithinInterval, differenceInDays } from 'date-fns';

// ========================================
// INTERFACES Y TIPOS
// ========================================

export interface CrearJustificacionInput {
  asistenciaId?: string;          // ID de asistencia específica (opcional)
  fechaInicio: string;             // YYYY-MM-DD
  fechaFin: string;                // YYYY-MM-DD
  tipo: 'MEDICA' | 'PERSONAL' | 'FAMILIAR' | 'CAPACITACION' | 'OTRO';
  motivo: string;
  evidenciaUrl?: string;           // URL del archivo subido (S3 o local)
  afectaPago?: boolean;            // Si afecta al sueldo (default: false)
}

export interface FiltrosJustificacion {
  estado?: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  tipo?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
}

export interface ActualizarJustificacionInput {
  tipo?: 'MEDICA' | 'PERSONAL' | 'FAMILIAR' | 'CAPACITACION' | 'OTRO';
  motivo?: string;
  evidenciaUrl?: string;
}

// ========================================
// SERVICE PRINCIPAL
// ========================================

class JustificacionService {

  /**
   * 📝 CREAR NUEVA JUSTIFICACIÓN
   * 
   * Validaciones:
   * 1. Fechas válidas (inicio <= fin)
   * 2. No solapar con otras justificaciones
   * 3. Rango máximo 30 días
   * 4. Asistencia existe y pertenece al docente (si se proporciona)
   * 5. Asistencia no tiene justificación previa
   * 6. Motivo mínimo 20 caracteres
   * 
   * @param docente_id - UUID del docente
   * @param data - Datos de la justificación
   * @returns Justificación creada con relaciones
   */
  async crearJustificacion(docente_id: string, data: CrearJustificacionInput) {
    // 🔹 1. Validar fechas
    const fechaInicio = parseISO(data.fechaInicio);
    const fechaFin = parseISO(data.fechaFin);

    if (fechaInicio > fechaFin) {
      throw new ValidationError('La fecha de inicio no puede ser posterior a la fecha fin');
    }

    // 🔹 2. Validar rango máximo (30 días)
    const diasDiferencia = differenceInDays(fechaFin, fechaInicio);
    if (diasDiferencia > 30) {
      throw new ValidationError('El rango de justificación no puede exceder 30 días');
    }

    // 🔹 3. Validar motivo
    if (data.motivo.trim().length < 20) {
      throw new ValidationError('El motivo debe tener al menos 20 caracteres');
    }

    // 🔹 4. Validar asistencia (si se proporciona)
    if (data.asistenciaId) {
      const asistencia = await prisma.asistencias.findUnique({
        where: { id: data.asistenciaId },
        select: { 
          id: true, 
          docenteId: true, 
          fecha: true,
          estado: true
        }
      });

      if (!asistencia) {
        throw new NotFoundError('Asistencia no encontrada');
      }

      if (asistencia.docenteId !== docente_id) {
        throw new AuthorizationError('No tienes permiso para justificar esta asistencia');
      }

      // Validar que no tenga justificación previa
      const justificacionExistente = await prisma.justificaciones.findFirst({
        where: { asistencia_id: data.asistenciaId },
        select: { id: true, estado: true }
      });

      if (justificacionExistente) {
        throw new BusinessLogicError(
          `Esta asistencia ya tiene una justificación ${justificacionExistente.estado?.toLowerCase() || 'registrada'}`
        );
      }
    }

    // 🔹 5. Validar no solapamiento con otras justificaciones
    const solapamiento = await this.validarSolapamiento(docente_id, fechaInicio, fechaFin);
    if (solapamiento) {
      throw new BusinessLogicError(
        `Ya existe una justificación en el periodo ${solapamiento.fecha_inicio.toLocaleDateString()} - ${solapamiento.fecha_fin.toLocaleDateString()}`
      );
    }

    // 🔹 6. Crear justificación
    const justificacion = await prisma.justificaciones.create({
      data: {
        docente_id: docente_id,
        asistencia_id: data.asistenciaId || null,
        fecha_inicio: startOfDay(fechaInicio),
        fecha_fin: endOfDay(fechaFin),
        tipo: data.tipo,
        motivo: data.motivo.trim(),
        documento_adjunto: data.evidenciaUrl || null,
        estado: 'pendiente',
        afecta_pago: data.afectaPago !== undefined ? data.afectaPago : false,
        prioridad: data.tipo === 'MEDICA' ? 'alta' : 'normal',
        horas_afectadas: null, // Se calcula al aprobar
        porcentaje_descuento: 0
      },
      include: {
        asistencias: {
          select: {
            id: true,
            fecha: true,
            horaEntrada: true,
            horaSalida: true,
            estado: true,
            tardanzaMinutos: true
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

    return {
      id: justificacion.id,
      asistenciaId: justificacion.asistencia_id,
      fechaInicio: justificacion.fecha_inicio,
      fechaFin: justificacion.fecha_fin,
      tipo: justificacion.tipo,
      motivo: justificacion.motivo,
      evidenciaUrl: justificacion.documento_adjunto,
      estado: justificacion.estado,
      prioridad: justificacion.prioridad,
      afectaPago: justificacion.afecta_pago,
      createdAt: justificacion.created_at,
      updatedAt: justificacion.updated_at,
      // Relaciones
      asistencia: justificacion.asistencias ? {
        id: justificacion.asistencias.id,
        fecha: justificacion.asistencias.fecha,
        hora_entrada: justificacion.asistencias.horaEntrada,
        hora_salida: justificacion.asistencias.horaSalida,
        estado: justificacion.asistencias.estado,
        tardanza_minutos: justificacion.asistencias.tardanzaMinutos
      } : null,
      docente: {
        id: justificacion.docentes.id,
        codigoDocente: justificacion.docentes.codigo_docente,
        nombreCompleto: `${justificacion.docentes.usuarios.nombres} ${justificacion.docentes.usuarios.apellidos}`,
        email: justificacion.docentes.usuarios.email
      }
    };
  }

  /**
   * 📋 OBTENER MIS JUSTIFICACIONES CON FILTROS
   * 
   * Filtros disponibles:
   * - estado: PENDIENTE | APROBADO | RECHAZADO
   * - tipo: MEDICA | PERSONAL | etc.
   * - fechaDesde / fechaHasta: Rango de fechas
   * - page / limit: Paginación
   * 
   * @param docente_id - UUID del docente
   * @param filtros - Filtros opcionales
   * @returns Lista paginada de justificaciones
   */
  async obtenerMisJustificaciones(docente_id: string, filtros: FiltrosJustificacion = {}) {
    const { estado, tipo, fechaDesde, fechaHasta, page = 1, limit = 50 } = filtros;

    // Construir WHERE dinámico
    const where: any = {
      docente_id: docente_id
    };

    if (estado) {
      where.estado = estado.toLowerCase();
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (fechaDesde || fechaHasta) {
      where.fecha_inicio = {};
      if (fechaDesde) {
        where.fecha_inicio.gte = startOfDay(parseISO(fechaDesde));
      }
      if (fechaHasta) {
        where.fecha_inicio.lte = endOfDay(parseISO(fechaHasta));
      }
    }

    // Ejecutar queries en paralelo
    const [justificaciones, total] = await Promise.all([
      prisma.justificaciones.findMany({
        where,
        include: {
          asistencias: {
            select: {
              id: true,
              fecha: true,
              horaEntrada: true,
              horaSalida: true,
              estado: true,
              tardanzaMinutos: true
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
        orderBy: [
          { estado: 'asc' }, // Pendientes primero
          { created_at: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.justificaciones.count({ where })
    ]);

    return {
      data: justificaciones.map((j: any) => ({
        id: j.id,
        asistenciaId: j.asistencia_id,
        fechaInicio: j.fecha_inicio,
        fechaFin: j.fecha_fin,
        tipo: j.tipo,
        motivo: j.motivo,
        evidenciaUrl: j.documento_adjunto,
        estado: j.estado,
        prioridad: j.prioridad,
        afectaPago: j.afecta_pago,
        horasAfectadas: j.horas_afectadas ? Number(j.horas_afectadas) : null,
        porcentajeDescuento: j.porcentaje_descuento ? Number(j.porcentaje_descuento) : 0,
        observacionesAdmin: j.observaciones_admin,
        fechaAprobacion: j.fecha_aprobacion,
        createdAt: j.created_at,
        updatedAt: j.updated_at,
        // Relaciones
        asistencia: j.asistencias ? {
          id: j.asistencias.id,
          fecha: j.asistencias.fecha,
          hora_entrada: j.asistencias.horaEntrada,
          hora_salida: j.asistencias.horaSalida,
          estado: j.asistencias.estado,
          tardanza_minutos: j.asistencias.tardanzaMinutos
        } : null,
        aprobadoPor: j.usuarios ? {
          nombreCompleto: `${j.usuarios.nombres} ${j.usuarios.apellidos}`,
          email: j.usuarios.email
        } : null
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 🔍 OBTENER JUSTIFICACIÓN POR ID
   * 
   * Validaciones:
   * - Justificación existe
   * - Pertenece al docente (ownership)
   * 
   * @param justificacionId - UUID de la justificación
   * @param docente_id - UUID del docente (para validar ownership)
   * @returns Justificación con todos los detalles
   */
  async obtenerJustificacionPorId(justificacionId: string, docente_id: string) {
    const justificacion = await prisma.justificaciones.findUnique({
      where: { id: justificacionId },
      include: {
        asistencias: {
          select: {
            id: true,
            fecha: true,
            horaEntrada: true,
            horaSalida: true,
            estado: true,
            tardanzaMinutos: true,
            observaciones: true
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

    if (!justificacion) {
      throw new NotFoundError('Justificación no encontrada');
    }

    // Validar ownership
    if (justificacion.docente_id !== docente_id) {
      throw new AuthorizationError('No tienes permiso para ver esta justificación');
    }

    return {
      id: justificacion.id,
      asistenciaId: justificacion.asistencia_id,
      fechaInicio: justificacion.fecha_inicio,
      fechaFin: justificacion.fecha_fin,
      tipo: justificacion.tipo,
      motivo: justificacion.motivo,
      evidenciaUrl: justificacion.documento_adjunto,
      estado: justificacion.estado,
      prioridad: justificacion.prioridad,
      afectaPago: justificacion.afecta_pago,
      horasAfectadas: justificacion.horas_afectadas ? Number(justificacion.horas_afectadas) : null,
      porcentajeDescuento: justificacion.porcentaje_descuento ? Number(justificacion.porcentaje_descuento) : 0,
      observacionesAdmin: justificacion.observaciones_admin,
      fechaAprobacion: justificacion.fecha_aprobacion,
      createdAt: justificacion.created_at,
      updatedAt: justificacion.updated_at,
      // Relaciones completas
      asistencia: justificacion.asistencias ? {
        id: justificacion.asistencias.id,
        fecha: justificacion.asistencias.fecha,
        hora_entrada: justificacion.asistencias.horaEntrada,
        hora_salida: justificacion.asistencias.horaSalida,
        estado: justificacion.asistencias.estado,
        tardanza_minutos: justificacion.asistencias.tardanzaMinutos,
        observaciones: justificacion.asistencias.observaciones
      } : null,
      docente: {
        id: justificacion.docentes.id,
        codigoDocente: justificacion.docentes.codigo_docente,
        nombreCompleto: `${justificacion.docentes.usuarios.nombres} ${justificacion.docentes.usuarios.apellidos}`,
        email: justificacion.docentes.usuarios.email
      },
      aprobadoPor: justificacion.usuarios ? {
        nombreCompleto: `${justificacion.usuarios.nombres} ${justificacion.usuarios.apellidos}`,
        email: justificacion.usuarios.email
      } : null
    };
  }

  /**
   * ✏️ ACTUALIZAR JUSTIFICACIÓN (Solo si PENDIENTE)
   * 
   * Validaciones:
   * - Justificación existe
   * - Pertenece al docente
   * - Estado PENDIENTE (no se puede editar si ya fue revisada)
   * 
   * @param justificacionId - UUID de la justificación
   * @param docente_id - UUID del docente
   * @param data - Datos a actualizar
   * @returns Justificación actualizada
   */
  async actualizarJustificacion(
    justificacionId: string, 
    docente_id: string, 
    data: ActualizarJustificacionInput
  ) {
    // Validar que existe y pertenece al docente
    const justificacion = await prisma.justificaciones.findUnique({
      where: { id: justificacionId },
      select: { id: true, docente_id: true, estado: true }
    });

    if (!justificacion) {
      throw new NotFoundError('Justificación no encontrada');
    }

    if (justificacion.docente_id !== docente_id) {
      throw new AuthorizationError('No tienes permiso para editar esta justificación');
    }

    if (justificacion.estado !== 'pendiente') {
      throw new BusinessLogicError('No puedes editar una justificación que ya fue revisada');
    }

    // Validar motivo si se actualiza
    if (data.motivo && data.motivo.trim().length < 20) {
      throw new ValidationError('El motivo debe tener al menos 20 caracteres');
    }

    // Actualizar solo campos permitidos
    const updated = await prisma.justificaciones.update({
      where: { id: justificacionId },
      data: {
        ...(data.tipo && { tipo: data.tipo }),
        ...(data.motivo && { motivo: data.motivo.trim() }),
        ...(data.evidenciaUrl && { documento_adjunto: data.evidenciaUrl }),
        updated_at: new Date()
      },
      include: {
        asistencias: true,
        docentes: {
          include: {
            usuarios: true
          }
        }
      }
    });

    return {
      id: updated.id,
      tipo: updated.tipo,
      motivo: updated.motivo,
      evidenciaUrl: updated.documento_adjunto,
      updatedAt: updated.updated_at
    };
  }

  /**
   * 🗑️ ELIMINAR JUSTIFICACIÓN (Solo si PENDIENTE)
   * 
   * Validaciones:
   * - Justificación existe
   * - Pertenece al docente
   * - Estado PENDIENTE
   * 
   * @param justificacionId - UUID de la justificación
   * @param docente_id - UUID del docente
   */
  async eliminarJustificacion(justificacionId: string, docente_id: string) {
    const justificacion = await prisma.justificaciones.findUnique({
      where: { id: justificacionId },
      select: { id: true, docente_id: true, estado: true }
    });

    if (!justificacion) {
      throw new NotFoundError('Justificación no encontrada');
    }

    if (justificacion.docente_id !== docente_id) {
      throw new AuthorizationError('No tienes permiso para eliminar esta justificación');
    }

    if (justificacion.estado !== 'pendiente') {
      throw new BusinessLogicError('No puedes eliminar una justificación que ya fue revisada');
    }

    await prisma.justificaciones.delete({
      where: { id: justificacionId }
    });

    return { success: true, message: 'Justificación eliminada correctamente' };
  }

  /**
   * 📊 OBTENER ESTADÍSTICAS DE JUSTIFICACIONES
   * 
   * @param docente_id - UUID del docente
   * @returns Resumen de justificaciones por estado
   */
  async obtenerEstadisticas(docente_id: string) {
    const [total, pendientes, aprobadas, rechazadas] = await Promise.all([
      prisma.justificaciones.count({
        where: { docente_id: docente_id }
      }),
      prisma.justificaciones.count({
        where: { docente_id: docente_id, estado: 'pendiente' }
      }),
      prisma.justificaciones.count({
        where: { docente_id: docente_id, estado: 'aprobada' }
      }),
      prisma.justificaciones.count({
        where: { docente_id: docente_id, estado: 'rechazada' }
      })
    ]);

    return {
      total,
      pendientes,
      aprobadas,
      rechazadas,
      tasaAprobacion: total > 0 ? ((aprobadas / total) * 100).toFixed(1) : '0.0'
    };
  }

  // ========================================
  // MÉTODOS PRIVADOS DE VALIDACIÓN
  // ========================================

  /**
   * Validar que no haya solapamiento de fechas con otras justificaciones
   */
  private async validarSolapamiento(
    docente_id: string, 
    fechaInicio: Date, 
    fechaFin: Date,
    excludeId?: string
  ) {
    const justificaciones = await prisma.justificaciones.findMany({
      where: {
        docente_id: docente_id,
        estado: {
          in: ['pendiente', 'aprobada'] // Ignorar rechazadas
        },
        ...(excludeId && { NOT: { id: excludeId } })
      },
      select: {
        id: true,
        fecha_inicio: true,
        fecha_fin: true
      }
    });

    // Verificar solapamiento
    for (const j of justificaciones) {
      const overlap = (
        isWithinInterval(fechaInicio, { start: j.fecha_inicio, end: j.fecha_fin }) ||
        isWithinInterval(fechaFin, { start: j.fecha_inicio, end: j.fecha_fin }) ||
        isWithinInterval(j.fecha_inicio, { start: fechaInicio, end: fechaFin }) ||
        isWithinInterval(j.fecha_fin, { start: fechaInicio, end: fechaFin })
      );

      if (overlap) {
        return j;
      }
    }

    return null;
  }
}

export default new JustificacionService();

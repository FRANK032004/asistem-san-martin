/**
 * @fileoverview Servicio Principal Docente - Nivel Senior
 * @description Lógica de negocio para operaciones generales del docentes:
 * - Gestión de perfil
 * - Información de horarios
 * - Integración con otros servicios
 */

import prisma from '../../../utils/database';
import { NotFoundError } from '../../../utils/app-error';
import { logger } from '../../../utils/logger';

export class DocenteService {
  /**
   * Obtiene el perfil completo del docente
   */
  async obtenerPerfil(docente_id: string) {
    const docente = await prisma.docentes.findUnique({
      where: { id: docente_id },
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

    return {
      id: docente.id,
      codigo_docente: docente.codigo_docente,
      fecha_ingreso: docente.fecha_ingreso,
      direccion: docente.direccion,
      contacto_emergencia: docente.contacto_emergencia,
      telefono_emergencia: docente.telefono_emergencia,
      usuario: docente.usuarios,
      area: docente.areas,
      estadisticas: {
        totalAsistencias: docente._count?.asistencias || 0,
        totalHorarios: docente._count?.horarios_base || 0
      }
    };
  }

  /**
   * Actualiza el perfil del docente
   */
  async actualizarPerfil(
    docente_id: string,
    datos: {
      telefono?: string;
      email?: string;
      direccion?: string;
      contacto_emergencia?: string;
      telefono_emergencia?: string;
    }
  ) {
    // Validar que el docente existe
    const docente = await prisma.docentes.findUnique({
      where: { id: docente_id },
      include: { usuarios: true }
    });

    if (!docente) {
      throw new NotFoundError('Docente');
    }

    // Actualizar en transacción
    return await prisma.$transaction(async (tx: any) => {
      // Actualizar usuario si hay datos de contacto
      if (datos.telefono || datos.email) {
        await tx.usuarios.update({
          where: { id: docente.usuario_id },
          data: {
            ...(datos.telefono && { telefono: datos.telefono }),
            ...(datos.email && { email: datos.email })
          }
        });
      }

      // Actualizar docente
      if (datos.direccion || datos.contacto_emergencia || datos.telefono_emergencia) {
        await tx.docentes.update({
          where: { id: docente_id },
          data: {
            ...(datos.direccion && { direccion: datos.direccion }),
            ...(datos.contacto_emergencia && { contacto_emergencia: datos.contacto_emergencia }),
            ...(datos.telefono_emergencia && { telefono_emergencia: datos.telefono_emergencia })
          }
        });
      }

      // Log de auditoría
      logger.info('Perfil docente actualizado', {
        modulo: 'docente',
        accion: 'actualizar_perfil',
        docente_id,
        cambios: datos
      });

      // Retornar perfil actualizado
      return await this.obtenerPerfil(docente_id);
    });
  }

  /**
   * Obtiene todos los horarios del docente
   */
  async obtenerHorarios(docente_id: string) {
    const horarios = await prisma.horarios_base.findMany({
      where: {
        docente_id,
        activo: true
      },
      include: {
        areas: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: [
        { dia_semana: 'asc' },
        { hora_inicio: 'asc' }
      ]
    });

    // Agrupar por día de la semana
    const horariosPorDia: { [key: string]: any[] } = {};

    for (const horario of horarios) {
      const dia = String(horario.dia_semana);
      if (!horariosPorDia[dia]) {
        horariosPorDia[dia] = [];
      }
      horariosPorDia[dia].push({
        id: horario.id,
        hora_inicio: horario.hora_inicio,
        hora_fin: horario.hora_fin,
        area: horario.areas.nombre
      });
    }

    return {
      horarios,
      horariosPorDia,
      total: horarios.length
    };
  }

  /**
   * Verifica si el docente existe y está activo
   */
  async verificarExistenciaYEstado(docente_id: string): Promise<boolean> {
    const docente = await prisma.docentes.findUnique({
      where: { id: docente_id },
      include: {
        usuarios: {
          select: { activo: true }
        }
      }
    });

    return docente !== null && (docente.usuarios.activo === true);
  }

  /**
   * Obtiene información básica del docente para displays
   */
  async obtenerInformacionBasica(docente_id: string) {
    const docente = await prisma.docentes.findUnique({
      where: { id: docente_id },
      select: {
        id: true,
        codigo_docente: true,
        fecha_ingreso: true,
        usuarios: {
          select: {
            nombres: true,
            apellidos: true,
            email: true
          }
        },
        areas: {
          select: {
            nombre: true
          }
        }
      }
    });

    if (!docente) {
      throw new NotFoundError('Docente');
    }

    return {
      id: docente.id,
      codigo_docente: docente.codigo_docente,
      nombreCompleto: `${docente.usuarios.nombres} ${docente.usuarios.apellidos}`,
      email: docente.usuarios.email,
      area: docente.areas?.nombre
    };
  }
}

// Exportar instancia singleton
export const docenteService = new DocenteService();

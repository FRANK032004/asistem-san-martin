/**
 * @fileoverview Validador de Horarios - Nivel Senior
 * @description Validación de horarios de entrada/salida:
 * - Verifica horarios asignados al docente
 * - Calcula si hay tardanza
 * - Valida días laborables
 * - Maneja tolerancias
 */

import prisma from '../../../utils/database';
import { getDay, addMinutes, differenceInMinutes } from 'date-fns';

export interface ValidacionHorario {
  esHorarioLaboral: boolean;
  horarioEsperado?: {
    hora_inicio: string;
    hora_fin: string;
    areas: string;
  };
  tardanza: {
    esTardanza: boolean;
    minutos: number;
  };
  mensaje: string;
}

export class HorarioValidator {
  private readonly TOLERANCIA_MINUTOS = 15; // 15 minutos de tolerancia

  /**
   * Valida el horario de entrada del docente
   */
  async validarHorarioEntrada(
    docenteId: string,
    fechaHora: Date = new Date()
  ): Promise<ValidacionHorario> {
    // 1. Obtener día de la semana (0=Domingo, 1=Lunes, etc.)
    const dia_semana = getDay(fechaHora);

    // 2. Buscar horario asignado para este día
    const horario = await this.obtenerHorarioDelDia(docenteId, dia_semana);

    // 3. Si no hay horario asignado
    if (!horario) {
      return {
        esHorarioLaboral: false,
        tardanza: {
          esTardanza: false,
          minutos: 0
        },
        mensaje: `No tienes horario asignado para hoy.`
      };
    }

    // 4. Calcular tardanza (convertir Date a string HH:mm)
    const horaInicioStr = this.formatearHora(horario.hora_inicio);
    const tardanza = this.calcularTardanza(fechaHora, horaInicioStr);

    // 5. Generar mensaje descriptivo
    const mensaje = this.generarMensajeEntrada(horario, tardanza);

    return {
      esHorarioLaboral: true,
      horarioEsperado: {
        hora_inicio: horaInicioStr,
        hora_fin: this.formatearHora(horario.hora_fin),
        areas: horario.areas?.nombre || 'Sin área'
      },
      tardanza,
      mensaje
    };
  }

  /**
   * Formatea Date a HH:mm
   */
  private formatearHora(fecha: Date): string {
    const horas = fecha.getHours().toString().padStart(2, '0');
    const minutos = fecha.getMinutes().toString().padStart(2, '0');
    return `${horas}:${minutos}`;
  }

  /**
   * Valida el horario de salida del docente
   */
  async validarHorarioSalida(
    docenteId: string,
    fechaHora: Date = new Date()
  ): Promise<ValidacionHorario> {
    // 1. Obtener día de la semana (0=Domingo, 1=Lunes, etc.)
    const dia_semana = getDay(fechaHora);

    // 2. Buscar horario asignado
    const horario: any = await this.obtenerHorarioDelDia(docenteId, dia_semana);

    // 3. Si no hay horario asignado
    if (!horario) {
      return {
        esHorarioLaboral: false,
        tardanza: {
          esTardanza: false,
          minutos: 0
        },
        mensaje: `No tienes horario asignado para hoy.`
      };
    }

    // 4. Validar que no sea salida anticipada
    const horaFinStr = this.formatearHora(horario.hora_fin);
    const salidaAnticipada = this.calcularSalidaAnticipada(
      fechaHora,
      horaFinStr
    );

    // 5. Generar mensaje
    const mensaje = this.generarMensajeSalida(horario, salidaAnticipada);

    return {
      esHorarioLaboral: true,
      horarioEsperado: {
        hora_inicio: this.formatearHora(horario.hora_inicio),
        hora_fin: horaFinStr,
        areas: horario.areas?.nombre || 'Sin área'
      },
      tardanza: {
        esTardanza: false,
        minutos: 0
      },
      mensaje
    };
  }

  /**
   * Obtiene el horario del docente para un día específico
   */
  private async obtenerHorarioDelDia(docenteId: string, dia_semana: number) {
    return await prisma.horarios_base.findFirst({
      where: {
        docente_id: docenteId,
        dia_semana,
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
      orderBy: {
        hora_inicio: 'asc'
      }
    });
  }

  /**
   * Calcula si hay tardanza y cuántos minutos
   */
  private calcularTardanza(
    horaActual: Date,
    horaInicioEsperada: string
  ): { esTardanza: boolean; minutos: number } {
    // Convertir hora esperada a Date de hoy
    const [horas = 0, minutos = 0] = horaInicioEsperada.split(':').map(Number);
    const horaEsperada = new Date(horaActual);
    horaEsperada.setHours(horas, minutos, 0, 0);

    // Agregar tolerancia
    const horaConTolerancia = addMinutes(horaEsperada, this.TOLERANCIA_MINUTOS);

    // Calcular diferencia
    const diferencia = differenceInMinutes(horaActual, horaConTolerancia);

    if (diferencia <= 0) {
      return {
        esTardanza: false,
        minutos: 0
      };
    }

    return {
      esTardanza: true,
      minutos: diferencia
    };
  }

  /**
   * Calcula si hay salida anticipada
   */
  private calcularSalidaAnticipada(
    horaActual: Date,
    horaFinEsperada: string
  ): { esSalidaAnticipada: boolean; minutos: number } {
    // Convertir hora esperada a Date de hoy
    const [horas = 0, minutos = 0] = horaFinEsperada.split(':').map(Number);
    const horaEsperada = new Date(horaActual);
    horaEsperada.setHours(horas, minutos, 0, 0);

    // Calcular diferencia
    const diferencia = differenceInMinutes(horaEsperada, horaActual);

    if (diferencia <= 0) {
      return {
        esSalidaAnticipada: false,
        minutos: 0
      };
    }

    return {
      esSalidaAnticipada: true,
      minutos: diferencia
    };
  }

  /**
   * Genera mensaje descriptivo para entrada
   */
  private generarMensajeEntrada(
    horario: any,
    tardanza: { esTardanza: boolean; minutos: number }
  ): string {
    const horaEsperada = horario.hora_inicio;
    const area = horario.areas?.nombre || 'Sin área';

    if (!tardanza.esTardanza) {
      return `✅ Entrada registrada a tiempo.\n` +
             `Horario: ${horaEsperada} - ${horario.hora_fin}\n` +
             `Área: ${area}\n` +
             `Tolerancia aplicada: ${this.TOLERANCIA_MINUTOS} minutos.`;
    }

    return `⚠️ Entrada con tardanza.\n` +
           `Horario esperado: ${horaEsperada}\n` +
           `Minutos de tardanza: ${tardanza.minutos}\n` +
           `Área: ${area}\n` +
           `Se ha registrado tu tardanza automáticamente.`;
  }

  /**
   * Genera mensaje descriptivo para salida
   */
  private generarMensajeSalida(
    horario: any,
    salidaAnticipada: { esSalidaAnticipada: boolean; minutos: number }
  ): string {
    const horaEsperada = horario.hora_fin;
    const area = horario.areas?.nombre || 'Sin área';

    if (!salidaAnticipada.esSalidaAnticipada) {
      return `✅ Salida registrada correctamente.\n` +
             `Horario: ${horario.hora_inicio} - ${horaEsperada}\n` +
             `Área: ${area}`;
    }

    return `⚠️ Salida anticipada.\n` +
           `Hora esperada: ${horaEsperada}\n` +
           `Minutos antes: ${salidaAnticipada.minutos}\n` +
           `Área: ${area}\n` +
           `Nota: Si tienes justificación, regístrala en el sistema.`;
  }

  /**
   * Verifica si el docente tiene horarios asignados
   */
  async tieneHorariosAsignados(docenteId: string): Promise<boolean> {
    const count = await prisma.horarios_base.count({
      where: {
        docente_id: docenteId,
        activo: true
      }
    });

    return count > 0;
  }

  /**
   * Obtiene todos los horarios de la semana del docente
   */
  async obtenerHorariosSemana(docenteId: string) {
    const horarios: any[] = await prisma.horarios_base.findMany({
      where: {
        docente_id: docenteId,
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

    // Agrupar por día
    const horariosPorDia: { [key: number]: any[] } = {};

    for (const horario of horarios) {
      if (!horariosPorDia[horario.dia_semana]) {
        horariosPorDia[horario.dia_semana] = [];
      }
      horariosPorDia[horario.dia_semana]!.push(horario);
    }

    return horariosPorDia;
  }

  /**
   * Valida conflicto de horarios (útil para asignaciones)
   */
  async validarConflictoHorarios(
    docenteId: string,
    dia_semana: number,
    hora_inicio: string,
    hora_fin: string,
    excluirId?: number
  ): Promise<boolean> {
    const horariosExistentes: any[] = await prisma.horarios_base.findMany({
      where: {
        docente_id: docenteId,
        dia_semana,
        activo: true,
        ...(excluirId && { id: { not: excluirId } })
      }
    });

    // Verificar solapamiento
    for (const horario of horariosExistentes) {
      if (this.haySolapamiento(
        hora_inicio,
        hora_fin,
        this.formatearHora(horario.hora_inicio),
        this.formatearHora(horario.hora_fin)
      )) {
        return true; // Hay conflicto
      }
    }

    return false; // No hay conflicto
  }

  /**
   * Verifica si dos rangos horarios se solapan
   */
  private haySolapamiento(
    inicio1: string,
    fin1: string,
    inicio2: string,
    fin2: string
  ): boolean {
    return inicio1 < fin2 && inicio2 < fin1;
  }
}

// Exportar instancia singleton
export const horarioValidator = new HorarioValidator();

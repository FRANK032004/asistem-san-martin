/**
 * @fileoverview Servicio de Asistencias Docente - Nivel Senior
 * @description L�gica de negocio para registro de asistencia:
 * - Registro de entrada con GPS
 * - Registro de salida con GPS
 * - Validaciones completas
 * - Transacciones para integridad
 * - C�lculo de tardanzas
 */

import prisma from '../../../utils/database';
import { ValidationError, ConflictError, NotFoundError } from '../../../utils/app-error';
import { gpsValidator, GPSData } from '../validators/gps.validator';
import { horarioValidator } from '../validators/horario.validator';
import { startOfDay, endOfDay, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { logger } from '../../../utils/logger';

export interface RegistroEntradaData {
  docente_id: string;
  gpsData: GPSData;
}

export interface RegistroSalidaData {
  docente_id: string;
  gpsData: GPSData;
}

export interface ResultadoRegistro {
  asistencia: any;
  mensaje: string;
  detalles: {
    horaRegistro: string;
    ubicacion: string;
    distancia: number;
    precision: number;
    tardanza?: {
      minutos: number;
      mensaje: string;
    };
  };
}

export class AsistenciaService {
  /**
   * Registra la entrada del docente con validaci�n GPS y horario
   */
  async registrarEntrada(data: RegistroEntradaData): Promise<ResultadoRegistro> {
    const { docente_id, gpsData } = data;
    const ahora = new Date();

    // 1. Validar que no exista asistencia hoy
    await this.validarAsistenciaUnica(docente_id, ahora);

    // 2. Validar ubicaci�n GPS
    const validacionGPS = await gpsValidator.validarUbicacion(gpsData);

    // 3. Validar horario y calcular tardanza
    const validacionHorario = await horarioValidator.validarHorarioEntrada(
      docente_id,
      ahora
    );

    // 4. Validar que sea d�a laboral
    if (!validacionHorario.esHorarioLaboral) {
      throw new ValidationError(validacionHorario.mensaje);
    }

    // 5. Registrar en base de datos con transacci�n
    const resultado = await this.guardarEntrada({
      docente_id,
      fechaHora: ahora,
      gpsData,
      validacionGPS,
      validacionHorario
    });

    // 6. Log de auditor�a
    this.logRegistroEntrada(docente_id, validacionGPS, validacionHorario);

    return resultado;
  }

  /**
   * Registra la salida del docente con validaci�n GPS
   */
  async registrarSalida(data: RegistroSalidaData): Promise<ResultadoRegistro> {
    const { docente_id, gpsData } = data;
    const ahora = new Date();

    // 1. Buscar asistencia del d�a
    const asistencia = await this.obtenerAsistenciaHoy(docente_id, ahora);

    if (!asistencia) {
      throw new NotFoundError(
        'No se encontr� registro de entrada para hoy. ' +
        'Primero debes registrar tu entrada.'
      );
    }

    // 2. Validar que no tenga salida registrada
    if (asistencia.horaSalida) {
      throw new ConflictError(
        `Ya registraste tu salida a las ${format(asistencia.horaSalida, 'HH:mm')}. ` +
        `No puedes registrar salida nuevamente.`
      );
    }

    // 3. Validar ubicaci�n GPS
    const validacionGPS = await gpsValidator.validarUbicacion(gpsData);

    // 4. Validar horario
    const validacionHorario = await horarioValidator.validarHorarioSalida(
      docente_id,
      ahora
    );

    // 5. Actualizar asistencia con transacci�n
    const resultado = await this.guardarSalida({
      asistencia,
      fechaHora: ahora,
      gpsData,
      validacionGPS,
      validacionHorario
    });

    // 6. Log de auditor�a
    this.logRegistroSalida(docente_id, validacionGPS);

    return resultado;
  }

  /**
   * Valida que no exista asistencia para hoy
   */
  private async validarAsistenciaUnica(
    docente_id: string,
    fecha: Date
  ): Promise<void> {
    const asistenciaExistente = await prisma.asistencias.findFirst({
      where: {
        docenteId: docente_id,
        fecha: {
          gte: startOfDay(fecha),
          lte: endOfDay(fecha)
        }
      }
    });

    if (asistenciaExistente) {
      const horaRegistro = format(
        asistenciaExistente.horaEntrada || asistenciaExistente.fecha,
        'HH:mm',
        { locale: es }
      );

      throw new ConflictError(
        `Ya registraste tu entrada hoy a las ${horaRegistro}. ` +
        `No puedes registrar entrada nuevamente.`
      );
    }
  }

  /**
   * Obtiene la asistencia del d�a actual
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
        ubicacionEntrada: true
      }
    });
  }

  /**
   * Guarda el registro de entrada con transacci�n
   */
  private async guardarEntrada(params: {
    docente_id: string;
    fechaHora: Date;
    gpsData: GPSData;
    validacionGPS: any;
    validacionHorario: any;
  }): Promise<ResultadoRegistro> {
    const { docente_id, fechaHora, gpsData, validacionGPS, validacionHorario } = params;

    return await prisma.$transaction(async (tx: any) => {
      // 1. Crear asistencia
      const asistencia = await tx.asistencias.create({
        data: {
          docenteId: docente_id,
          fecha: startOfDay(fechaHora),
          horaEntrada: fechaHora,
          latitudEntrada: gpsData.latitud.toString(),
          longitudEntrada: gpsData.longitud.toString(),
          gpsValidoEntrada: true,
          ubicacionEntradaId: validacionGPS.ubicacion.id,
          tardanzaMinutos: validacionHorario.tardanza.minutos,
          estado: validacionHorario.tardanza.esTardanza ? 'tardanza' : 'presente'
        },
        include: {
          ubicacionEntrada: true,
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

      // 2. Registrar en GPS (si existe la tabla)
      try {
        await tx.registroGPS.create({
          data: {
            usuario_id: asistencia.docentes.usuario_id,
            tipo: 'ENTRADA',
            latitud: gpsData.latitud.toString(),
            longitud: gpsData.longitud.toString(),
            precision: gpsData.precision,
            timestamp: new Date(gpsData.timestamp),
            ubicacionId: validacionGPS.ubicacion.id
          }
        });
      } catch (error) {
        // Tabla registroGPS opcional
        logger.warn('No se pudo registrar en tabla GPS:', error);
      }

      // 3. Preparar mensaje de respuesta
      const mensaje = validacionHorario.tardanza.esTardanza
        ? `?? Entrada registrada con ${validacionHorario.tardanza.minutos} minutos de tardanza.`
        : '? Entrada registrada correctamente. �A tiempo!';

      return {
        asistencia,
        mensaje,
        detalles: {
          horaRegistro: format(fechaHora, 'HH:mm:ss', { locale: es }),
          ubicacion: validacionGPS.ubicacion.nombre,
          distancia: Math.round(validacionGPS.distancia),
          precision: Math.round(validacionGPS.precision),
          ...(validacionHorario.tardanza.esTardanza && {
            tardanza: {
              minutos: validacionHorario.tardanza.minutos,
              mensaje: validacionHorario.mensaje
            }
          })
        }
      };
    });
  }

  /**
   * Guarda el registro de salida con transacci�n
   */
  private async guardarSalida(params: {
    asistencia: any;
    fechaHora: Date;
    gpsData: GPSData;
    validacionGPS: any;
    validacionHorario: any;
  }): Promise<ResultadoRegistro> {
    const { asistencia, fechaHora, gpsData, validacionGPS } = params;

    return await prisma.$transaction(async (tx: any) => {
      // 1. Actualizar asistencia
      const asistenciaActualizada = await tx.asistencias.update({
        where: { id: asistencia.id },
        data: {
          horaSalida: fechaHora,
          latitudSalida: gpsData.latitud.toString(),
          longitudSalida: gpsData.longitud.toString(),
          gpsValidoSalida: true,
          ubicacionSalidaId: validacionGPS.ubicacion.id
        },
        include: {
          ubicacionEntrada: true,
          ubicacionSalida: true,
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

      // 2. Registrar en GPS
      try {
        await tx.registroGPS.create({
          data: {
            usuario_id: asistencia.docentes.usuario_id,
            tipo: 'SALIDA',
            latitud: gpsData.latitud.toString(),
            longitud: gpsData.longitud.toString(),
            precision: gpsData.precision,
            timestamp: new Date(gpsData.timestamp),
            ubicacionId: validacionGPS.ubicacion.id
          }
        });
      } catch (error) {
        logger.warn('No se pudo registrar en tabla GPS:', error);
      }

      return {
        asistencia: asistenciaActualizada,
        mensaje: '? Salida registrada correctamente.',
        detalles: {
          horaRegistro: format(fechaHora, 'HH:mm:ss', { locale: es }),
          ubicacion: validacionGPS.ubicacion.nombre,
          distancia: Math.round(validacionGPS.distancia),
          precision: Math.round(validacionGPS.precision)
        }
      };
    });
  }

  /**
   * Logs de auditor�a
   */
  private logRegistroEntrada(
    docente_id: string,
    validacionGPS: any,
    validacionHorario: any
  ): void {
    logger.info('Registro de entrada docente', {
      modulo: 'docente',
      accion: 'registro_entrada',
      docente_id,
      ubicacion: validacionGPS.ubicacion.nombre,
      distancia: Math.round(validacionGPS.distancia),
      precision: Math.round(validacionGPS.precision),
      tardanza: validacionHorario.tardanza.minutos,
      esTardanza: validacionHorario.tardanza.esTardanza
    });
  }

  private logRegistroSalida(docente_id: string, validacionGPS: any): void {
    logger.info('Registro de salida docente', {
      modulo: 'docente',
      accion: 'registro_salida',
      docente_id,
      ubicacion: validacionGPS.ubicacion.nombre,
      distancia: Math.round(validacionGPS.distancia),
      precision: Math.round(validacionGPS.precision)
    });
  }

  /**
   * Obtiene el estado de asistencia de hoy
   */
  async obtenerAsistenciaHoyCompleta(docente_id: string) {
    const ahora = new Date();

    const asistencia = await prisma.asistencias.findFirst({
      where: {
        docenteId: docente_id,
        fecha: {
          gte: startOfDay(ahora),
          lte: endOfDay(ahora)
        }
      },
      include: {
        ubicacionEntrada: true,
        ubicacionSalida: true
      }
    });

    if (!asistencia) {
      return null;
    }

    return {
      id: asistencia.id,
      fecha: asistencia.fecha,
      hora_entrada: asistencia.horaEntrada,
      hora_salida: asistencia.horaSalida,
      ubicacionEntrada: asistencia.ubicacionEntrada?.nombre,
      ubicacionSalida: asistencia.ubicacionSalida?.nombre,
      tardanza_minutos: asistencia.tardanzaMinutos,
      estado: 'PRESENTE', // Default
      completa: !!asistencia.horaSalida
    };
  }
}

// Exportar instancia singleton
export const asistenciaService = new AsistenciaService();

/**
 * @fileoverview Validador GPS Robusto - Nivel Senior
 * @description Validación completa de coordenadas GPS con múltiples criterios:
 * - Precisión mínima requerida
 * - Timestamp actualizado
 * - Múltiples ubicaciones permitidas
 * - Cálculo de distancia optimizado
 * - Mensajes de error descriptivos
 */

import { ValidationError } from '../../../utils/app-error';
import prisma from '../../../utils/database';
import { calcularDistancia } from '../../../utils/gps.utils';

export interface GPSData {
  latitud: number;
  longitud: number;
  precision: number;
  timestamp: number;
}

export interface ValidacionGPS {
  valido: boolean;
  ubicacion: {
    id: string;
    nombre: string;
    latitud: number;
    longitud: number;
    radio_metros: number;
  };
  distancia: number;
  precision: number;
}

export class GPSValidator {
  private readonly PRECISION_MAXIMA = 100; // metros
  private readonly TIMESTAMP_MAXIMO = 5 * 60 * 1000; // 5 minutos

  /**
   * Valida coordenadas GPS con múltiples criterios
   * @throws {ValidationError} Si la ubicación no es válida
   */
  async validarUbicacion(gpsData: GPSData): Promise<ValidacionGPS> {
    const { latitud, longitud, precision, timestamp } = gpsData;

    // 1. Validar formato de coordenadas
    this.validarFormatoCoordenadas(latitud, longitud);

    // 2. Validar precisión mínima
    this.validarPrecision(precision);

    // 3. Validar timestamp (no obsoleto)
    this.validarTimestamp(timestamp);

    // 4. Obtener ubicaciones permitidas activas
    const ubicaciones = await this.obtenerUbicacionesPermitidas();

    if (ubicaciones.length === 0) {
      throw new ValidationError(
        'No hay ubicaciones permitidas configuradas en el sistema. ' +
        'Contacte al administrador.'
      );
    }

    // 5. Calcular distancia a cada ubicación
    const distancias = this.calcularDistanciasAUbicaciones(
      latitud,
      longitud,
      ubicaciones
    );

    // 6. Encontrar ubicación más cercana
    const masCercana = this.encontrarUbicacionMasCercana(distancias);

    // 7. Validar que esté dentro del radio permitido
    this.validarDentroDeRadio(masCercana);

    return {
      valido: true,
      ubicacion: {
        id: masCercana.ubicacion.id,
        nombre: masCercana.ubicacion.nombre,
        latitud: parseFloat(masCercana.ubicacion.latitud.toString()),
        longitud: parseFloat(masCercana.ubicacion.longitud.toString()),
        radio_metros: masCercana.ubicacion.radio_metros
      },
      distancia: masCercana.distancia,
      precision
    };
  }

  /**
   * Valida que las coordenadas estén en rangos válidos
   */
  private validarFormatoCoordenadas(latitud: number, longitud: number): void {
    if (latitud < -90 || latitud > 90) {
      throw new ValidationError(
        `Latitud inválida: ${latitud}. Debe estar entre -90 y 90.`
      );
    }

    if (longitud < -180 || longitud > 180) {
      throw new ValidationError(
        `Longitud inválida: ${longitud}. Debe estar entre -180 y 180.`
      );
    }

    // Perú específico: validar que esté aproximadamente en Perú
    // Latitud: -18.35° a -0.03° (Sur)
    // Longitud: -81.33° a -68.65° (Oeste)
    if (latitud > -0.03 || latitud < -18.35) {
      throw new ValidationError(
        `Coordenadas fuera del rango geográfico de Perú. ` +
        `Verifique que su GPS esté activado correctamente.`
      );
    }

    if (longitud > -68.65 || longitud < -81.33) {
      throw new ValidationError(
        `Coordenadas fuera del rango geográfico de Perú. ` +
        `Verifique que su GPS esté activado correctamente.`
      );
    }
  }

  /**
   * Valida que la precisión del GPS sea suficiente
   */
  private validarPrecision(precision: number): void {
    if (precision > this.PRECISION_MAXIMA) {
      throw new ValidationError(
        `GPS poco preciso (${Math.round(precision)}m de error). ` +
        `Se requiere una precisión menor a ${this.PRECISION_MAXIMA}m. ` +
        `Intente en un lugar con mejor señal GPS o wifi.`
      );
    }
  }

  /**
   * Valida que las coordenadas no sean obsoletas
   */
  private validarTimestamp(timestamp: number): void {
    const ahora = Date.now();
    const diferencia = ahora - timestamp;

    if (diferencia > this.TIMESTAMP_MAXIMO) {
      const minutosAntiguo = Math.round(diferencia / 60000);
      throw new ValidationError(
        `Coordenadas GPS obsoletas (${minutosAntiguo} minutos de antigüedad). ` +
        `Actualice su ubicación e intente nuevamente.`
      );
    }

    // Validar que no sea futuro (desincronización de reloj)
    if (diferencia < -60000) {
      throw new ValidationError(
        'Timestamp del GPS indica tiempo futuro. ' +
        'Verifique la fecha/hora de su dispositivo.'
      );
    }
  }

  /**
   * Obtiene ubicaciones permitidas activas del sistema
   */
  private async obtenerUbicacionesPermitidas() {
    return await prisma.ubicaciones_permitidas.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        latitud: true,
        longitud: true,
        radio_metros: true
      }
    });
  }

  /**
   * Calcula distancias de coordenadas a todas las ubicaciones
   */
  private calcularDistanciasAUbicaciones(
    latitud: number,
    longitud: number,
    ubicaciones: any[]
  ) {
    return ubicaciones.map(ubicacion => {
      const distancia = calcularDistancia(
        latitud,
        longitud,
        parseFloat(ubicacion.latitud.toString()),
        parseFloat(ubicacion.longitud.toString())
      );

      return {
        ubicacion,
        distancia
      };
    });
  }

  /**
   * Encuentra la ubicación más cercana
   */
  private encontrarUbicacionMasCercana(distancias: any[]) {
    return distancias.reduce((prev, curr) =>
      curr.distancia < prev.distancia ? curr : prev
    );
  }

  /**
   * Valida que la distancia esté dentro del radio permitido
   */
  private validarDentroDeRadio(masCercana: any): void {
    const { distancia, ubicacion } = masCercana;

    if (distancia > ubicacion.radio_metros) {
      const distanciaRedondeada = Math.round(distancia);
      const exceso = Math.round(distancia - ubicacion.radio_metros);

      throw new ValidationError(
        `📍 Fuera del rango permitido.\n\n` +
        `Ubicación más cercana: ${ubicacion.nombre}\n` +
        `Tu distancia: ${distanciaRedondeada}m\n` +
        `Radio permitido: ${ubicacion.radio_metros}m\n` +
        `Exceso: ${exceso}m\n\n` +
        `Acércate ${exceso}m más a la ubicación permitida.`
      );
    }
  }

  /**
   * Valida ubicación rápida (sin lanzar errores, retorna booleano)
   * Útil para validaciones previas en frontend
   */
  async validarUbicacionRapida(
    latitud: number,
    longitud: number
  ): Promise<boolean> {
    try {
      const ubicaciones = await this.obtenerUbicacionesPermitidas();

      for (const ubicacion of ubicaciones) {
        const distancia = calcularDistancia(
          latitud,
          longitud,
          parseFloat(ubicacion.latitud.toString()),
          parseFloat(ubicacion.longitud.toString())
        );

        if (distancia <= (ubicacion.radio_metros || 100)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error en validación rápida GPS:', error);
      return false;
    }
  }

  /**
   * Obtiene la ubicación más cercana (sin validar radio)
   * Útil para mostrar información al usuario
   */
  async obtenerUbicacionMasCercana(
    latitud: number,
    longitud: number
  ): Promise<{
    ubicacion: any;
    distancia: number;
    dentroDeRango: boolean;
  } | null> {
    try {
      const ubicaciones = await this.obtenerUbicacionesPermitidas();

      if (ubicaciones.length === 0) {
        return null;
      }

      const distancias = this.calcularDistanciasAUbicaciones(
        latitud,
        longitud,
        ubicaciones
      );

      const masCercana = this.encontrarUbicacionMasCercana(distancias);

      return {
        ubicacion: masCercana.ubicacion,
        distancia: masCercana.distancia,
        dentroDeRango: masCercana.distancia <= masCercana.ubicacion.radio_metros
      };
    } catch (error) {
      console.error('Error al obtener ubicación más cercana:', error);
      return null;
    }
  }
}

// Exportar instancia singleton
export const gpsValidator = new GPSValidator();

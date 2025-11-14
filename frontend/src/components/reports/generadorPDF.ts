import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { SimpleReportePDF } from './SimpleReportePDF';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Interfaces
interface ReporteAsistencia {
  id: string;
  docente: {
    nombres: string;
    apellidos: string;
    area: string;
  };
  fecha: string;
  horaEntrada?: string;
  horaSalida?: string;
  estado: 'PRESENTE' | 'AUSENTE' | 'TARDANZA' | 'JUSTIFICADO';
  observaciones?: string;
}

interface EstadisticasReporte {
  totalAsistencias: number;
  presentesPromedio: number;
  puntualidadPromedio: number;
  ausentismoPromedio: number;
  fechaInicio: Date;
  fechaFin: Date;
}

interface ParametrosExportacion {
  estadisticas: EstadisticasReporte;
  asistencias: ReporteAsistencia[];
  nombreArchivo?: string;
  logoUrl?: string;
}

/**
 * Genera y descarga un PDF del reporte de asistencias
 * @param parametros - Datos y configuración del reporte
 * @returns Promise<void>
 */
export const generarReportePDF = async ({
  estadisticas,
  asistencias,
  nombreArchivo,
  logoUrl
}: ParametrosExportacion): Promise<void> => {
  try {
    // Generar nombre del archivo si no se proporciona
    const fechaActual = new Date();
    const nombrePorDefecto = `reporte_asistencias_${format(fechaActual, 'yyyy-MM-dd_HH-mm', { locale: es })}.pdf`;
    const nombreFinal = nombreArchivo || nombrePorDefecto;

    // Crear el elemento React
    const elementoReporte = React.createElement(SimpleReportePDF, {
      datos: {
        periodo: format(new Date(), 'MMMM yyyy', { locale: es }),
        totalPersonas: 150
      }
    });

    // Crear el documento PDF
    const blob = await pdf(elementoReporte as any).toBlob();

    // Crear enlace de descarga
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreFinal;
    
    // Trigger de descarga
    document.body.appendChild(enlace);
    enlace.click();
    
    // Cleanup
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);

    return Promise.resolve();
  } catch (error) {
    console.error('Error generando PDF:', error);
    throw new Error('No se pudo generar el reporte PDF');
  }
};

/**
 * Genera datos de ejemplo para testing del PDF
 * @returns Datos de prueba para el reporte
 */
export const generarDatosEjemplo = (): ParametrosExportacion => {
  const fechaInicio = new Date();
  fechaInicio.setDate(1); // Primer día del mes

  const fechaFin = new Date();
  fechaFin.setDate(30); // Último día del mes

  const estadisticas: EstadisticasReporte = {
    totalAsistencias: 245,
    presentesPromedio: 92.5,
    puntualidadPromedio: 88.2,
    ausentismoPromedio: 7.5,
    fechaInicio,
    fechaFin
  };

  const asistencias: ReporteAsistencia[] = [
    {
      id: '1',
      docente: {
        nombres: 'María Elena',
        apellidos: 'García Rodríguez',
        area: 'Matemáticas'
      },
      fecha: '2025-09-05',
      horaEntrada: '07:45',
      horaSalida: '13:30',
      estado: 'PRESENTE'
    },
    {
      id: '2',
      docente: {
        nombres: 'Carlos Alberto',
        apellidos: 'Mendoza Silva',
        area: 'Comunicación'
      },
      fecha: '2025-09-05',
      horaEntrada: '08:10',
      horaSalida: '13:25',
      estado: 'TARDANZA'
    },
    {
      id: '3',
      docente: {
        nombres: 'Ana Lucía',
        apellidos: 'Vargas Torres',
        area: 'Ciencias'
      },
      fecha: '2025-09-05',
      estado: 'AUSENTE'
    },
    {
      id: '4',
      docente: {
        nombres: 'Roberto',
        apellidos: 'Fernández Cruz',
        area: 'Historia'
      },
      fecha: '2025-09-05',
      horaEntrada: '07:50',
      horaSalida: '13:35',
      estado: 'PRESENTE'
    },
    {
      id: '5',
      docente: {
        nombres: 'Patricia',
        apellidos: 'López Martín',
        area: 'Inglés'
      },
      fecha: '2025-09-05',
      estado: 'JUSTIFICADO',
      observaciones: 'Permiso médico'
    }
  ];

  return {
    estadisticas,
    asistencias
  };
};

/**
 * Validar datos antes de generar el PDF
 * @param parametros - Parámetros a validar
 * @returns true si los datos son válidos
 */
export const validarDatosReporte = (parametros: ParametrosExportacion): boolean => {
  const { estadisticas, asistencias } = parametros;

  // Validar estadísticas
  if (!estadisticas) {
    console.error('Estadísticas requeridas para generar el reporte');
    return false;
  }

  // Validar que tenemos al menos algunos datos
  if (!asistencias || asistencias.length === 0) {
    console.warn('No hay asistencias para mostrar en el reporte');
    // Permitir generar reporte vacío
  }

  // Validar fechas
  if (!estadisticas.fechaInicio || !estadisticas.fechaFin) {
    console.error('Fechas de inicio y fin requeridas');
    return false;
  }

  return true;
};

export default {
  generarReportePDF,
  generarDatosEjemplo,
  validarDatosReporte
};

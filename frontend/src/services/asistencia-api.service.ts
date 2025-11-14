import api from '@/lib/api';

// Interfaces para asistencias
export interface AsistenciaDetalle {
  id: string;
  fecha: string;
  docente: {
    nombres: string;
    apellidos: string;
    codigoDocente: string;
    area: {
      nombre: string;
    };
  };
  horaEntrada?: string;
  horaSalida?: string;
  tardanzaMinutos?: number;
  estado: 'presente' | 'ausente' | 'tardanza' | 'justificado';
  ubicacionEntrada?: string;
  ubicacionSalida?: string;
  gpsValidoEntrada?: boolean;
  gpsValidoSalida?: boolean;
}

export interface EstadisticasAsistencia {
  total: number;
  presentes: number;
  ausentes: number;
  tardanzas: number;
  justificados: number;
  porcentajeAsistencia: number;
}

export interface FiltrosAsistencia {
  fecha?: 'hoy' | 'ayer' | 'semana' | 'mes' | string;
  estado?: 'todos' | 'presente' | 'ausente' | 'tardanza' | 'justificado';
  docente?: string;
}

export interface RespuestaAsistencias {
  asistencias: AsistenciaDetalle[];
  estadisticas: EstadisticasAsistencia;
  filtros: FiltrosAsistencia;
  ultimaActualizacion: Date;
}

// Servicio para obtener asistencias
export const obtenerAsistencias = async (filtros?: FiltrosAsistencia): Promise<RespuestaAsistencias> => {
  try {
    const params = new URLSearchParams();
    
    if (filtros?.fecha) {
      params.append('fecha', filtros.fecha);
    }
    
    if (filtros?.estado && filtros.estado !== 'todos') {
      params.append('estado', filtros.estado);
    }
    
    if (filtros?.docente) {
      params.append('docente', filtros.docente);
    }

    const response = await api.get(`/admin/asistencias?${params.toString()}`);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Error al obtener asistencias');
    }
  } catch (error: any) {
    console.error('Error obteniendo asistencias:', error);
    throw new Error(error.response?.data?.message || 'Error de conexión');
  }
};

// Servicio para exportar reporte
export const exportarReporteAsistencias = async (tipo: 'pdf' | 'excel', filtros?: FiltrosAsistencia) => {
  try {
    const response = await api.post('/admin/reportes/exportar', {
      tipo,
      filtros: {
        modulo: 'asistencias',
        ...filtros
      }
    });
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Error al generar reporte');
    }
  } catch (error: any) {
    console.error('Error exportando reporte:', error);
    throw new Error(error.response?.data?.message || 'Error de conexión');
  }
};
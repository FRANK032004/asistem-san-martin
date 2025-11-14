import api from '../lib/api';

// ============================================
// Tipos e Interfaces
// ============================================

export interface PlanillaListado {
  id: string;
  mes: number;
  anio: number;
  periodo: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'PAGADO' | 'ANULADO';
  horasRegulares: number;
  horasExtras: number;
  totalHoras: number;
  montoBase: number;
  bonificaciones: number;
  descuentos: number;
  totalNeto: number;
  fechaEmision: string | null;
  fechaPago: string | null;
  docente: {
    nombres: string;
    apellidos: string;
    dni: string;
  };
}

export interface PlanillaDetalle {
  id: string;
  mes: number;
  anio: number;
  periodo: string;
  estado: string;
  docente: {
    nombres: string;
    apellidos: string;
    dni: string;
    email: string;
    especialidad: string;
    nivelEducativo: string;
    condicionLaboral: string;
    regimen: string;
  };
  horas: {
    regulares: number;
    extras: number;
    total: number;
    valorHora: number;
  };
  montos: {
    base: number;
    horasExtras: number;
    bonificaciones: number;
    descuentos: number;
    totalBruto: number;
    totalNeto: number;
  };
  asistencia: {
    totalDias: number;
    diasPresente: number;
    diasTardanza: number;
    diasAusente: number;
    porcentajeAsistencia: number;
    totalTardanzaMinutos: number;
    promedioTardanzaMinutos: number;
  };
  detalles: Array<{
    id: string;
    fecha: string;
    horasTrabajadas: number;
    horasExtras: number;
    estado: string;
    horaEntrada: string | null;
    horaSalida: string | null;
    tardanzaMinutos: number;
    observaciones: string | null;
  }>;
  fechaEmision: string | null;
  fechaPago: string | null;
  observaciones: string | null;
}

export interface EstadisticasPlanilla {
  ultimaPlanilla: {
    periodo: string;
    estado: string;
    totalNeto: number;
  } | null;
  totalPercibidoAnio: number;
  promedioMensual: number;
  planillasPendientes: number;
  totalPlanillasAnio: number;
}

export interface FiltrosPlanilla {
  anio?: number;
  mes?: number;
  estado?: 'PENDIENTE' | 'EN_PROCESO' | 'PAGADO' | 'ANULADO' | 'TODOS';
}

// ============================================
// Servicio de API
// ============================================

class PlanillaApiService {
  private baseUrl = '/docente/planillas';

  /**
   * Obtener lista de planillas con filtros
   */
  async obtenerPlanillas(filtros?: FiltrosPlanilla): Promise<PlanillaListado[]> {
    try {
      const params = new URLSearchParams();
      
      if (filtros?.anio) {
        params.append('anio', filtros.anio.toString());
      }
      if (filtros?.mes) {
        params.append('mes', filtros.mes.toString());
      }
      if (filtros?.estado && filtros.estado !== 'TODOS') {
        params.append('estado', filtros.estado);
      }

      const queryString = params.toString();
      const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

      const response = await api.get(url);
      return response.data.data || [];
    } catch (error: any) {
      console.error('Error al obtener planillas:', error);
      throw new Error(
        error.response?.data?.message || 'Error al cargar planillas'
      );
    }
  }

  /**
   * Obtener detalle completo de una planilla
   */
  async obtenerDetallePlanilla(planillaId: string): Promise<PlanillaDetalle> {
    try {
      const response = await api.get(`${this.baseUrl}/${planillaId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error al obtener detalle de planilla:', error);
      throw new Error(
        error.response?.data?.message || 'Error al cargar detalle de planilla'
      );
    }
  }

  /**
   * Obtener estadísticas generales
   */
  async obtenerEstadisticas(): Promise<EstadisticasPlanilla> {
    try {
      const response = await api.get(`${this.baseUrl}/estadisticas`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error al obtener estadísticas:', error);
      throw new Error(
        error.response?.data?.message || 'Error al cargar estadísticas'
      );
    }
  }

  /**
   * Obtener años disponibles
   */
  async obtenerAniosDisponibles(): Promise<number[]> {
    try {
      const response = await api.get(`${this.baseUrl}/anios`);
      return response.data.data || [];
    } catch (error: any) {
      console.error('Error al obtener años disponibles:', error);
      return [];
    }
  }

  /**
   * Descargar boleta PDF (placeholder)
   */
  async descargarBoletaPDF(planillaId: string): Promise<void> {
    try {
      const response = await api.get(`${this.baseUrl}/${planillaId}/pdf`, {
        responseType: 'blob'
      });

      // Crear un enlace temporal para descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `boleta_${planillaId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error al descargar boleta:', error);
      throw new Error(
        error.response?.data?.message || 'Error al descargar boleta PDF'
      );
    }
  }
}

export default new PlanillaApiService();

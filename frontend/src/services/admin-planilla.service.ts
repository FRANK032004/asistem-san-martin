/**
 * Servicio API de Planillas para Administradores
 * Cliente HTTP para gestión completa de planillas
 */

import api from '@/lib/api';

// ==================== INTERFACES ====================

export interface PlanillaAdmin {
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
  observaciones: string | null;
  docente: {
    id: string;
    nombreCompleto: string;
    dni: string;
    email: string;
    especialidad: string;
    area: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PlanillaDetalle extends PlanillaAdmin {
  horas: {
    regulares: number;
    extras: number;
    total: number;
  };
  montos: {
    base: number;
    bonificaciones: number;
    descuentos: number;
    totalNeto: number;
  };
  detalle: Array<{
    fecha: string;
    horasTrabajadas: number;
    horasExtras: number;
    tardanzaMinutos: number;
    observaciones: string | null;
    asistencia: {
      horaEntrada: string | null;
      horaSalida: string | null;
      estado: string | null;
    } | null;
  }>;
  auditoria: {
    creadoPor: string;
    actualizadoPor: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export interface FiltrosPlanillas {
  anio?: number;
  mes?: number;
  estado?: 'PENDIENTE' | 'EN_PROCESO' | 'PAGADO' | 'ANULADO' | 'TODOS';
  docenteId?: string;
  page?: number;
  limit?: number;
}

export interface EstadisticasPlanillas {
  total: number;
  porEstado: {
    pendientes: number;
    enProceso: number;
    pagadas: number;
    anuladas: number;
  };
  totales: {
    montoTotal: number;
    horasRegulares: number;
    horasExtras: number;
  };
}

export interface DocenteConPlanillas {
  id: string;
  nombreCompleto: string;
  dni: string;
  email: string;
  especialidad: string;
  area: string;
  totalPlanillas: number;
}

// ==================== SERVICIO ====================

class AdminPlanillaService {
  
  /**
   * Obtener todas las planillas con filtros y paginación
   */
  async obtenerTodasPlanillas(filtros?: FiltrosPlanillas) {
    try {
      const params = new URLSearchParams();
      
      if (filtros?.anio) params.append('anio', filtros.anio.toString());
      if (filtros?.mes) params.append('mes', filtros.mes.toString());
      if (filtros?.estado) params.append('estado', filtros.estado);
      if (filtros?.docenteId) params.append('docenteId', filtros.docenteId);
      if (filtros?.page) params.append('page', filtros.page.toString());
      if (filtros?.limit) params.append('limit', filtros.limit.toString());

      const response = await api.get(`/admin/planillas?${params.toString()}`);

      if (response.data?.success) {
        return {
          planillas: response.data.data.planillas as PlanillaAdmin[],
          pagination: response.data.data.pagination
        };
      }

      throw new Error('Error al obtener planillas');
    } catch (error: any) {
      console.error('Error al obtener planillas:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener planillas');
    }
  }

  /**
   * Obtener detalle de planilla por ID
   */
  async obtenerDetallePlanilla(id: string): Promise<PlanillaDetalle> {
    try {
      const response = await api.get(`/admin/planillas/${id}`);

      if (response.data?.success) {
        return response.data.data as PlanillaDetalle;
      }

      throw new Error('Error al obtener detalle de planilla');
    } catch (error: any) {
      console.error('Error al obtener detalle:', error);
      if (error.response?.status === 404) {
        throw new Error('Planilla no encontrada');
      }
      throw new Error(error.response?.data?.message || 'Error al obtener detalle de planilla');
    }
  }

  /**
   * Generar nueva planilla
   */
  async generarPlanilla(data: { docenteId: string; mes: number; anio: number }) {
    try {
      const response = await api.post('/admin/planillas', data);

      if (response.data?.success) {
        return response.data.data;
      }

      throw new Error('Error al generar planilla');
    } catch (error: any) {
      console.error('Error al generar planilla:', error);
      throw new Error(error.response?.data?.message || 'Error al generar planilla');
    }
  }

  /**
   * Actualizar estado de planilla
   */
  async actualizarEstado(id: string, estado: string, observaciones?: string) {
    try {
      const response = await api.put(`/admin/planillas/${id}/estado`, {
        estado,
        observaciones
      });

      if (response.data?.success) {
        return response.data.data;
      }

      throw new Error('Error al actualizar estado');
    } catch (error: any) {
      console.error('Error al actualizar estado:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar estado');
    }
  }

  /**
   * Actualizar datos de planilla
   */
  async actualizarPlanilla(id: string, data: {
    montoBase?: number;
    bonificaciones?: number;
    descuentos?: number;
    observaciones?: string;
  }) {
    try {
      const response = await api.put(`/admin/planillas/${id}`, data);

      if (response.data?.success) {
        return response.data.data;
      }

      throw new Error('Error al actualizar planilla');
    } catch (error: any) {
      console.error('Error al actualizar planilla:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar planilla');
    }
  }

  /**
   * Anular planilla
   */
  async eliminarPlanilla(id: string) {
    try {
      const response = await api.delete(`/admin/planillas/${id}`);

      if (response.data?.success) {
        return true;
      }

      throw new Error('Error al anular planilla');
    } catch (error: any) {
      console.error('Error al anular planilla:', error);
      throw new Error(error.response?.data?.message || 'Error al anular planilla');
    }
  }

  /**
   * Obtener estadísticas generales
   */
  async obtenerEstadisticas(filtros?: { anio?: number; mes?: number }): Promise<EstadisticasPlanillas> {
    try {
      const params = new URLSearchParams();
      
      if (filtros?.anio) params.append('anio', filtros.anio.toString());
      if (filtros?.mes) params.append('mes', filtros.mes.toString());

      const response = await api.get(`/admin/planillas/estadisticas/general?${params.toString()}`);

      if (response.data?.success) {
        return response.data.data as EstadisticasPlanillas;
      }

      throw new Error('Error al obtener estadísticas');
    } catch (error: any) {
      console.error('Error al obtener estadísticas:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener estadísticas');
    }
  }

  /**
   * Obtener lista de docentes con planillas
   */
  async obtenerDocentesConPlanillas(): Promise<DocenteConPlanillas[]> {
    try {
      const response = await api.get('/admin/planillas/docentes');

      if (response.data?.success) {
        return response.data.data as DocenteConPlanillas[];
      }

      throw new Error('Error al obtener docentes');
    } catch (error: any) {
      console.error('Error al obtener docentes:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener docentes');
    }
  }

  /**
   * Generar planillas masivas
   */
  async generarPlanillasMasivo(data: { mes: number; anio: number; docenteIds: string[] }) {
    try {
      const response = await api.post('/admin/planillas/generar-masivo', data);

      if (response.data?.success) {
        return response.data.data;
      }

      throw new Error('Error al generar planillas masivas');
    } catch (error: any) {
      console.error('Error al generar planillas masivas:', error);
      throw new Error(error.response?.data?.message || 'Error al generar planillas masivas');
    }
  }

  /**
   * Utilidades de formato
   */
  formatearPeriodo(mes: number, anio: number): string {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${meses[mes - 1]} ${anio}`;
  }

  formatearEstado(estado: string): string {
    const estados: Record<string, string> = {
      'PENDIENTE': 'Pendiente',
      'EN_PROCESO': 'En Proceso',
      'PAGADO': 'Pagado',
      'ANULADO': 'Anulado'
    };
    return estados[estado] || estado;
  }

  getColorEstado(estado: string): string {
    const colores: Record<string, string> = {
      'PENDIENTE': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'EN_PROCESO': 'bg-blue-100 text-blue-800 border-blue-300',
      'PAGADO': 'bg-green-100 text-green-800 border-green-300',
      'ANULADO': 'bg-red-100 text-red-800 border-red-300'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800 border-gray-300';
  }

  formatearMonto(monto: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(monto);
  }
}

export const adminPlanillaService = new AdminPlanillaService();
export default adminPlanillaService;

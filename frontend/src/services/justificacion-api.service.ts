/**
 * @module JustificacionService
 * @description Servicio profesional para gestión de justificaciones
 * 
 * Arquitectura:
 * - TypeScript interfaces completas
 * - Separación docente/admin
 * - Error handling robusto
 * - Type-safe API calls
 * - Integrado con módulo docente
 */

import api from '@/lib/api';

// ==================== INTERFACES ====================

export interface MiJustificacion {
  id: string;
  asistencia_id: string | null;
  fecha_inicio: string | Date;
  fecha_fin: string | Date;
  tipo: 'MEDICA' | 'PERSONAL' | 'FAMILIAR' | 'CAPACITACION' | 'OTRO';
  motivo: string;
  documento_adjunto: string | null;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  prioridad: 'alta' | 'normal' | 'baja';
  afecta_pago: boolean;
  horas_afectadas: number | null;
  porcentaje_descuento: number;
  observaciones_admin: string | null;
  aprobado_por: string | null;
  fecha_aprobacion: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
  // Relaciones opcionales
  asistencia?: {
    id: string;
    fecha: string | Date;
    hora_entrada: string | Date | null;
    hora_salida: string | Date | null;
    estado: string;
    tardanza_minutos: number | null;
  } | null;
  aprobador?: {
    nombreCompleto: string;
    email: string;
  } | null;
}

export interface CrearJustificacionDto {
  asistenciaId?: string;              // Opcional
  fechaInicio: string;                // YYYY-MM-DD
  fechaFin: string;                   // YYYY-MM-DD
  tipo: 'MEDICA' | 'PERSONAL' | 'FAMILIAR' | 'CAPACITACION' | 'OTRO';
  motivo: string;                     // Min 20 caracteres
  evidenciaUrl?: string;              // URL del archivo
  afectaPago?: boolean;               // Default: false
}

export interface ActualizarJustificacionDto {
  tipo?: 'MEDICA' | 'PERSONAL' | 'FAMILIAR' | 'CAPACITACION' | 'OTRO';
  motivo?: string;
  evidenciaUrl?: string;
}

export interface FiltrosJustificacion {
  estado?: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  tipo?: 'MEDICA' | 'PERSONAL' | 'FAMILIAR' | 'CAPACITACION' | 'OTRO';
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
}

export interface EstadisticasJustificaciones {
  total: number;
  pendientes: number;
  aprobadas: number;
  rechazadas: number;
  tasaAprobacion: string; // Porcentaje
}

export interface ResponseJustificaciones {
  data: MiJustificacion[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==================== SERVICIO ====================

class JustificacionService {
  
  // ========== ENDPOINTS PARA DOCENTES ==========
  
  /**
   * Crear nueva justificación
   * Endpoint: POST /api/docente/justificaciones
   * Requiere: Token JWT (DOCENTE)
   */
  async crearJustificacion(datos: CrearJustificacionDto): Promise<MiJustificacion> {
    try {
      console.log('📝 Creando justificación:', datos);
      const response = await api.post('/docente/justificaciones', datos);
      
      if (response.data?.success) {
        console.log('✅ Justificación creada:', response.data.data);
        return this.normalizarJustificacion(response.data.data);
      }
      
      throw new Error('Formato de respuesta inválido');
    } catch (error: any) {
      console.error('❌ Error creando justificación:', error);
      if (error.response?.status === 401) {
        throw new Error('Sesión expirada. Por favor, vuelve a iniciar sesión.');
      }
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para crear justificaciones.');
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Error al crear la justificación. Intenta de nuevo.');
    }
  }

  /**
   * Obtener mis justificaciones con filtros
   * Endpoint: GET /api/docente/justificaciones
   * Requiere: Token JWT (DOCENTE)
   */
  async obtenerMisJustificaciones(filtros?: FiltrosJustificacion): Promise<ResponseJustificaciones> {
    try {
      console.log('📋 Obteniendo mis justificaciones...', filtros);
      
      const params = new URLSearchParams();
      if (filtros?.estado) params.append('estado', filtros.estado);
      if (filtros?.tipo) params.append('tipo', filtros.tipo);
      if (filtros?.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
      if (filtros?.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
      if (filtros?.page) params.append('page', filtros.page.toString());
      if (filtros?.limit) params.append('limit', filtros.limit.toString());
      
      const response = await api.get(`/docente/justificaciones?${params.toString()}`);
      
      if (response.data?.success) {
        console.log('✅ Justificaciones obtenidas:', response.data.data.data.length);
        return {
          data: response.data.data.data.map((j: any) => this.normalizarJustificacion(j)),
          pagination: response.data.data.pagination
        };
      }
      
      throw new Error('Formato de respuesta inválido');
    } catch (error: any) {
      console.error('❌ Error obteniendo justificaciones:', error);
      if (error.response?.status === 401) {
        throw new Error('Sesión expirada. Por favor, vuelve a iniciar sesión.');
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Error al cargar justificaciones. Intenta de nuevo.');
    }
  }

  /**
   * Obtener una justificación por ID
   * Endpoint: GET /api/docente/justificaciones/:id
   * Requiere: Token JWT (DOCENTE propietario)
   */
  async obtenerJustificacion(id: string): Promise<MiJustificacion> {
    try {
      console.log('� Obteniendo justificación:', id);
      const response = await api.get(`/docente/justificaciones/${id}`);
      
      if (response.data?.success) {
        console.log('✅ Justificación obtenida');
        return this.normalizarJustificacion(response.data.data);
      }
      
      throw new Error('Formato de respuesta inválido');
    } catch (error: any) {
      console.error('❌ Error obteniendo justificación:', error);
      if (error.response?.status === 404) {
        throw new Error('Justificación no encontrada');
      }
      if (error.response?.status === 403) {
        throw new Error('No tienes permiso para ver esta justificación');
      }
      throw new Error(error.response?.data?.message || 'Error al cargar la justificación');
    }
  }

  /**
   * Actualizar justificación (solo PENDIENTE)
   * Endpoint: PUT /api/docente/justificaciones/:id
   * Requiere: Token JWT (DOCENTE propietario)
   */
  async actualizarJustificacion(id: string, datos: ActualizarJustificacionDto): Promise<Partial<MiJustificacion>> {
    try {
      console.log('✏️ Actualizando justificación:', id, datos);
      const response = await api.put(`/docente/justificaciones/${id}`, datos);
      
      if (response.data?.success) {
        console.log('✅ Justificación actualizada');
        return response.data.data;
      }
      
      throw new Error('Formato de respuesta inválido');
    } catch (error: any) {
      console.error('❌ Error actualizando justificación:', error);
      if (error.response?.status === 403) {
        throw new Error('No puedes editar esta justificación');
      }
      throw new Error(error.response?.data?.message || 'Error al actualizar la justificación');
    }
  }

  /**
   * Eliminar justificación (solo PENDIENTE)
   * Endpoint: DELETE /api/docente/justificaciones/:id
   * Requiere: Token JWT (DOCENTE propietario)
   */
  async eliminarJustificacion(id: string): Promise<void> {
    try {
      console.log('🗑️ Eliminando justificación:', id);
      const response = await api.delete(`/docente/justificaciones/${id}`);
      
      if (response.data?.success) {
        console.log('✅ Justificación eliminada');
        return;
      }
      
      throw new Error('Error al eliminar la justificación');
    } catch (error: any) {
      console.error('❌ Error eliminando justificación:', error);
      if (error.response?.status === 403) {
        throw new Error('No puedes eliminar esta justificación');
      }
      throw new Error(error.response?.data?.message || 'Error al eliminar la justificación');
    }
  }

  /**
   * Obtener estadísticas de justificaciones
   * Endpoint: GET /api/docente/justificaciones/estadisticas
   * Requiere: Token JWT (DOCENTE)
   */
  async obtenerEstadisticas(): Promise<EstadisticasJustificaciones> {
    try {
      console.log('📊 Obteniendo estadísticas...');
      const response = await api.get('/docente/justificaciones/estadisticas');
      
      if (response.data?.success) {
        console.log('✅ Estadísticas obtenidas');
        return response.data.data;
      }
      
      throw new Error('Formato de respuesta inválido');
    } catch (error: any) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw new Error(error.response?.data?.message || 'Error al cargar estadísticas');
    }
  }

  // ========== ENDPOINTS PARA ADMIN ==========
  
  /**
   * Obtener justificaciones pendientes (Admin)
   * Endpoint: GET /api/justificaciones/pendientes
   * Requiere: Token JWT (ADMIN)
   */
  async obtenerJustificacionesPendientes(): Promise<MiJustificacion[]> {
    try {
      console.log('📋 Obteniendo justificaciones pendientes (Admin)...');
      const response = await api.get('/justificaciones/pendientes');
      
      if (response.data?.success) {
        console.log('✅ Justificaciones pendientes obtenidas:', response.data.data.length);
        return response.data.data.map((j: any) => this.normalizarJustificacion(j));
      }
      
      throw new Error('Formato de respuesta inválido');
    } catch (error: any) {
      console.error('❌ Error obteniendo justificaciones pendientes:', error);
      if (error.response?.status === 401) {
        throw new Error('Sesión expirada. Por favor, vuelve a iniciar sesión.');
      }
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos de administrador.');
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Error al cargar justificaciones pendientes.');
    }
  }

  // ========== UTILIDADES ==========
  
  /**
   * Normalizar datos de justificación del backend
   * Convierte snake_case a camelCase y maneja campos opcionales
   */
  private normalizarJustificacion(data: any): MiJustificacion {
    return {
      id: data.id,
      asistencia_id: data.asistencia_id || null,
      fecha_inicio: data.fecha_inicio,
      fecha_fin: data.fecha_fin,
      tipo: data.tipo,
      motivo: data.motivo,
      documento_adjunto: data.documento_adjunto || null,
      estado: data.estado,
      prioridad: data.prioridad || 'normal',
      afecta_pago: data.afecta_pago || false,
      horas_afectadas: data.horas_afectadas || null,
      porcentaje_descuento: data.porcentaje_descuento || 0,
      observaciones_admin: data.observaciones_admin || null,
      aprobado_por: data.aprobado_por || null,
      fecha_aprobacion: data.fecha_aprobacion || null,
      created_at: data.created_at,
      updated_at: data.updated_at,
      asistencia: data.asistencia || null,
      aprobador: data.aprobador || null
    };
  }
  
  /**
   * Formatear tipo para display
   */
  formatearTipo(tipo: string): string {
    const tipos: Record<string, string> = {
      'MEDICA': 'Médica',
      'PERSONAL': 'Personal',
      'FAMILIAR': 'Familiar',
      'CAPACITACION': 'Capacitación',
      'OTRO': 'Otro'
    };
    return tipos[tipo] || tipo;
  }

  /**
   * Formatear estado para display
   */
  formatearEstado(estado: string): string {
    const estados: Record<string, string> = {
      'pendiente': 'Pendiente',
      'aprobada': 'Aprobada',
      'rechazada': 'Rechazada'
    };
    return estados[estado] || estado;
  }

  /**
   * Obtener color del badge según estado
   */
  getColorEstado(estado: string): string {
    const colores: Record<string, string> = {
      'pendiente': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'aprobada': 'bg-green-100 text-green-800 border-green-300',
      'rechazada': 'bg-red-100 text-red-800 border-red-300'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800 border-gray-300';
  }

  /**
   * Obtener ícono según tipo
   */
  getIconoTipo(tipo: string): string {
    const iconos: Record<string, string> = {
      'MEDICA': '🏥',
      'PERSONAL': '👤',
      'FAMILIAR': '👨‍👩‍👧',
      'CAPACITACION': '📚',
      'OTRO': '📝'
    };
    return iconos[tipo] || '📝';
  }
}

// Exportar instancia única (Singleton)
export const justificacionService = new JustificacionService();

// Exports de funciones específicas para uso directo
export const obtenerJustificacionesDocente = () => justificacionService.obtenerJustificacionesDocente();
export const crearJustificacionDocente = (formData: FormData) => justificacionService.crearJustificacionDocente(formData);
export const actualizarJustificacion = (id: string, data: ActualizarJustificacionDto) => justificacionService.actualizarJustificacion(id, data);
export const eliminarJustificacion = (id: string) => justificacionService.eliminarJustificacion(id);

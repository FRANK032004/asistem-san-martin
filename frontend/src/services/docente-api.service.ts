import api from '@/lib/api';

// ========== TIPOS PARA DOCENTE - ENTERPRISE GRADE ==========
export interface Docente {
  id: string;
  usuarios: {
    nombres: string;
    apellidos: string;
    dni: string;
    email: string;
    telefono?: string;
    activo: boolean;
  };
  codigoDocente: string;
  area: {
    id: string;
    nombre: string;
  };
  fechaIngreso: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'LICENCIA';
  especialidad?: string;
  observaciones?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Tipos para Area
export interface Area {
  id: string;
  nombre: string;
  descripcion?: string;
}

// Tipos para filtros
export interface FiltrosDocente {
  search?: string;
  areaId?: string;
  estado?: 'ACTIVO' | 'INACTIVO' | 'LICENCIA';
  page?: number;
  limit?: number;
}

// Tipos para crear docente
export interface CrearDocenteDto {
  // Datos del usuario
  nombres: string;
  apellidos: string;
  dni: string;
  email: string;
  telefono?: string;
  password: string;
  
  // Datos del docente
  codigoDocente: string;
  areaId: string;
  especialidad?: string;
  observaciones?: string;
  estado?: 'ACTIVO' | 'INACTIVO' | 'LICENCIA';
}

// Tipos para actualizar docente
export interface ActualizarDocenteDto {
  // Datos del usuario (opcionales)
  nombres?: string;
  apellidos?: string;
  dni?: string;
  email?: string;
  telefono?: string;
  password?: string;
  activo?: boolean;
  
  // Datos del docente (opcionales)
  codigoDocente?: string;
  areaId?: string;
  especialidad?: string;
  observaciones?: string;
  estado?: 'ACTIVO' | 'INACTIVO' | 'LICENCIA';
}

// Respuesta paginada
export interface RespuestaPaginada<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class DocenteApiService {
  // ========== OBTENER TODOS LOS DOCENTES ==========
  async obtenerDocentes(filtros?: FiltrosDocente): Promise<Docente[]> {
    try {
      const params = new URLSearchParams();
      if (filtros?.search) params.append('search', filtros.search);
      if (filtros?.areaId) params.append('areaId', filtros.areaId);
      if (filtros?.estado) params.append('estado', filtros.estado);
      if (filtros?.page) params.append('page', filtros.page.toString());
      if (filtros?.limit) params.append('limit', filtros.limit.toString());

      console.log('🔍 Intentando obtener docentes...');
      console.log('📡 URL:', `/admin/docentes?${params.toString()}`);
      
      const response = await api.get(`/admin/docentes?${params.toString()}`);
      
      // El backend devuelve { success: true, data: [...] }
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        console.error('Formato de respuesta inesperado:', response.data);
        return [];
      }
    } catch (error: any) {
      console.error('Error al obtener docentes:', error);
      
      // Si es error 403, probablemente no está autenticado o no tiene permisos
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para acceder a los docentes. Asegúrate de estar logueado como administrador.');
      }
      
      // Si es error 401, no está autenticado
      if (error.response?.status === 401) {
        throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Error al obtener docentes');
    }
  }

  // ========== OBTENER DOCENTE POR ID ==========
  async obtenerDocentePorId(id: string): Promise<Docente> {
    try {
      const response = await api.get(`/admin/docentes/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error al obtener docente:', error);
      throw new Error(error.response?.data?.message || 'Docente no encontrado');
    }
  }

  // ========== CREAR DOCENTE ==========
  async crearDocente(docenteData: CrearDocenteDto): Promise<Docente> {
    try {
      const response = await api.post('/admin/docentes', docenteData);
      return response.data.data;
    } catch (error: any) {
      console.error('Error al crear docente:', error);
      throw new Error(error.response?.data?.message || 'Error al crear docente');
    }
  }

  // ========== ACTUALIZAR DOCENTE ==========
  async actualizarDocente(id: string, docenteData: ActualizarDocenteDto): Promise<Docente> {
    try {
      const response = await api.put(`/admin/docentes/${id}`, docenteData);
      return response.data.data;
    } catch (error: any) {
      console.error('Error al actualizar docente:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar docente');
    }
  }

  // ========== ELIMINAR DOCENTE ==========
  async eliminarDocente(id: string): Promise<void> {
    try {
      await api.delete(`/admin/docentes/${id}`);
    } catch (error: any) {
      console.error('Error al eliminar docente:', error);
      throw new Error(error.response?.data?.message || 'Error al eliminar docente');
    }
  }

  // ========== CAMBIAR ESTADO DOCENTE ==========
  async cambiarEstadoDocente(id: string, activo: boolean): Promise<Docente> {
    try {
      const response = await api.put(`/admin/docentes/${id}/toggle-status`, { activo });
      return response.data.data;
    } catch (error: any) {
      console.error('Error al cambiar estado del docente:', error);
      throw new Error(error.response?.data?.message || 'Error al cambiar estado del docente');
    }
  }

  // ========== OBTENER ÁREAS ==========
  async obtenerAreas(): Promise<Area[]> {
    try {
      // Por ahora usamos datos mock hasta crear el endpoint de áreas
      // TODO: Implementar endpoint /areas en el backend
      return [
        { id: '1', nombre: 'Matemáticas', descripcion: 'Área de matemáticas y ciencias exactas' },
        { id: '2', nombre: 'Comunicación', descripcion: 'Área de lenguaje y literatura' },
        { id: '3', nombre: 'Ciencias', descripcion: 'Área de ciencias naturales' },
        { id: '4', nombre: 'Historia', descripcion: 'Área de ciencias sociales' },
        { id: '5', nombre: 'Inglés', descripcion: 'Área de idiomas extranjeros' },
        { id: '6', nombre: 'Educación Física', descripcion: 'Área de educación física y deportes' },
        { id: '7', nombre: 'Arte', descripcion: 'Área de educación artística' },
        { id: '8', nombre: 'Religión', descripcion: 'Área de educación religiosa' }
      ];
      
      // Código comentado para cuando se implemente el backend
      /*
      const response = await api.get('/areas');
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        console.error('Formato de respuesta inesperado para áreas:', response.data);
        return [];
      }
      */
    } catch (error: any) {
      console.error('Error al obtener áreas:', error);
      // En caso de error, devolver áreas mock
      return [
        { id: '1', nombre: 'Matemáticas' },
        { id: '2', nombre: 'Comunicación' },
        { id: '3', nombre: 'Ciencias' },
        { id: '4', nombre: 'Historia' }
      ];
    }
  }

  // ========== ESTADÍSTICAS DE DOCENTES ==========
  async obtenerEstadisticasDocentes() {
    try {
      const response = await api.get('/admin/docentes/estadisticas');
      return response.data.data;
    } catch (error: any) {
      console.error('Error al obtener estadísticas:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener estadísticas');
    }
  }
}

// Exportar instancia única del servicio
export const docenteService = new DocenteApiService();
export default docenteService;
import { create } from 'zustand';
import api from '@/lib/api';

// Interfaces
interface EstadisticasAdmin {
  totalUsuarios: number;
  totalDocentes: number;
  docentesPresentes: number;
  totalAsistencias: number;
  puntualidadPromedio: number;
  alertasActivas?: number;
  tendenciaSemanal?: number;
  totalUbicaciones?: number;
  ubicacionesActivas?: number;
  totalHorarios?: number;
  horariosActivos?: number;
  totalAreas?: number;
  areasActivas?: number;
  ultimaActualizacion: Date;
}

interface DocenteEstado {
  id: string;
  nombre: string;
  nombres?: string; // Compatibilidad con uso existente
  apellidos?: string; // Compatibilidad con uso existente
  email: string;
  area: string;
  estado: 'presente' | 'ausente' | 'tardanza';
  horaEntrada?: string;
  horaSalida?: string;
}

interface AsistenciaSemana {
  name: string;
  presente: number;
  ausente: number;
  tardanza?: number;
}

interface PuntualidadData {
  name: string;
  value: number;
  count?: number;
  color: string;
}

interface AdminState {
  // Estado
  estadisticas: EstadisticasAdmin | null;
  docentesEstado: DocenteEstado[];
  asistenciasSemana: AsistenciaSemana[];
  puntualidadData: PuntualidadData[];
  isLoading: boolean;
  error: string | null;

  // Acciones
  cargarEstadisticasAdmin: () => Promise<void>;
  cargarEstadoDocentes: () => Promise<void>;
  cargarAsistenciasSemana: () => Promise<void>;
  cargarDistribucionPuntualidad: () => Promise<void>;
  exportarReporte: (tipo: 'pdf' | 'excel', filtros?: any) => Promise<void>;
}

// Store principal
export const useAdminStore = create<AdminState>((set, get) => ({
  // Estado inicial
  estadisticas: null,
  docentesEstado: [],
  asistenciasSemana: [],
  puntualidadData: [],
  isLoading: false,
  error: null,

  // Cargar estadísticas administrativas
  cargarEstadisticasAdmin: async () => {
    try {
      console.log('🚀 Iniciando carga de estadísticas...');
      
      // ✅ VERIFICAR que haya token antes de hacer la petición
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.warn('⚠️ No hay token disponible, esperando...');
        set({ isLoading: false, error: 'No autenticado' });
        return;
      }
      
      set({ isLoading: true, error: null });
      
      const response = await api.get('/admin/estadisticas');
      console.log('✅ Respuesta recibida:', response.data);
      
      if (response.data?.success) {
        const rawData = response.data.data;
        console.log('✅ Datos raw:', rawData);
        
        // Extraer datos de la estructura anidada
        const stats = rawData.estadisticas;
        
        // Transformar a formato plano esperado por el frontend
        const estadisticasPlanas = {
          totalUsuarios: stats?.usuarios?.total ?? 0,
          totalDocentes: stats?.docentes?.total ?? 0,
          docentesPresentes: stats?.docentes?.presentesHoy ?? 0,
          totalAsistencias: stats?.asistencias?.hoy ?? 0,
          puntualidadPromedio: stats?.asistencias?.porcentajePuntualidad ?? 0,
          alertasActivas: (stats?.docentes?.total ?? 0) - (stats?.docentes?.presentesHoy ?? 0),
          tendenciaSemanal: 0,
          totalUbicaciones: stats?.ubicaciones?.total ?? 0,
          ubicacionesActivas: stats?.ubicaciones?.activas ?? 0,
          totalHorarios: stats?.horarios?.total ?? 0,
          horariosActivos: stats?.horarios?.activos ?? 0,
          totalAreas: stats?.areas?.total ?? 0,
          areasActivas: stats?.areas?.activas ?? 0,
          ultimaActualizacion: rawData.ultimaActualizacion ? new Date(rawData.ultimaActualizacion) : new Date()
        };
        
        console.log('📊 Estadísticas transformadas:', estadisticasPlanas);
        
        set({ 
          estadisticas: estadisticasPlanas,
          isLoading: false 
        });
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error: any) {
      console.error('❌ Error al cargar estadísticas:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      // NO USAR DATOS DE EJEMPLO - Mantener estadisticas en null para que se vea el error
      set({ 
        estadisticas: null,
        isLoading: false,
        error: 'No se pudieron cargar las estadísticas. Por favor, verifica tu conexión o inicia sesión nuevamente.'
      });
    }
  },

  // Cargar estado actual de docentes
  cargarEstadoDocentes: async () => {
    try {
      // ✅ VERIFICAR token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.warn('⚠️ No hay token disponible para cargar estado de docentes');
        set({ isLoading: false, error: 'No autenticado' });
        return;
      }
      
      set({ isLoading: true, error: null });
      
      const response = await api.get('/admin/docentes/estado');
      
      if (response.data.success) {
        set({ 
          docentesEstado: response.data.data,
          isLoading: false 
        });
      } else {
        throw new Error('Error al cargar estado de docentes');
      }
    } catch (error: any) {
      console.error('Error al cargar estado de docentes:', error);
      
      // Datos de ejemplo como fallback - Estructura corregida para coincidir con API
      set({
        docentesEstado: [
          {
            id: '1',
            nombre: 'María García',
            nombres: 'María',
            apellidos: 'García',
            email: 'maria.garcia@sanmartin.edu',
            area: 'Matemáticas',
            estado: 'presente',
            horaEntrada: '07:45'
          },
          {
            id: '2',
            nombre: 'Carlos Rodríguez',
            nombres: 'Carlos',
            apellidos: 'Rodríguez',
            email: 'carlos.rodriguez@sanmartin.edu',
            area: 'Ciencias',
            estado: 'tardanza',
            horaEntrada: '08:20'
          },
          {
            id: '3',
            nombre: 'Ana López',
            nombres: 'Ana',
            apellidos: 'López',
            email: 'ana.lopez@sanmartin.edu',
            area: 'Historia',
            estado: 'ausente'
          },
          {
            id: '4',
            nombre: 'Pedro Martínez',
            nombres: 'Pedro',
            apellidos: 'Martínez',
            email: 'pedro.martinez@sanmartin.edu',
            area: 'Educación Física',
            estado: 'presente',
            horaEntrada: '07:30'
          },
          {
            id: '5',
            nombre: 'Laura Silva',
            nombres: 'Laura',
            apellidos: 'Silva',
            email: 'laura.silva@sanmartin.edu',
            area: 'Inglés',
            estado: 'presente',
            horaEntrada: '07:55'
          }
        ],
        isLoading: false,
        error: 'No se pudo cargar el estado actual de docentes. Mostrando datos de ejemplo.'
      });
    }
  },

  // Exportar reportes
  exportarReporte: async (tipo: 'pdf' | 'excel', filtros = {}) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await api.post('/admin/reportes/exportar', {
        tipo,
        filtros
      }, {
        responseType: 'blob'
      });
      
      // Crear URL para descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Generar nombre del archivo
      const fecha = new Date().toISOString().split('T')[0];
      const extension = tipo === 'pdf' ? 'pdf' : 'xlsx';
      link.download = `reporte_asistencias_${fecha}.${extension}`;
      
      // Descargar archivo
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      set({ isLoading: false });
    } catch (error: any) {
      console.error('Error al exportar reporte:', error);
      set({ 
        isLoading: false,
        error: 'Error al exportar el reporte. Inténtalo de nuevo.' 
      });
    }
  },

  // Cargar datos de asistencias de la semana
  cargarAsistenciasSemana: async () => {
    try {
      // ✅ VERIFICAR token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.warn('⚠️ No hay token disponible para cargar asistencias semanales');
        return;
      }
      
      const response = await api.get('/admin/graficos/asistencias-semana');
      
      if (response.data.success) {
        set({ asistenciasSemana: response.data.data });
      }
    } catch (error: any) {
      console.error('Error al cargar asistencias semanales:', error);
      
      // Datos de ejemplo como fallback
      set({
        asistenciasSemana: [
          { name: 'Lun', presente: 12, ausente: 3 },
          { name: 'Mar', presente: 14, ausente: 1 },
          { name: 'Mie', presente: 11, ausente: 4 },
          { name: 'Jue', presente: 13, ausente: 2 },
          { name: 'Vie', presente: 15, ausente: 0 },
        ]
      });
    }
  },

  // Cargar distribución de puntualidad
  cargarDistribucionPuntualidad: async () => {
    try {
      // ✅ VERIFICAR token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.warn('⚠️ No hay token disponible para cargar distribución de puntualidad');
        return;
      }
      
      const response = await api.get('/admin/graficos/distribucion-puntualidad');
      
      if (response.data.success) {
        set({ puntualidadData: response.data.data.distribucion });
      }
    } catch (error: any) {
      console.error('Error al cargar distribución de puntualidad:', error);
      
      // Datos de ejemplo como fallback
      set({
        puntualidadData: [
          { name: 'Puntual', value: 85, color: '#10B981' },
          { name: 'Tardanza', value: 12, color: '#F59E0B' },
          { name: 'Ausente', value: 3, color: '#EF4444' },
        ]
      });
    }
  }
}));

// Hook personalizado para estadísticas
export const useEstadisticasAdmin = () => {
  const { estadisticas, isLoading, error, cargarEstadisticasAdmin } = useAdminStore();
  
  return {
    estadisticas,
    isLoading,
    error,
    cargarEstadisticas: cargarEstadisticasAdmin
  };
};

// Hook personalizado para estado de docentes
export const useEstadoDocentes = () => {
  const { docentesEstado, isLoading, error, cargarEstadoDocentes } = useAdminStore();
  
  return {
    docentes: docentesEstado,
    isLoading,
    error,
    cargarEstado: cargarEstadoDocentes
  };
};

// Hook personalizado para reportes
export const useReportes = () => {
  const { isLoading, error, exportarReporte } = useAdminStore();
  
  return {
    isLoading,
    error,
    exportar: exportarReporte
  };
};

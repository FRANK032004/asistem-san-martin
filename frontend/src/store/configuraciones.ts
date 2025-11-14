import { create } from 'zustand';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

// ==================== INTERFACES ====================
export interface ConfiguracionesGeneral {
  nombreInstituto: string;
  logoUrl: string;
  direccion: string;
  telefono: string;
  email: string;
  sitioWeb: string;
  descripcion: string;
}

export interface ConfiguracionesAsistencia {
  radioToleranciaGPS: number;
  tiempoGraciaEntrada: number;
  tiempoGraciaSalida: number;
  horasTrabajoMinimas: number;
  permitirRegistroOffline: boolean;
  validarUbicacionSalida: boolean;
}

export interface ConfiguracionesNotificaciones {
  emailNotificaciones: boolean;
  notificacionesTardanza: boolean;
  notificacionesAusencia: boolean;
  recordatorioRegistro: boolean;
  horariosNotificacion: string[];
}

export interface ConfiguracionesSeguridad {
  tiempoExpiracionSesion: number;
  intentosLoginMaximos: number;
  requiereConfirmacionEmail: boolean;
  forzarCambioPasswordInicial: boolean;
  longitudMinimaPassword: number;
}

export interface ConfiguracionesSistema {
  modoMantenimiento: boolean;
  mensajeMantenimiento: string;
  versionSistema: string;
  ultimaActualizacion: string;
  backupAutomatico: boolean;
  frecuenciaBackup: string;
}

export interface TodasConfiguraciones {
  general: ConfiguracionesGeneral;
  asistencia: ConfiguracionesAsistencia;
  notificaciones: ConfiguracionesNotificaciones;
  seguridad: ConfiguracionesSeguridad;
  sistema: ConfiguracionesSistema;
}

// ==================== ESTADO DEL STORE ====================
interface ConfiguracionesState {
  configuraciones: TodasConfiguraciones | null;
  cargando: boolean;
  error: string | null;
  cargarConfiguraciones: () => Promise<void>;
  guardarConfiguraciones: (config: TodasConfiguraciones) => Promise<boolean>;
  restaurarDefecto: () => Promise<boolean>;
}

// ==================== VALORES POR DEFECTO ====================
const configuracionesDefecto: TodasConfiguraciones = {
  general: {
    nombreInstituto: 'Instituto San Martín',
    logoUrl: '/logo-instituto.png',
    direccion: 'Av. Arequipa 1234, Lima, Perú',
    telefono: '+51 1 234-5678',
    email: 'contacto@sanmartin.edu.pe',
    sitioWeb: 'https://www.sanmartin.edu.pe',
    descripcion: 'Institución educativa comprometida con la excelencia académica'
  },
  asistencia: {
    radioToleranciaGPS: 100,
    tiempoGraciaEntrada: 15,
    tiempoGraciaSalida: 10,
    horasTrabajoMinimas: 6,
    permitirRegistroOffline: true,
    validarUbicacionSalida: true
  },
  notificaciones: {
    emailNotificaciones: true,
    notificacionesTardanza: true,
    notificacionesAusencia: true,
    recordatorioRegistro: true,
    horariosNotificacion: ['08:00', '17:00']
  },
  seguridad: {
    tiempoExpiracionSesion: 480,
    intentosLoginMaximos: 5,
    requiereConfirmacionEmail: false,
    forzarCambioPasswordInicial: true,
    longitudMinimaPassword: 8
  },
  sistema: {
    modoMantenimiento: false,
    mensajeMantenimiento: 'El sistema está en mantenimiento. Intente más tarde.',
    versionSistema: '2.1.0',
    ultimaActualizacion: new Date().toISOString().split('T')[0],
    backupAutomatico: true,
    frecuenciaBackup: 'diario'
  }
};

// ==================== STORE DE ZUSTAND ====================
export const useConfiguracionesStore = create<ConfiguracionesState>((set) => ({
  configuraciones: null,
  cargando: false,
  error: null,

  // Cargar configuraciones desde el backend
  cargarConfiguraciones: async () => {
    set({ cargando: true, error: null });
    try {
      const response = await api.get('/admin/configuraciones');
      
      if (response.data.success) {
        set({ 
          configuraciones: response.data.data,
          cargando: false,
          error: null
        });
      } else {
        throw new Error(response.data.message || 'Error al cargar configuraciones');
      }
    } catch (error: any) {
      console.error('Error cargando configuraciones:', error);
      
      // Si hay error, usar valores por defecto
      set({ 
        configuraciones: configuracionesDefecto,
        cargando: false,
        error: error.response?.data?.message || 'Error de conexión'
      });
      
      toast.error('Error al cargar configuraciones. Usando valores por defecto.');
    }
  },

  // Guardar configuraciones
  guardarConfiguraciones: async (configuraciones: TodasConfiguraciones) => {
    set({ cargando: true, error: null });
    try {
      const response = await api.put('/admin/configuraciones', configuraciones);
      
      if (response.data.success) {
        set({ 
          configuraciones,
          cargando: false,
          error: null
        });
        
        toast.success('Configuraciones guardadas exitosamente');
        return true;
      } else {
        throw new Error(response.data.message || 'Error al guardar configuraciones');
      }
    } catch (error: any) {
      console.error('Error guardando configuraciones:', error);
      
      set({ 
        cargando: false,
        error: error.response?.data?.message || 'Error al guardar'
      });
      
      toast.error(error.response?.data?.message || 'Error al guardar las configuraciones');
      return false;
    }
  },

  // Restaurar configuraciones por defecto
  restaurarDefecto: async () => {
    set({ cargando: true, error: null });
    try {
      const response = await api.post('/admin/configuraciones/restaurar');
      
      if (response.data.success) {
        // Recargar configuraciones
        const responseGet = await api.get('/admin/configuraciones');
        
        if (responseGet.data.success) {
          set({ 
            configuraciones: responseGet.data.data,
            cargando: false,
            error: null
          });
        }
        
        toast.success('Configuraciones restauradas a valores por defecto');
        return true;
      } else {
        throw new Error(response.data.message || 'Error al restaurar configuraciones');
      }
    } catch (error: any) {
      console.error('Error restaurando configuraciones:', error);
      
      set({ 
        cargando: false,
        error: error.response?.data?.message || 'Error al restaurar'
      });
      
      toast.error(error.response?.data?.message || 'Error al restaurar configuraciones');
      return false;
    }
  }
}));

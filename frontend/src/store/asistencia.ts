import { create } from 'zustand';
import api from '@/lib/api';
import { Asistencia, UbicacionPermitida } from '@/types';

interface AsistenciaState {
  asistencias: Asistencia[];
  ubicacionesPermitidas: UbicacionPermitida[];
  isLoading: boolean;
  
  // Actions
  registrarEntrada: (latitud: number, longitud: number) => Promise<boolean>;
  registrarSalida: (latitud: number, longitud: number) => Promise<boolean>;
  obtenerAsistenciasHoy: () => Promise<void>;
  validarUbicacion: (latitud: number, longitud: number) => Promise<{ valida: boolean; mensaje: string }>;
  obtenerHistorial: (filtros?: any) => Promise<void>;
}

export const useAsistenciaStore = create<AsistenciaState>((set, get) => ({
  asistencias: [],
  ubicacionesPermitidas: [],
  isLoading: false,

  registrarEntrada: async (latitud: number, longitud: number) => {
    try {
      set({ isLoading: true });
      
      const response = await api.post('/asistencias/entrada', {
        latitud: latitud.toString(),
        longitud: longitud.toString()
      });
      
      set({ isLoading: false });
      
      if (response.data.success) {
        // Actualizar lista de asistencias
        get().obtenerAsistenciasHoy();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error registrando entrada:', error);
      set({ isLoading: false });
      return false;
    }
  },

  registrarSalida: async (latitud: number, longitud: number) => {
    try {
      set({ isLoading: true });
      
      const response = await api.put('/asistencias/salida', {
        latitud: latitud.toString(),
        longitud: longitud.toString()
      });
      
      set({ isLoading: false });
      
      if (response.data.success) {
        // Actualizar lista de asistencias
        get().obtenerAsistenciasHoy();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error registrando salida:', error);
      set({ isLoading: false });
      return false;
    }
  },

  obtenerAsistenciasHoy: async () => {
    try {
      set({ isLoading: true });
      
      const response = await api.get('/asistencias/hoy');
      
      if (response.data.success) {
        set({ 
          asistencias: response.data.data,
          isLoading: false 
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error obteniendo asistencias:', error);
      set({ isLoading: false });
    }
  },

  validarUbicacion: async (latitud: number, longitud: number) => {
    try {
      const response = await api.post('/asistencias/validar-ubicacion', {
        latitud: latitud.toString(),
        longitud: longitud.toString()
      });
      
      if (response.data.success) {
        const { ubicacion_valida, ubicacion_mas_cercana, distancia_minima } = response.data.data;
        
        return {
          valida: ubicacion_valida,
          mensaje: ubicacion_valida 
            ? 'Ubicación válida para registro'
            : `Fuera del área permitida. Ubicación más cercana: ${ubicacion_mas_cercana} (${distancia_minima}m)`
        };
      }
      
      return {
        valida: false,
        mensaje: 'Error validando ubicación'
      };
    } catch (error) {
      console.error('Error validando ubicación:', error);
      return {
        valida: false,
        mensaje: 'Error de conexión'
      };
    }
  },

  obtenerHistorial: async (filtros = {}) => {
    try {
      set({ isLoading: true });
      
      const params = new URLSearchParams(filtros);
      const response = await api.get(`/asistencias/historial?${params}`);
      
      if (response.data.success) {
        set({ 
          asistencias: response.data.data.asistencias,
          isLoading: false 
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      set({ isLoading: false });
    }
  }
}));

import { create } from 'zustand';
import { 
  docentePanelService, 
  MiDashboard, 
  MiPerfil, 
  MisHorarios,
  AsistenciaHoy,
  HistorialAsistencias,
  EstadisticasMes,
  ComparativaInstitucional
} from '@/services/docente-panel.service';

/**
 * Store de Zustand para el módulo Docente
 * Gestiona el estado global del panel docente
 * ACTUALIZADO: Integrado con Service Layer optimizado
 */

interface DocenteState {
  // ========== ESTADO ==========
  dashboard: MiDashboard | null;
  perfil: MiPerfil | null;
  horarios: MisHorarios | null;
  asistenciaHoy: AsistenciaHoy | null;
  historialAsistencias: HistorialAsistencias | null;
  estadisticasMes: EstadisticasMes | null;
  comparativaInstitucional: ComparativaInstitucional | null;
  
  // Estados de carga
  loadingDashboard: boolean;
  loadingPerfil: boolean;
  loadingHorarios: boolean;
  loadingAsistenciaHoy: boolean;
  loadingHistorial: boolean;
  loadingEstadisticas: boolean;
  loadingComparativa: boolean;
  
  // Errores
  errorDashboard: string | null;
  errorPerfil: string | null;
  errorHorarios: string | null;
  errorAsistenciaHoy: string | null;
  errorHistorial: string | null;
  errorEstadisticas: string | null;
  errorComparativa: string | null;
  
  // Estado de registro de asistencia
  registrandoEntrada: boolean;
  registrandoSalida: boolean;
  
  // ========== ACCIONES ==========
  
  // Dashboard
  cargarDashboard: () => Promise<void>;
  limpiarDashboard: () => void;
  
  // Perfil
  cargarPerfil: () => Promise<void>;
  actualizarPerfil: (datos: {
    telefono?: string;
    direccion?: string;
    contactoEmergencia?: string;
    telefonoEmergencia?: string;
  }) => Promise<void>;
  limpiarPerfil: () => void;
  
  // Horarios
  cargarHorarios: (activo?: boolean) => Promise<void>;
  limpiarHorarios: () => void;
  
  // Asistencia
  registrarEntrada: (latitud: number, longitud: number, precision?: number) => Promise<any>;
  registrarSalida: (latitud: number, longitud: number, precision?: number) => Promise<any>;
  cargarAsistenciaHoy: () => Promise<void>;
  cargarHistorialAsistencias: (limite?: number, offset?: number) => Promise<void>;
  
  // Estadísticas
  cargarEstadisticasMes: (mes?: number, anio?: number) => Promise<void>;
  cargarComparativaInstitucional: () => Promise<void>;
  
  // Reset general
  resetStore: () => void;
}

export const useDocenteStore = create<DocenteState>((set, get) => ({
  // ========== ESTADO INICIAL ==========
  dashboard: null,
  perfil: null,
  horarios: null,
  asistenciaHoy: null,
  historialAsistencias: null,
  estadisticasMes: null,
  comparativaInstitucional: null,
  
  loadingDashboard: false,
  loadingPerfil: false,
  loadingHorarios: false,
  loadingAsistenciaHoy: false,
  loadingHistorial: false,
  loadingEstadisticas: false,
  loadingComparativa: false,
  
  errorDashboard: null,
  errorPerfil: null,
  errorHorarios: null,
  errorAsistenciaHoy: null,
  errorHistorial: null,
  errorEstadisticas: null,
  errorComparativa: null,
  
  registrandoEntrada: false,
  registrandoSalida: false,
  
  // ========== ACCIONES: DASHBOARD ==========
  
  cargarDashboard: async () => {
    set({ loadingDashboard: true, errorDashboard: null });
    
    try {
      console.log('📊 [Store] Cargando dashboard...');
      const dashboard = await docentePanelService.obtenerMiDashboard();
      
      set({ 
        dashboard, 
        loadingDashboard: false,
        errorDashboard: null 
      });
      
      console.log('✅ [Store] Dashboard cargado:', dashboard);
    } catch (error: any) {
      console.error('❌ [Store] Error al cargar dashboard:', error);
      
      set({ 
        dashboard: null,
        loadingDashboard: false,
        errorDashboard: error.message || 'Error al cargar dashboard'
      });
      
      throw error;
    }
  },
  
  limpiarDashboard: () => {
    set({ 
      dashboard: null, 
      loadingDashboard: false, 
      errorDashboard: null 
    });
  },
  
  // ========== ACCIONES: PERFIL ==========
  
  cargarPerfil: async () => {
    set({ loadingPerfil: true, errorPerfil: null });
    
    try {
      console.log('👤 [Store] Cargando perfil...');
      const perfil = await docentePanelService.obtenerMiPerfil();
      
      set({ 
        perfil, 
        loadingPerfil: false,
        errorPerfil: null 
      });
      
      console.log('✅ [Store] Perfil cargado:', perfil);
    } catch (error: any) {
      console.error('❌ [Store] Error al cargar perfil:', error);
      
      set({ 
        perfil: null,
        loadingPerfil: false,
        errorPerfil: error.message || 'Error al cargar perfil'
      });
      
      throw error;
    }
  },
  
  actualizarPerfil: async (datos) => {
    set({ loadingPerfil: true, errorPerfil: null });
    
    try {
      console.log('✏️ [Store] Actualizando perfil...', datos);
      const perfilActualizado = await docentePanelService.actualizarMiPerfil(datos);
      
      set({ 
        perfil: perfilActualizado, 
        loadingPerfil: false,
        errorPerfil: null 
      });
      
      console.log('✅ [Store] Perfil actualizado:', perfilActualizado);
    } catch (error: any) {
      console.error('❌ [Store] Error al actualizar perfil:', error);
      
      set({ 
        loadingPerfil: false,
        errorPerfil: error.message || 'Error al actualizar perfil'
      });
      
      throw error;
    }
  },
  
  limpiarPerfil: () => {
    set({ 
      perfil: null, 
      loadingPerfil: false, 
      errorPerfil: null 
    });
  },
  
  // ========== ACCIONES: HORARIOS ==========
  
  cargarHorarios: async (activo = true) => {
    set({ loadingHorarios: true, errorHorarios: null });
    
    try {
      console.log('📅 [Store] Cargando horarios...');
      const horarios = await docentePanelService.obtenerMisHorarios(activo);
      
      set({ 
        horarios, 
        loadingHorarios: false,
        errorHorarios: null 
      });
      
      console.log('✅ [Store] Horarios cargados:', horarios);
    } catch (error: any) {
      console.error('❌ [Store] Error al cargar horarios:', error);
      
      set({ 
        horarios: null,
        loadingHorarios: false,
        errorHorarios: error.message || 'Error al cargar horarios'
      });
      
      throw error;
    }
  },
  
  limpiarHorarios: () => {
    set({ 
      horarios: null, 
      loadingHorarios: false, 
      errorHorarios: null 
    });
  },
  
  // ========== ACCIONES: ASISTENCIA ==========
  
  registrarEntrada: async (latitud: number, longitud: number, precision = 50) => {
    set({ registrandoEntrada: true });
    
    try {
      console.log('📍 [Store] Registrando entrada (Service Layer)...', { latitud, longitud, precision });
      const resultado = await docentePanelService.registrarEntrada(latitud, longitud, precision);
      
      // Recargar dashboard y asistencia del día
      await Promise.all([
        get().cargarDashboard(),
        get().cargarAsistenciaHoy()
      ]);
      
      set({ registrandoEntrada: false });
      console.log('✅ [Store] Entrada registrada:', resultado);
      
      return resultado;
    } catch (error: any) {
      console.error('❌ [Store] Error al registrar entrada:', error);
      set({ registrandoEntrada: false });
      throw error;
    }
  },
  
  registrarSalida: async (latitud: number, longitud: number, precision = 50) => {
    set({ registrandoSalida: true });
    
    try {
      console.log('📍 [Store] Registrando salida (Service Layer)...', { latitud, longitud, precision });
      const resultado = await docentePanelService.registrarSalida(latitud, longitud, precision);
      
      // Recargar dashboard y asistencia del día
      await Promise.all([
        get().cargarDashboard(),
        get().cargarAsistenciaHoy()
      ]);
      
      set({ registrandoSalida: false });
      console.log('✅ [Store] Salida registrada:', resultado);
      
      return resultado;
    } catch (error: any) {
      console.error('❌ [Store] Error al registrar salida:', error);
      set({ registrandoSalida: false });
      throw error;
    }
  },
  
  cargarAsistenciaHoy: async () => {
    set({ loadingAsistenciaHoy: true, errorAsistenciaHoy: null });
    
    try {
      console.log('📅 [Store] Cargando asistencia del día...');
      const asistenciaHoy = await docentePanelService.obtenerAsistenciaHoy();
      
      set({ 
        asistenciaHoy, 
        loadingAsistenciaHoy: false,
        errorAsistenciaHoy: null 
      });
      
      console.log('✅ [Store] Asistencia del día cargada:', asistenciaHoy);
    } catch (error: any) {
      console.error('❌ [Store] Error al cargar asistencia del día:', error);
      
      set({ 
        asistenciaHoy: null,
        loadingAsistenciaHoy: false,
        errorAsistenciaHoy: error.message || 'Error al cargar asistencia del día'
      });
      
      throw error;
    }
  },
  
  cargarHistorialAsistencias: async (limite = 20, offset = 0) => {
    set({ loadingHistorial: true, errorHistorial: null });
    
    try {
      console.log('📋 [Store] Cargando historial de asistencias...');
      const historialAsistencias = await docentePanelService.obtenerHistorialAsistencias(limite, offset);
      
      set({ 
        historialAsistencias, 
        loadingHistorial: false,
        errorHistorial: null 
      });
      
      console.log('✅ [Store] Historial cargado:', historialAsistencias);
    } catch (error: any) {
      console.error('❌ [Store] Error al cargar historial:', error);
      
      set({ 
        historialAsistencias: null,
        loadingHistorial: false,
        errorHistorial: error.message || 'Error al cargar historial'
      });
      
      throw error;
    }
  },
  
  // ========== ACCIONES: ESTADÍSTICAS ==========
  
  cargarEstadisticasMes: async (mes?: number, anio?: number) => {
    set({ loadingEstadisticas: true, errorEstadisticas: null });
    
    try {
      console.log('📊 [Store] Cargando estadísticas del mes...');
      const estadisticasMes = await docentePanelService.obtenerEstadisticasMes(mes, anio);
      
      set({ 
        estadisticasMes, 
        loadingEstadisticas: false,
        errorEstadisticas: null 
      });
      
      console.log('✅ [Store] Estadísticas del mes cargadas:', estadisticasMes);
    } catch (error: any) {
      console.error('❌ [Store] Error al cargar estadísticas:', error);
      
      set({ 
        estadisticasMes: null,
        loadingEstadisticas: false,
        errorEstadisticas: error.message || 'Error al cargar estadísticas'
      });
      
      throw error;
    }
  },
  
  cargarComparativaInstitucional: async () => {
    set({ loadingComparativa: true, errorComparativa: null });
    
    try {
      console.log('📈 [Store] Cargando comparativa institucional...');
      const comparativaInstitucional = await docentePanelService.obtenerComparativaInstitucional();
      
      set({ 
        comparativaInstitucional, 
        loadingComparativa: false,
        errorComparativa: null 
      });
      
      console.log('✅ [Store] Comparativa institucional cargada:', comparativaInstitucional);
    } catch (error: any) {
      console.error('❌ [Store] Error al cargar comparativa:', error);
      
      set({ 
        comparativaInstitucional: null,
        loadingComparativa: false,
        errorComparativa: error.message || 'Error al cargar comparativa'
      });
      
      throw error;
    }
  },
  
  // ========== RESET ==========
  
  resetStore: () => {
    set({
      dashboard: null,
      perfil: null,
      horarios: null,
      asistenciaHoy: null,
      historialAsistencias: null,
      estadisticasMes: null,
      comparativaInstitucional: null,
      loadingDashboard: false,
      loadingPerfil: false,
      loadingHorarios: false,
      loadingAsistenciaHoy: false,
      loadingHistorial: false,
      loadingEstadisticas: false,
      loadingComparativa: false,
      errorDashboard: null,
      errorPerfil: null,
      errorHorarios: null,
      errorAsistenciaHoy: null,
      errorHistorial: null,
      errorEstadisticas: null,
      errorComparativa: null,
      registrandoEntrada: false,
      registrandoSalida: false,
    });
    
    console.log('🔄 [Store] Store reseteado');
  },
}));

// ========== SELECTORES ÚTILES ==========

/**
 * Hook para obtener solo el dashboard
 * Optimizado para evitar re-renders innecesarios
 */
export const useDashboard = () => {
  const dashboard = useDocenteStore((state) => state.dashboard);
  const loading = useDocenteStore((state) => state.loadingDashboard);
  const error = useDocenteStore((state) => state.errorDashboard);
  const cargar = useDocenteStore((state) => state.cargarDashboard);
  const limpiar = useDocenteStore((state) => state.limpiarDashboard);
  
  return { dashboard, loading, error, cargar, limpiar };
};

/**
 * Hook para obtener solo el perfil
 * Optimizado para evitar re-renders innecesarios
 */
export const usePerfil = () => {
  const perfil = useDocenteStore((state) => state.perfil);
  const loading = useDocenteStore((state) => state.loadingPerfil);
  const error = useDocenteStore((state) => state.errorPerfil);
  const cargar = useDocenteStore((state) => state.cargarPerfil);
  const actualizar = useDocenteStore((state) => state.actualizarPerfil);
  const limpiar = useDocenteStore((state) => state.limpiarPerfil);
  
  return { perfil, loading, error, cargar, actualizar, limpiar };
};

/**
 * Hook para obtener solo los horarios
 * Optimizado para evitar re-renders innecesarios
 */
export const useHorarios = () => {
  const horarios = useDocenteStore((state) => state.horarios);
  const loading = useDocenteStore((state) => state.loadingHorarios);
  const error = useDocenteStore((state) => state.errorHorarios);
  const cargar = useDocenteStore((state) => state.cargarHorarios);
  const limpiar = useDocenteStore((state) => state.limpiarHorarios);
  
  return { horarios, loading, error, cargar, limpiar };
};

/**
 * Hook para registro de asistencia con GPS
 * ACTUALIZADO: Integrado con Service Layer optimizado
 */
export const useAsistencia = () => {
  const asistenciaHoy = useDocenteStore((state) => state.asistenciaHoy);
  const registrandoEntrada = useDocenteStore((state) => state.registrandoEntrada);
  const registrandoSalida = useDocenteStore((state) => state.registrandoSalida);
  const loadingAsistenciaHoy = useDocenteStore((state) => state.loadingAsistenciaHoy);
  const errorAsistenciaHoy = useDocenteStore((state) => state.errorAsistenciaHoy);
  const registrarEntrada = useDocenteStore((state) => state.registrarEntrada);
  const registrarSalida = useDocenteStore((state) => state.registrarSalida);
  const cargarAsistenciaHoy = useDocenteStore((state) => state.cargarAsistenciaHoy);
  
  return { 
    asistenciaHoy,
    registrandoEntrada, 
    registrandoSalida, 
    loadingAsistenciaHoy,
    errorAsistenciaHoy,
    registrarEntrada, 
    registrarSalida,
    cargarAsistenciaHoy
  };
};

/**
 * Hook para historial de asistencias
 * NUEVO: Paginación incluida
 */
export const useHistorialAsistencias = () => {
  const historial = useDocenteStore((state) => state.historialAsistencias);
  const loading = useDocenteStore((state) => state.loadingHistorial);
  const error = useDocenteStore((state) => state.errorHistorial);
  const cargar = useDocenteStore((state) => state.cargarHistorialAsistencias);
  
  return { historial, loading, error, cargar };
};

/**
 * Hook para estadísticas del mes
 * NUEVO: Service Layer optimizado
 */
export const useEstadisticasMes = () => {
  const estadisticas = useDocenteStore((state) => state.estadisticasMes);
  const loading = useDocenteStore((state) => state.loadingEstadisticas);
  const error = useDocenteStore((state) => state.errorEstadisticas);
  const cargar = useDocenteStore((state) => state.cargarEstadisticasMes);
  
  return { estadisticas, loading, error, cargar };
};

/**
 * Hook para comparativa institucional
 * NUEVO: Comparación con promedio institucional
 */
export const useComparativaInstitucional = () => {
  const comparativa = useDocenteStore((state) => state.comparativaInstitucional);
  const loading = useDocenteStore((state) => state.loadingComparativa);
  const error = useDocenteStore((state) => state.errorComparativa);
  const cargar = useDocenteStore((state) => state.cargarComparativaInstitucional);
  
  return { comparativa, loading, error, cargar };
};

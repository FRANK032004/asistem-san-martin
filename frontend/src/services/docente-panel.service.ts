/**
 * @module DocentePanelService
 * @description Servicio para el panel de auto-gestión del docente autenticado
 * 
 * Endpoints disponibles (Service Layer - Optimizado):
 * - GET /docente/mi-dashboard - Dashboard personal (optimizado)
 * - GET /docente/mi-perfil - Perfil completo
 * - PUT /docente/mi-perfil - Actualizar perfil (self-service)
 * - GET /docente/mis-horarios - Horarios asignados
 * - POST /docente/asistencia/entrada - Registro entrada con GPS
 * - POST /docente/asistencia/salida - Registro salida con GPS
 * - GET /docente/asistencia/hoy - Estado asistencia hoy
 * - GET /docente/asistencia/historial - Historial paginado
 * - GET /docente/estadisticas/mes - Estadísticas mensuales
 * - GET /docente/estadisticas/comparativa - Comparación institucional
 */

import api from '@/lib/api';

// ========== TIPOS ==========

export interface MiPerfil {
  docentes: {
    id: string;
    codigo_docente: string;
    fecha_ingreso: string;
    horario_entrada: string;
    horario_salida: string;
    estado: string;
    estado_civil?: string;
    fecha_nacimiento?: string;
    direccion?: string;
    contacto_emergencia?: string;
    telefono_emergencia?: string;
    banco?: string;
    cuenta_bancaria?: string;
    observaciones?: string;
  };
  usuarios: {
    id: string;
    dni: string;
    nombres: string;
    apellidos: string;
    nombreCompleto: string;
    email: string;
    telefono?: string;
    activo: boolean;
    rol: string;
  };
  areas: {
    id: number;
    nombre: string;
    descripcion?: string;
    activo: boolean;
  } | null;
  estadisticas: {
    totalAsistencias: number;
    totalHorarios: number;
    asistenciasEsteMes: number;
    tardanzasEsteMes: number;
    puntualidad: number;
    justificacionesPendientes: number;
  };
}

export interface MiDashboard {
  estadisticas: {
    asistenciasEsteMes: number;
    tardanzasEsteMes: number;
    horasLaboradas: number;
    puntualidad: number;
    justificacionesPendientes: number;
  };
  proximoHorario: {
    id: string;
    dia: string;
    horaInicio: string;
    horaFin: string;
    area: string;
    tipoClase?: string;
  } | null;
  ultimasAsistencias: Array<{
    id: string;
    fecha: string;
    horaEntrada: string | null;
    horaSalida: string | null;
    estado: string;
    tardanzaMinutos: number | null;
    horasTrabajadas: number | null;
    ubicacion: string;
  }>;
  periodo: {
    inicio: string;
    fin: string;
    mes: string;
  };
}

export interface MisHorarios {
  horarios: Array<{
    id: string;
    diaSemana: number;
    diaNombre: string;
    horaInicio: string;
    horaFin: string;
    tipoClase?: string;
    horasSemana: number;
    activo: boolean;
    area: {
      id: number;
      nombre: string;
      descripcion?: string;
    } | null;
    fechaVigencia?: string;
    fechaFin?: string;
  }>;
  horariosPorDia: Record<string, any[]>;
  estadisticas: {
    totalHorarios: number;
    horasSemanaTotales: number;
    diasConClases: number;
    distribuciones: Array<{
      dia: string;
      cantidad: number;
      horas: number;
    }>;
  };
}

export interface ActualizarMiPerfilDto {
  telefono?: string;
  direccion?: string;
  contactoEmergencia?: string;
  telefonoEmergencia?: string;
}

// ========== TIPOS NUEVOS (Service Layer) ==========

export interface RegistroAsistenciaGPS {
  latitud: number;
  longitud: number;
  precision: number;
  timestamp: number;
}

export interface ResultadoRegistroAsistencia {
  success: boolean;
  asistencia: {
    id: string;
    fecha: string;
    horaEntrada?: string;
    horaSalida?: string;
    estado: string;
    tardanzaMinutos?: number;
  };
  mensaje: string;
  tardanza?: {
    minutos: number;
    mensaje: string;
  };
  ubicacion?: {
    nombre: string;
    distancia: number;
  };
}

export interface AsistenciaHoy {
  asistenciaHoy: {
    id: string;
    fecha: string;
    horaEntrada: string | null;
    horaSalida: string | null;
    estado: string;
    tardanzaMinutos: number | null;
  } | null;
  mensaje: string;
  puedeRegistrarEntrada: boolean;
  puedeRegistrarSalida: boolean;
}

export interface HistorialAsistencias {
  asistencias: Array<{
    id: string;
    fecha: string;
    horaEntrada: string | null;
    horaSalida: string | null;
    estado: string;
    tardanzaMinutos: number | null;
    horasTrabajadas: number | null;
    ubicacion?: string;
  }>;
  paginacion: {
    total: number;
    limite: number;
    offset: number;
    paginaActual: number;
    totalPaginas: number;
  };
}

export interface EstadisticasMes {
  periodo: {
    mes: number;
    anio: number;
    nombre: string;
  };
  estadisticas: {
    diasTrabajados: number;
    asistencias: number;
    tardanzas: number;
    puntualidad: number;
    horasTotales: number;
    promedioHorasDiarias: number;
  };
  detallePorDia: Array<{
    fecha: string;
    estado: string;
    horaEntrada: string | null;
    horaSalida: string | null;
    tardanzaMinutos: number | null;
    horasTrabajadas: number | null;
  }>;
}

export interface ComparativaInstitucional {
  miRendimiento: {
    asistencias: number;
    tardanzas: number;
    puntualidad: number;
    horasTrabajadas: number;
  };
  promedioInstitucional: {
    asistencias: number;
    tardanzas: number;
    puntualidad: number;
    horasTrabajadas: number;
  };
  comparativa: {
    asistencias: { diferencia: number; porcentaje: number };
    tardanzas: { diferencia: number; porcentaje: number };
    puntualidad: { diferencia: number; porcentaje: number };
    horasTrabajadas: { diferencia: number; porcentaje: number };
  };
  posicionamiento: string;
}

// ========== SERVICIO ==========

class DocentePanelService {
  
  /**
   * Obtener mi dashboard personal
   * Endpoint: GET /docente/mi-dashboard
   * Requiere: Token JWT (DOCENTE)
   */
  async obtenerMiDashboard(): Promise<MiDashboard> {
    try {
      console.log('📊 Obteniendo dashboard del docente...');
      const response = await api.get('/docente/mi-dashboard');
      
      if (response.data?.success) {
        console.log('✅ Dashboard obtenido:', response.data.data);
        return response.data.data;
      }
      
      throw new Error('Formato de respuesta inválido');
    } catch (error: any) {
      console.error('❌ Error al obtener dashboard:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
      
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para acceder a este recurso.');
      }
      
      throw new Error(error.response?.data?.message || 'Error al obtener dashboard');
    }
  }

  /**
   * Obtener mi perfil completo
   * Endpoint: GET /docente/mi-perfil
   * Requiere: Token JWT (DOCENTE)
   */
  async obtenerMiPerfil(): Promise<MiPerfil> {
    try {
      console.log('👤 Obteniendo perfil del docente...');
      const response = await api.get('/docente/mi-perfil');
      
      if (response.data?.success) {
        console.log('✅ Perfil obtenido:', response.data.data);
        return response.data.data;
      }
      
      throw new Error('Formato de respuesta inválido');
    } catch (error: any) {
      console.error('❌ Error al obtener perfil:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
      
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para acceder a este recurso.');
      }
      
      throw new Error(error.response?.data?.message || 'Error al obtener perfil');
    }
  }

  /**
   * Actualizar mi perfil (self-service)
   * Endpoint: PUT /docente/mi-perfil
   * Requiere: Token JWT (DOCENTE)
   * 
   * Campos permitidos:
   * - telefono
   * - direccion
   * - contactoEmergencia
   * - telefonoEmergencia
   * 
   * Campos restringidos (solo admin):
   * - area, sueldo, codigoDocente
   */
  async actualizarMiPerfil(datos: ActualizarMiPerfilDto): Promise<MiPerfil> {
    try {
      console.log('✏️ Actualizando perfil del docente...', datos);
      const response = await api.put('/docente/mi-perfil', datos);
      
      if (response.data?.success) {
        console.log('✅ Perfil actualizado:', response.data.data);
        return response.data.data;
      }
      
      throw new Error('Formato de respuesta inválido');
    } catch (error: any) {
      console.error('❌ Error al actualizar perfil:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
      
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para acceder a este recurso.');
      }
      
      if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Datos inválidos');
      }
      
      throw new Error(error.response?.data?.message || 'Error al actualizar perfil');
    }
  }

  /**
   * Obtener mis horarios asignados
   * Endpoint: GET /docente/mis-horarios
   * Requiere: Token JWT (DOCENTE)
   * 
   * Query params:
   * - activo: true|false (default: true)
   */
  async obtenerMisHorarios(activo: boolean = true): Promise<MisHorarios> {
    try {
      console.log('📅 Obteniendo horarios del docente...');
      const params = new URLSearchParams();
      params.append('activo', activo.toString());
      
      const response = await api.get(`/docente/mis-horarios?${params.toString()}`);
      
      if (response.data?.success) {
        console.log('✅ Horarios obtenidos:', response.data.data);
        return response.data.data;
      }
      
      throw new Error('Formato de respuesta inválido');
    } catch (error: any) {
      console.error('❌ Error al obtener horarios:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
      
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para acceder a este recurso.');
      }
      
      throw new Error(error.response?.data?.message || 'Error al obtener horarios');
    }
  }

  /**
   * Registrar entrada con GPS (Service Layer Optimizado)
   * Endpoint: POST /docente/asistencia/entrada
   * Requiere: Token JWT (DOCENTE)
   * 
   * Validaciones automáticas:
   * - GPS precisión < 100m
   * - Timestamp actualizado (< 5 min)
   * - Ubicación dentro del radio permitido
   * - Horario correspondiente
   * - Sin duplicados
   */
  async registrarEntrada(
    latitud: number, 
    longitud: number, 
    precision: number = 50
  ): Promise<ResultadoRegistroAsistencia> {
    try {
      console.log('📍 [Service Layer] Registrando entrada...', { latitud, longitud, precision });
      
      const datos: RegistroAsistenciaGPS = {
        latitud,
        longitud,
        precision,
        timestamp: Date.now()
      };
      
      const response = await api.post('/docente/asistencia/entrada', datos);
      
      if (response.data?.success) {
        console.log('✅ Entrada registrada (Service Layer):', response.data.data);
        return response.data.data;
      }
      
      throw new Error(response.data?.message || 'Error al registrar entrada');
    } catch (error: any) {
      console.error('❌ Error al registrar entrada:', error);
      
      if (error.response?.status === 400) {
        // Errores de validación GPS/Horario
        const mensaje = error.response.data?.message || 'Ubicación fuera del rango permitido';
        throw new Error(mensaje);
      }
      
      if (error.response?.status === 409) {
        // Ya registró entrada hoy
        throw new Error('Ya has registrado tu entrada el día de hoy');
      }
      
      throw new Error(error.response?.data?.message || 'Error al registrar entrada');
    }
  }

  /**
   * Registrar salida con GPS (Service Layer Optimizado)
   * Endpoint: POST /docente/asistencia/salida
   * Requiere: Token JWT (DOCENTE)
   * 
   * Validaciones automáticas:
   * - GPS precisión < 100m
   * - Tiene entrada registrada
   * - Ubicación dentro del radio permitido
   */
  async registrarSalida(
    latitud: number, 
    longitud: number,
    precision: number = 50
  ): Promise<ResultadoRegistroAsistencia> {
    try {
      console.log('📍 [Service Layer] Registrando salida...', { latitud, longitud, precision });
      
      const datos: RegistroAsistenciaGPS = {
        latitud,
        longitud,
        precision,
        timestamp: Date.now()
      };
      
      const response = await api.post('/docente/asistencia/salida', datos);
      
      if (response.data?.success) {
        console.log('✅ Salida registrada (Service Layer):', response.data.data);
        return response.data.data;
      }
      
      throw new Error(response.data?.message || 'Error al registrar salida');
    } catch (error: any) {
      console.error('❌ Error al registrar salida:', error);
      
      if (error.response?.status === 400) {
        const mensaje = error.response.data?.message || 'Ubicación fuera del rango permitido';
        throw new Error(mensaje);
      }
      
      if (error.response?.status === 404) {
        throw new Error('No tienes una entrada registrada para el día de hoy');
      }
      
      throw new Error(error.response?.data?.message || 'Error al registrar salida');
    }
  }

  /**
   * Obtener estado de asistencia de hoy
   * Endpoint: GET /docente/asistencia/hoy
   * Requiere: Token JWT (DOCENTE)
   */
  async obtenerAsistenciaHoy(): Promise<AsistenciaHoy> {
    try {
      console.log('📅 Obteniendo asistencia del día...');
      const response = await api.get('/docente/asistencia/hoy');
      
      if (response.data?.success) {
        console.log('✅ Asistencia de hoy obtenida:', response.data.data);
        return response.data.data;
      }
      
      throw new Error('Formato de respuesta inválido');
    } catch (error: any) {
      console.error('❌ Error al obtener asistencia del día:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener asistencia del día');
    }
  }

  /**
   * Obtener historial de asistencias paginado
   * Endpoint: GET /docente/asistencia/historial
   * Requiere: Token JWT (DOCENTE)
   * 
   * @param limite - Cantidad de registros por página (default: 20)
   * @param offset - Desplazamiento para paginación (default: 0)
   */
  async obtenerHistorialAsistencias(
    limite: number = 20,
    offset: number = 0
  ): Promise<HistorialAsistencias> {
    try {
      console.log('📋 Obteniendo historial de asistencias...');
      const params = new URLSearchParams();
      params.append('limit', limite.toString());
      params.append('offset', offset.toString());
      
      const response = await api.get(`/docente/asistencia/historial?${params.toString()}`);
      
      if (response.data?.success) {
        console.log('✅ Historial obtenido:', response.data.data);
        return response.data.data;
      }
      
      throw new Error('Formato de respuesta inválido');
    } catch (error: any) {
      console.error('❌ Error al obtener historial:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener historial');
    }
  }

  /**
   * Obtener estadísticas del mes
   * Endpoint: GET /docente/estadisticas/mes
   * Requiere: Token JWT (DOCENTE)
   * 
   * @param mes - Mes (1-12, opcional, default: mes actual)
   * @param anio - Año (opcional, default: año actual)
   */
  async obtenerEstadisticasMes(mes?: number, anio?: number): Promise<EstadisticasMes> {
    try {
      console.log('📊 Obteniendo estadísticas del mes...');
      const params = new URLSearchParams();
      if (mes) params.append('mes', mes.toString());
      if (anio) params.append('anio', anio.toString());
      
      const response = await api.get(`/docente/estadisticas/mes?${params.toString()}`);
      
      if (response.data?.success) {
        console.log('✅ Estadísticas del mes obtenidas:', response.data.data);
        return response.data.data;
      }
      
      throw new Error('Formato de respuesta inválido');
    } catch (error: any) {
      console.error('❌ Error al obtener estadísticas del mes:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener estadísticas del mes');
    }
  }

  /**
   * Obtener comparativa con promedio institucional
   * Endpoint: GET /docente/estadisticas/comparativa
   * Requiere: Token JWT (DOCENTE)
   */
  async obtenerComparativaInstitucional(): Promise<ComparativaInstitucional> {
    try {
      console.log('📈 Obteniendo comparativa institucional...');
      const response = await api.get('/docente/estadisticas/comparativa');
      
      if (response.data?.success) {
        console.log('✅ Comparativa obtenida:', response.data.data);
        return response.data.data;
      }
      
      throw new Error('Formato de respuesta inválido');
    } catch (error: any) {
      console.error('❌ Error al obtener comparativa:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener comparativa');
    }
  }
}

// Exportar instancia única del servicio
export const docentePanelService = new DocentePanelService();
export default docentePanelService;

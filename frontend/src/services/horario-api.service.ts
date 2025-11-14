// Servicios API para Horarios - Instituto San Martín
// Integración completa con backend Node.js + PostgreSQL

import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface HorarioBase {
  id: number;
  docenteId: string;
  areaId: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  tipoClase?: string;
  horasSemana: number;
  activo: boolean;
  fechaVigencia?: string;
  fechaFin?: string;
  createdAt: string;
  docente?: {
    id: string;
    codigoDocente?: string;
    usuario: {
      nombres: string;
      apellidos: string;
      email: string;
      telefono?: string;
    };
  };
  area?: {
    id: number;
    nombre: string;
    descripcion?: string;
  };
  _count?: {
    horasTrabajadas: number;
  };
}

export interface EstadisticasHorarios {
  total: number;
  activos: number;
  inactivos: number;
  totalHorasSemana: number;
  promedioHorasSemana: number;
  distribuciones: Array<{
    diaSemana: number;
    nombreDia: string;
    cantidad: number;
    totalHoras: number;
  }>;
}

export interface FiltrosHorarios {
  docenteId?: string;
  areaId?: number;
  diaSemana?: number;
  activo?: boolean;
  page?: number;
  limit?: number;
}

export interface DatosHorario {
  docenteId: string;
  areaId: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  tipoClase?: string;
  horasSemana: number;
  activo?: boolean;
  fechaVigencia?: string;
  fechaFin?: string;
}

export interface RespuestaAPI<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface RespuestaHorarios {
  horarios: HorarioBase[];
  estadisticas: EstadisticasHorarios;
}

// ============================================
// FUNCIONES DE API
// ============================================

// Obtener lista de horarios con filtros y estadísticas
export const obtenerHorarios = async (filtros: FiltrosHorarios = {}): Promise<RespuestaAPI<RespuestaHorarios>> => {
  try {
    const params = new URLSearchParams();
    
    if (filtros.docenteId) params.append('docenteId', filtros.docenteId);
    if (filtros.areaId) params.append('areaId', filtros.areaId.toString());
    if (filtros.diaSemana !== undefined) params.append('diaSemana', filtros.diaSemana.toString());
    if (filtros.activo !== undefined) params.append('activo', filtros.activo.toString());
    if (filtros.page) params.append('page', filtros.page.toString());
    if (filtros.limit) params.append('limit', filtros.limit.toString());

    const response: AxiosResponse<RespuestaAPI<RespuestaHorarios>> = await axios.get(
      `${API_BASE_URL}/horarios?${params.toString()}`
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Error obteniendo horarios');
    }

    return response.data;
  } catch (error: any) {
    console.error('Error en obtenerHorarios:', error);
    throw new Error(error.response?.data?.message || 'Error de conexión con el servidor');
  }
};

// Crear nuevo horario
export const crearHorario = async (datosHorario: DatosHorario): Promise<RespuestaAPI<HorarioBase>> => {
  try {
    // Validaciones básicas
    if (!datosHorario.docenteId || !datosHorario.areaId || datosHorario.diaSemana === undefined) {
      throw new Error('Los campos docente, área y día de la semana son requeridos');
    }

    if (!datosHorario.horaInicio || !datosHorario.horaFin) {
      throw new Error('Las horas de inicio y fin son requeridas');
    }

    // Validar formato de horas (HH:MM)
    const formatoHora = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!formatoHora.test(datosHorario.horaInicio) || !formatoHora.test(datosHorario.horaFin)) {
      throw new Error('Las horas deben estar en formato HH:MM (24 horas)');
    }

    // Validar que hora inicio < hora fin
    if (datosHorario.horaInicio >= datosHorario.horaFin) {
      throw new Error('La hora de inicio debe ser menor que la hora de fin');
    }

    // Validar día de la semana
    if (datosHorario.diaSemana < 0 || datosHorario.diaSemana > 6) {
      throw new Error('El día de la semana debe estar entre 0 (Domingo) y 6 (Sábado)');
    }

    const response: AxiosResponse<RespuestaAPI<HorarioBase>> = await axios.post(
      `${API_BASE_URL}/horarios`,
      datosHorario,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Error creando horario');
    }

    return response.data;
  } catch (error: any) {
    console.error('Error en crearHorario:', error);
    throw new Error(error.response?.data?.message || error.message || 'Error de conexión con el servidor');
  }
};

// Eliminar horario
export const eliminarHorario = async (id: number): Promise<RespuestaAPI<{ id: number }>> => {
  try {
    if (!id || id <= 0) {
      throw new Error('ID del horario no válido');
    }

    const response: AxiosResponse<RespuestaAPI<{ id: number }>> = await axios.delete(
      `${API_BASE_URL}/horarios/${id}`
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Error eliminando horario');
    }

    return response.data;
  } catch (error: any) {
    console.error('Error en eliminarHorario:', error);
    throw new Error(error.response?.data?.message || 'Error de conexión con el servidor');
  }
};

// ============================================
// FUNCIONES UTILITARIAS
// ============================================

// Formatear nombre completo del docente
export const formatearNombreDocente = (horario: HorarioBase): string => {
  if (horario.docente?.usuario) {
    return `${horario.docente.usuario.nombres} ${horario.docente.usuario.apellidos}`.trim();
  }
  return 'Sin información';
};

// Formatear código y nombre del docente
export const formatearCodigoDocente = (horario: HorarioBase): string => {
  const nombre = formatearNombreDocente(horario);
  const codigo = horario.docente?.codigoDocente;
  return codigo ? `${codigo} - ${nombre}` : nombre;
};

// Obtener nombre del día de la semana
export const obtenerNombreDia = (diaSemana: number): string => {
  const dias = [
    'Domingo', 
    'Lunes', 
    'Martes', 
    'Miércoles', 
    'Jueves', 
    'Viernes', 
    'Sábado'
  ];
  return dias[diaSemana] || 'Día no válido';
};

// Formatear hora de 24h a 12h
export const formatearHora12h = (hora24: string): string => {
  try {
    const [horas, minutos] = hora24.split(':');
    const horaNum = parseInt(horas);
    const periodo = horaNum >= 12 ? 'PM' : 'AM';
    const hora12 = horaNum === 0 ? 12 : horaNum > 12 ? horaNum - 12 : horaNum;
    return `${hora12}:${minutos} ${periodo}`;
  } catch (error) {
    return hora24; // Retornar formato original si hay error
  }
};

// Formatear rango de horas
export const formatearRangoHoras = (horaInicio: string, horaFin: string): string => {
  return `${formatearHora12h(horaInicio)} - ${formatearHora12h(horaFin)}`;
};

// Calcular duración en horas
export const calcularDuracionHoras = (horaInicio: string, horaFin: string): number => {
  try {
    const [horasInicio, minutosInicio] = horaInicio.split(':').map(Number);
    const [horasFin, minutosFin] = horaFin.split(':').map(Number);
    
    const inicioMinutos = horasInicio * 60 + minutosInicio;
    const finMinutos = horasFin * 60 + minutosFin;
    
    return (finMinutos - inicioMinutos) / 60;
  } catch (error) {
    return 0;
  }
};

// Obtener color para el estado
export const obtenerColorEstado = (activo: boolean): string => {
  return activo ? 'success' : 'secondary';
};

// Obtener texto del estado
export const obtenerTextoEstado = (activo: boolean): string => {
  return activo ? 'Activo' : 'Inactivo';
};

// Validar si una hora está en formato válido
export const validarFormatoHora = (hora: string): boolean => {
  const formato = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return formato.test(hora);
};

// Obtener opciones de días de la semana
export const obtenerOpcionesDias = () => [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' }
];

// Obtener opciones de tipos de clase
export const obtenerTiposClase = () => [
  { value: 'TEORICA', label: 'Teórica' },
  { value: 'PRACTICA', label: 'Práctica' },
  { value: 'LABORATORIO', label: 'Laboratorio' },
  { value: 'TALLER', label: 'Taller' },
  { value: 'SEMINARIO', label: 'Seminario' },
  { value: 'TUTORIA', label: 'Tutoría' }
];

export default {
  obtenerHorarios,
  crearHorario,
  eliminarHorario,
  formatearNombreDocente,
  formatearCodigoDocente,
  obtenerNombreDia,
  formatearHora12h,
  formatearRangoHoras,
  calcularDuracionHoras,
  obtenerColorEstado,
  obtenerTextoEstado,
  validarFormatoHora,
  obtenerOpcionesDias,
  obtenerTiposClase
};
import axios from 'axios';

// URL base del API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ========================================
// INTERFACES Y TIPOS
// ========================================

export interface Coordinador {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  dni?: string;
}

export interface Area {
  id: number;
  nombre: string;
  descripcion: string | null;
  codigo: string | null;
  colorHex: string | null;
  coordinadorId: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  coordinador?: Coordinador | null;
  _count?: {
    docentes: number;
    horarios: number;
  };
}

export interface EstadisticasAreas {
  total: number;
  activas: number;
  inactivas: number;
  conCoordinador: number;
  sinCoordinador: number;
  totalDocentes: number;
  totalHorarios: number;
  distribucion: {
    areaId: number;
    areaNombre: string;
    totalDocentes: number;
    totalHorarios: number;
  }[];
}

export interface FiltrosAreas {
  activo?: boolean;
  coordinadorId?: string;
  busqueda?: string;
}

export interface DatosArea {
  nombre: string;
  descripcion?: string;
  codigo?: string;
  colorHex?: string;
  coordinadorId?: string;
  activo?: boolean;
}

export interface RespuestaAreas {
  success: boolean;
  message: string;
  data: {
    areas: Area[];
    estadisticas: EstadisticasAreas;
  };
}

export interface RespuestaArea {
  success: boolean;
  message: string;
  data: Area;
}

// ========================================
// FUNCIONES API
// ========================================

/**
 * Obtener todas las áreas con filtros opcionales
 */
export const obtenerAreas = async (filtros?: FiltrosAreas): Promise<RespuestaAreas> => {
  try {
    const params = new URLSearchParams();
    
    if (filtros?.activo !== undefined) {
      params.append('activo', filtros.activo.toString());
    }
    
    if (filtros?.coordinadorId) {
      params.append('coordinadorId', filtros.coordinadorId);
    }
    
    if (filtros?.busqueda) {
      params.append('busqueda', filtros.busqueda);
    }

    const queryString = params.toString();
    const url = `${API_BASE_URL}/areas${queryString ? `?${queryString}` : ''}`;
    
    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error('Error obteniendo áreas:', error);
    throw new Error(
      error.response?.data?.message || 
      'Error al obtener áreas. Verifica tu conexión.'
    );
  }
};

/**
 * Obtener un área por ID
 */
export const obtenerAreaPorId = async (id: number): Promise<RespuestaArea> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/areas/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error obteniendo área:', error);
    throw new Error(
      error.response?.data?.message || 
      'Error al obtener área'
    );
  }
};

/**
 * Crear nueva área
 */
export const crearArea = async (datos: DatosArea): Promise<RespuestaArea> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/areas`, datos);
    return response.data;
  } catch (error: any) {
    console.error('Error creando área:', error);
    throw new Error(
      error.response?.data?.message || 
      'Error al crear área'
    );
  }
};

/**
 * Actualizar área existente
 */
export const actualizarArea = async (id: number, datos: DatosArea): Promise<RespuestaArea> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/areas/${id}`, datos);
    return response.data;
  } catch (error: any) {
    console.error('Error actualizando área:', error);
    throw new Error(
      error.response?.data?.message || 
      'Error al actualizar área'
    );
  }
};

/**
 * Eliminar área
 */
export const eliminarArea = async (id: number): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/areas/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error eliminando área:', error);
    throw new Error(
      error.response?.data?.message || 
      'Error al eliminar área'
    );
  }
};

/**
 * Cambiar estado de área (activar/desactivar)
 */
export const cambiarEstadoArea = async (id: number, activo: boolean): Promise<RespuestaArea> => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/areas/${id}/estado`, { activo });
    return response.data;
  } catch (error: any) {
    console.error('Error cambiando estado:', error);
    throw new Error(
      error.response?.data?.message || 
      'Error al cambiar estado del área'
    );
  }
};

// ========================================
// FUNCIONES AUXILIARES
// ========================================

/**
 * Formatear nombre del coordinador
 */
export const formatearNombreCoordinador = (area: Area): string => {
  if (!area.coordinador) return 'Sin coordinador';
  return `${area.coordinador.nombres} ${area.coordinador.apellidos}`.trim();
};

/**
 * Obtener color del estado
 */
export const obtenerColorEstado = (activo: boolean): string => {
  return activo ? 'success' : 'secondary';
};

/**
 * Obtener texto del estado
 */
export const obtenerTextoEstado = (activo: boolean): string => {
  return activo ? 'Activo' : 'Inactivo';
};

/**
 * Generar opciones de colores predefinidos para áreas
 */
export const obtenerColoresPredefinidos = () => [
  { value: '#3B82F6', label: 'Azul', hex: '#3B82F6' },
  { value: '#10B981', label: 'Verde', hex: '#10B981' },
  { value: '#F59E0B', label: 'Naranja', hex: '#F59E0B' },
  { value: '#EF4444', label: 'Rojo', hex: '#EF4444' },
  { value: '#8B5CF6', label: 'Púrpura', hex: '#8B5CF6' },
  { value: '#EC4899', label: 'Rosa', hex: '#EC4899' },
  { value: '#06B6D4', label: 'Cyan', hex: '#06B6D4' },
  { value: '#84CC16', label: 'Lima', hex: '#84CC16' },
  { value: '#6366F1', label: 'Índigo', hex: '#6366F1' },
  { value: '#14B8A6', label: 'Teal', hex: '#14B8A6' },
];

/**
 * Validar código de área (formato: AA-NNN)
 */
export const validarCodigoArea = (codigo: string): boolean => {
  const regex = /^[A-Z]{2,3}-[0-9]{2,3}$/;
  return regex.test(codigo);
};

/**
 * Generar código sugerido basado en el nombre
 */
export const generarCodigoSugerido = (nombre: string): string => {
  const palabras = nombre.trim().split(' ');
  let iniciales = '';
  
  if (palabras.length === 1) {
    iniciales = palabras[0].substring(0, 3).toUpperCase();
  } else {
    iniciales = palabras
      .slice(0, 3)
      .map(p => p[0])
      .join('')
      .toUpperCase();
  }
  
  const numero = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${iniciales}-${numero}`;
};

/**
 * Formatear estadísticas para gráficos
 */
export const formatearEstadisticasParaGraficos = (estadisticas: EstadisticasAreas) => {
  return {
    estados: [
      { name: 'Activas', value: estadisticas.activas, color: '#10B981' },
      { name: 'Inactivas', value: estadisticas.inactivas, color: '#6B7280' },
    ],
    coordinadores: [
      { name: 'Con Coordinador', value: estadisticas.conCoordinador, color: '#3B82F6' },
      { name: 'Sin Coordinador', value: estadisticas.sinCoordinador, color: '#F59E0B' },
    ],
    distribucion: estadisticas.distribucion.map((item, index) => ({
      area: item.areaNombre,
      docentes: item.totalDocentes,
      horarios: item.totalHorarios,
      color: obtenerColoresPredefinidos()[index % 10].hex
    }))
  };
};

/**
 * Validar datos de área antes de enviar
 */
export const validarDatosArea = (datos: DatosArea): { valido: boolean; errores: string[] } => {
  const errores: string[] = [];
  
  if (!datos.nombre || datos.nombre.trim() === '') {
    errores.push('El nombre del área es requerido');
  }
  
  if (datos.nombre && datos.nombre.length < 3) {
    errores.push('El nombre debe tener al menos 3 caracteres');
  }
  
  if (datos.nombre && datos.nombre.length > 100) {
    errores.push('El nombre no puede exceder 100 caracteres');
  }
  
  if (datos.codigo && !validarCodigoArea(datos.codigo)) {
    errores.push('El código debe tener el formato AA-NN o AAA-NNN (letras-números)');
  }
  
  if (datos.colorHex && !/^#[0-9A-F]{6}$/i.test(datos.colorHex)) {
    errores.push('El color debe ser un código hexadecimal válido (#RRGGBB)');
  }
  
  return {
    valido: errores.length === 0,
    errores
  };
};

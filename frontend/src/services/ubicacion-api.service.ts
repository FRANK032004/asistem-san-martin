import api from '@/lib/api';

// Interfaces para ubicaciones GPS
export interface UbicacionGPS {
  id: number;
  nombre: string;
  descripcion?: string;
  latitud: number;
  longitud: number;
  radioMetros: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    asistenciasEntrada: number;
    asistenciasSalida: number;
  };
}

export interface EstadisticasUbicaciones {
  total: number;
  activas: number;
  inactivas: number;
  radioPromedio: number;
  usosRecientes: number;
}

export interface FiltrosUbicaciones {
  activo?: 'todos' | 'activas' | 'inactivas';
  busqueda?: string;
}

export interface RespuestaUbicaciones {
  ubicaciones: UbicacionGPS[];
  estadisticas: EstadisticasUbicaciones;
  filtros: FiltrosUbicaciones;
  ultimaActualizacion: Date;
}

export interface DatosUbicacion {
  nombre: string;
  descripcion?: string;
  latitud: number | string;
  longitud: number | string;
  radioMetros: number | string;
  activo: boolean;
}

// Servicio para obtener ubicaciones
export const obtenerUbicaciones = async (filtros?: FiltrosUbicaciones): Promise<RespuestaUbicaciones> => {
  try {
    const params = new URLSearchParams();
    
    if (filtros?.activo && filtros.activo !== 'todos') {
      // Convertir 'activas' a 'true' y 'inactivas' a 'false'
      const valorActivo = filtros.activo === 'activas' ? 'true' : 'false';
      params.append('activo', valorActivo);
    }
    
    if (filtros?.busqueda) {
      params.append('busqueda', filtros.busqueda);
    }

    const response = await api.get(`/admin/ubicaciones?${params.toString()}`);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Error al obtener ubicaciones');
    }
  } catch (error: any) {
    console.error('Error obteniendo ubicaciones:', error);
    throw new Error(error.response?.data?.message || 'Error de conexión');
  }
};

// Servicio para obtener ubicación por ID
export const obtenerUbicacionPorId = async (id: number): Promise<UbicacionGPS> => {
  try {
    const response = await api.get(`/admin/ubicaciones/${id}`);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Error al obtener ubicación');
    }
  } catch (error: any) {
    console.error('Error obteniendo ubicación por ID:', error);
    throw new Error(error.response?.data?.message || 'Error de conexión');
  }
};

// Servicio para crear ubicación
export const crearUbicacion = async (datos: DatosUbicacion): Promise<UbicacionGPS> => {
  try {
    // Validar datos antes de enviar
    if (!datos.nombre || !datos.latitud || !datos.longitud) {
      throw new Error('Nombre, latitud y longitud son obligatorios');
    }

    const lat = typeof datos.latitud === 'string' ? parseFloat(datos.latitud) : datos.latitud;
    const lng = typeof datos.longitud === 'string' ? parseFloat(datos.longitud) : datos.longitud;
    const radio = typeof datos.radioMetros === 'string' ? parseInt(datos.radioMetros) : datos.radioMetros;

    if (isNaN(lat) || isNaN(lng)) {
      throw new Error('Latitud y longitud deben ser números válidos');
    }

    if (lat < -90 || lat > 90) {
      throw new Error('Latitud debe estar entre -90 y 90 grados');
    }

    if (lng < -180 || lng > 180) {
      throw new Error('Longitud debe estar entre -180 y 180 grados');
    }

    if (isNaN(radio) || radio < 10 || radio > 1000) {
      throw new Error('Radio debe estar entre 10 y 1000 metros');
    }

    const datosLimpios = {
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion?.trim() || undefined,
      latitud: lat,
      longitud: lng,
      radioMetros: radio,
      activo: datos.activo
    };

    const response = await api.post('/admin/ubicaciones', datosLimpios);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Error al crear ubicación');
    }
  } catch (error: any) {
    console.error('Error creando ubicación:', error);
    throw new Error(error.response?.data?.message || error.message || 'Error de conexión');
  }
};

// Servicio para actualizar ubicación
export const actualizarUbicacion = async (id: number, datos: Partial<DatosUbicacion>): Promise<UbicacionGPS> => {
  try {
    // Validar y limpiar datos si están presentes
    const datosLimpios: any = {};

    if (datos.nombre !== undefined) {
      if (!datos.nombre.trim()) {
        throw new Error('El nombre no puede estar vacío');
      }
      datosLimpios.nombre = datos.nombre.trim();
    }

    if (datos.descripcion !== undefined) {
      datosLimpios.descripcion = datos.descripcion?.trim() || null;
    }

    if (datos.latitud !== undefined) {
      const lat = typeof datos.latitud === 'string' ? parseFloat(datos.latitud) : datos.latitud;
      if (isNaN(lat) || lat < -90 || lat > 90) {
        throw new Error('Latitud debe ser un número válido entre -90 y 90 grados');
      }
      datosLimpios.latitud = lat;
    }

    if (datos.longitud !== undefined) {
      const lng = typeof datos.longitud === 'string' ? parseFloat(datos.longitud) : datos.longitud;
      if (isNaN(lng) || lng < -180 || lng > 180) {
        throw new Error('Longitud debe ser un número válido entre -180 y 180 grados');
      }
      datosLimpios.longitud = lng;
    }

    if (datos.radioMetros !== undefined) {
      const radio = typeof datos.radioMetros === 'string' ? parseInt(datos.radioMetros) : datos.radioMetros;
      if (isNaN(radio) || radio < 10 || radio > 1000) {
        throw new Error('Radio debe estar entre 10 y 1000 metros');
      }
      datosLimpios.radioMetros = radio;
    }

    if (datos.activo !== undefined) {
      datosLimpios.activo = datos.activo;
    }

    const response = await api.put(`/admin/ubicaciones/${id}`, datosLimpios);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Error al actualizar ubicación');
    }
  } catch (error: any) {
    console.error('Error actualizando ubicación:', error);
    throw new Error(error.response?.data?.message || error.message || 'Error de conexión');
  }
};

// Servicio para eliminar ubicación
export const eliminarUbicacion = async (id: number): Promise<{ eliminada: boolean; mensaje: string }> => {
  try {
    const response = await api.delete(`/admin/ubicaciones/${id}`);
    
    if (response.data.success) {
      return {
        eliminada: true,
        mensaje: response.data.message
      };
    } else {
      throw new Error(response.data.message || 'Error al eliminar ubicación');
    }
  } catch (error: any) {
    console.error('Error eliminando ubicación:', error);
    throw new Error(error.response?.data?.message || 'Error de conexión');
  }
};

// Utilidad para calcular distancia entre coordenadas (fórmula Haversine)
export const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distancia en metros
};

// Utilidad para validar si una coordenada está dentro del radio
export const validarUbicacion = (
  ubicacion: UbicacionGPS, 
  latitudActual: number, 
  longitudActual: number
): { valido: boolean; distancia: number } => {
  const distancia = calcularDistancia(
    ubicacion.latitud, 
    ubicacion.longitud, 
    latitudActual, 
    longitudActual
  );
  
  return {
    valido: distancia <= ubicacion.radioMetros,
    distancia: Math.round(distancia)
  };
};

// Utilidad para formatear coordenadas
export const formatearCoordenadas = (lat: number | string, lng: number | string, decimales: number = 6): string => {
  const latNum = typeof lat === 'string' ? parseFloat(lat) : lat;
  const lngNum = typeof lng === 'string' ? parseFloat(lng) : lng;
  
  if (isNaN(latNum) || isNaN(lngNum)) {
    return 'Coordenadas inválidas';
  }
  
  return `${latNum.toFixed(decimales)}, ${lngNum.toFixed(decimales)}`;
};
/**
 * Servicio de API para Notificaciones
 * Comunicación con el backend para gestión de notificaciones
 */

import api from '@/lib/api';

export enum TipoNotificacion {
  ASISTENCIA = 'ASISTENCIA',
  JUSTIFICACION = 'JUSTIFICACION',
  PLANILLA = 'PLANILLA',
  HORARIO = 'HORARIO',
  SISTEMA = 'SISTEMA',
  ALERTA = 'ALERTA',
}

export interface Notificacion {
  id: string;
  usuario_id: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  datos?: any;
  leido: boolean;
  importante: boolean;
  fecha_envio: string;
  fecha_leido?: string;
  usuarios?: {
    id: string;
    nombres: string;
    apellidos: string;
  };
}

export interface FiltrosNotificaciones {
  tipo?: TipoNotificacion;
  leido?: boolean;
  importante?: boolean;
}

export interface ContadorNoLeidas {
  count: number;
}

/**
 * Obtener notificaciones del usuario autenticado
 */
export const obtenerMisNotificaciones = async (
  filtros?: FiltrosNotificaciones
): Promise<{ ok: boolean; data: Notificacion[]; total: number }> => {
  const params = new URLSearchParams();
  
  if (filtros?.tipo) {
    params.append('tipo', filtros.tipo);
  }
  
  if (filtros?.leido !== undefined) {
    params.append('leido', filtros.leido.toString());
  }
  
  if (filtros?.importante !== undefined) {
    params.append('importante', filtros.importante.toString());
  }

  const queryString = params.toString();
  const url = `/notificaciones${queryString ? `?${queryString}` : ''}`;

  const response = await api.get(url);
  return response.data;
};

/**
 * Marcar notificación como leída
 */
export const marcarComoLeida = async (
  id: string
): Promise<{ ok: boolean; data: Notificacion; mensaje: string }> => {
  const response = await api.patch(`/notificaciones/${id}/marcar-leida`);
  return response.data;
};

/**
 * Marcar todas las notificaciones como leídas
 */
export const marcarTodasComoLeidas = async (): Promise<{
  ok: boolean;
  data: { count: number; mensaje: string };
}> => {
  const response = await api.patch('/notificaciones/marcar-todas-leidas');
  return response.data;
};

/**
 * Eliminar notificación
 */
export const eliminarNotificacion = async (
  id: string
): Promise<{ ok: boolean; data: { mensaje: string } }> => {
  const response = await api.delete(`/notificaciones/${id}`);
  return response.data;
};

/**
 * Obtener contador de notificaciones no leídas
 */
export const contadorNoLeidas = async (): Promise<{
  ok: boolean;
  data: ContadorNoLeidas;
}> => {
  const response = await api.get('/notificaciones/contador-no-leidas');
  return response.data;
};

/**
 * Limpiar notificaciones antiguas (más de 30 días y leídas)
 */
export const limpiarNotificacionesAntiguas = async (): Promise<{
  ok: boolean;
  data: { count: number; mensaje: string };
}> => {
  const response = await api.delete('/notificaciones/limpiar-antiguas');
  return response.data;
};

/**
 * Función auxiliar para formatear la fecha de la notificación
 */
export const formatearFechaNotificacion = (fecha: string): string => {
  const ahora = new Date();
  const fechaNotif = new Date(fecha);
  const diffMs = ahora.getTime() - fechaNotif.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Ahora';
  } else if (diffMins < 60) {
    return `Hace ${diffMins} min`;
  } else if (diffHours < 24) {
    return `Hace ${diffHours}h`;
  } else if (diffDays === 1) {
    return 'Ayer';
  } else if (diffDays < 7) {
    return `Hace ${diffDays} días`;
  } else {
    return fechaNotif.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
    });
  }
};

/**
 * Obtener ícono según el tipo de notificación
 */
export const obtenerIconoTipo = (tipo: TipoNotificacion): string => {
  const iconos: Record<TipoNotificacion, string> = {
    [TipoNotificacion.ASISTENCIA]: '📅',
    [TipoNotificacion.JUSTIFICACION]: '📝',
    [TipoNotificacion.PLANILLA]: '💰',
    [TipoNotificacion.HORARIO]: '🕐',
    [TipoNotificacion.SISTEMA]: '⚙️',
    [TipoNotificacion.ALERTA]: '⚠️',
  };

  return iconos[tipo] || '📌';
};

/**
 * Obtener color según el tipo de notificación
 */
export const obtenerColorTipo = (tipo: TipoNotificacion): string => {
  const colores: Record<TipoNotificacion, string> = {
    [TipoNotificacion.ASISTENCIA]: 'blue',
    [TipoNotificacion.JUSTIFICACION]: 'orange',
    [TipoNotificacion.PLANILLA]: 'green',
    [TipoNotificacion.HORARIO]: 'purple',
    [TipoNotificacion.SISTEMA]: 'gray',
    [TipoNotificacion.ALERTA]: 'red',
  };

  return colores[tipo] || 'gray';
};

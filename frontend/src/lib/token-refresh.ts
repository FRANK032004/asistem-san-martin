/**
 * Sistema de Auto-Refresh de Tokens JWT
 * Renueva automáticamente el access token antes de que expire
 */

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
let refreshInterval: NodeJS.Timeout | null = null;
let lastRefreshTime: number = 0;

// Constantes
const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutos (antes de 1 hora de expiración)
const MIN_TIME_BETWEEN_REFRESHES = 5 * 60 * 1000; // 5 minutos mínimo entre refreshes

/**
 * Verifica si hay un token válido
 */
const hasValidToken = (): boolean => {
  const token = localStorage.getItem('accessToken');
  return !!token;
};

/**
 * Renueva el access token usando el refresh token en cookie
 */
const refreshAccessToken = async (): Promise<boolean> => {
  // 🔒 No intentar refresh si estamos en login o no hay token
  if (typeof window !== 'undefined' && window.location.pathname === '/login') {
    console.log('⏭️ Refresh cancelado: estamos en página de login');
    return false;
  }

  // 🔒 No intentar refresh si no hay token
  if (!hasValidToken()) {
    console.log('⏭️ Refresh cancelado: no hay token válido');
    return false;
  }

  // Evitar refreshes muy frecuentes
  const now = Date.now();
  if (now - lastRefreshTime < MIN_TIME_BETWEEN_REFRESHES) {
    console.log('⏭️ Refresh cancelado: muy pronto desde el último refresh');
    return true;
  }

  try {
    console.log('🔄 Renovando access token automáticamente...');
    
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { 
        withCredentials: true, // Enviar cookies (refresh token)
        timeout: 10000 // 10 segundos timeout
      }
    );

    const newAccessToken = response.data.data?.accessToken;
    
    if (!newAccessToken) {
      console.error('❌ No se recibió access token en la respuesta');
      return false;
    }

    // Guardar nuevo token
    localStorage.setItem('accessToken', newAccessToken);
    lastRefreshTime = Date.now();
    
    console.log('✅ Access token renovado exitosamente');
    console.log('⏰ Próxima renovación en 15 minutos');
    
    return true;

  } catch (error: any) {
    console.error('❌ Error al renovar token:', error?.response?.data || error?.message || 'Error desconocido');
    
    // Si el refresh token también expiró (401), redirigir a login
    if (error?.response?.status === 401) {
      console.warn('🔒 Sesión expirada - Redirigiendo a login');
      localStorage.removeItem('accessToken');
      
      // Solo redirigir si no estamos ya en login
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return false;
  }
};

/**
 * Inicia el sistema de auto-refresh
 */
export const startTokenRefresh = () => {
  // 🔒 No iniciar en página de login
  if (typeof window !== 'undefined' && window.location.pathname === '/login') {
    console.log('⏭️ No iniciar auto-refresh en página de login');
    return;
  }

  // Prevenir múltiples inicios
  if (refreshInterval) {
    console.log('⚠️ Auto-refresh ya está activo');
    return;
  }

  // Solo iniciar si hay un token
  if (!hasValidToken()) {
    console.log('⏭️ No hay token, auto-refresh no iniciado');
    return;
  }

  console.log('🚀 Iniciando auto-refresh de tokens');
  console.log(`⏰ Intervalo: ${REFRESH_INTERVAL / 1000 / 60} minutos`);

  // Hacer un refresh inmediato al iniciar (si han pasado más de 5 min desde el último login)
  const timeSinceLastRefresh = Date.now() - lastRefreshTime;
  if (timeSinceLastRefresh > MIN_TIME_BETWEEN_REFRESHES) {
    refreshAccessToken();
  }

  // Configurar refresh periódico
  refreshInterval = setInterval(async () => {
    // Solo refreshar si hay un token y no estamos en login
    if (hasValidToken() && window.location.pathname !== '/login') {
      await refreshAccessToken();
    } else {
      console.log('⏹️ No hay token o estamos en login, deteniendo auto-refresh');
      stopTokenRefresh();
    }
  }, REFRESH_INTERVAL);

  console.log('✅ Auto-refresh de tokens iniciado');
};

/**
 * Detiene el sistema de auto-refresh
 */
export const stopTokenRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
    console.log('🛑 Auto-refresh de tokens detenido');
  }
};

/**
 * Reinicia el sistema de auto-refresh
 */
export const restartTokenRefresh = () => {
  stopTokenRefresh();
  startTokenRefresh();
};

/**
 * Fuerza un refresh inmediato
 */
export const forceRefreshToken = async (): Promise<boolean> => {
  console.log('⚡ Refresh forzado del token');
  return await refreshAccessToken();
};

// Auto-iniciar en el cliente cuando haya un token
if (typeof window !== 'undefined') {
  // Iniciar cuando el documento esté listo
  if (document.readyState === 'complete') {
    if (hasValidToken()) {
      startTokenRefresh();
    }
  } else {
    window.addEventListener('load', () => {
      if (hasValidToken()) {
        startTokenRefresh();
      }
    });
  }

  // Limpiar al cerrar la ventana
  window.addEventListener('beforeunload', () => {
    stopTokenRefresh();
  });

  // Reiniciar si la ventana recupera el foco (después de inactividad)
  window.addEventListener('focus', () => {
    console.log('👀 Ventana recuperó el foco, verificando tokens...');
    if (hasValidToken() && !refreshInterval) {
      startTokenRefresh();
    }
  });

  // Detectar cuando el usuario vuelve de inactividad (visibilitychange)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && hasValidToken()) {
      console.log('👁️ Página visible nuevamente, renovando token...');
      forceRefreshToken();
    }
  });
}

export default {
  start: startTokenRefresh,
  stop: stopTokenRefresh,
  restart: restartTokenRefresh,
  forceRefresh: forceRefreshToken,
};

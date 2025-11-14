/**
 * Sistema Híbrido de Gestión de Inactividad
 * Implementación profesional con warning modal antes de logout
 * 
 * Características:
 * - Auto-refresh hasta el límite de inactividad
 * - Detección de actividad real del usuario
 * - Warning modal con countdown
 * - Logout automático si no hay respuesta
 * - Configurable por rol
 */

import { forceRefreshToken } from './token-refresh';

// ========================================
// 🔧 CONFIGURACIÓN
// ========================================

interface InactivityConfig {
  warningTime: number;      // Tiempo antes de mostrar warning (ms)
  logoutTime: number;        // Tiempo antes de logout forzado (ms)
  countdownDuration: number; // Duración del countdown (ms)
}

// Configuración por rol (en minutos convertidos a ms)
const INACTIVITY_CONFIGS: Record<string, InactivityConfig> = {
  admin: {
    warningTime: 60 * 60 * 1000,      // 60 minutos
    logoutTime: 61 * 60 * 1000,       // 61 minutos
    countdownDuration: 60 * 1000,     // 60 segundos
  },
  director: {
    warningTime: 45 * 60 * 1000,      // 45 minutos
    logoutTime: 46 * 60 * 1000,       // 46 minutos
    countdownDuration: 60 * 1000,     // 60 segundos
  },
  docente: {
    warningTime: 30 * 60 * 1000,      // 30 minutos
    logoutTime: 31 * 60 * 1000,       // 31 minutos
    countdownDuration: 60 * 1000,     // 60 segundos
  },
  default: {
    warningTime: 30 * 60 * 1000,      // 30 minutos por defecto
    logoutTime: 31 * 60 * 1000,       // 31 minutos
    countdownDuration: 60 * 1000,     // 60 segundos
  }
};

// ========================================
// 📊 ESTADO GLOBAL
// ========================================

let inactivityTimer: NodeJS.Timeout | null = null;
let warningTimer: NodeJS.Timeout | null = null;
let lastActivityTime: number = Date.now();
let isWarningShown: boolean = false;
let currentConfig: InactivityConfig = INACTIVITY_CONFIGS.default;
let warningCallback: ((secondsLeft: number) => void) | null = null;
let logoutCallback: (() => void) | null = null;

// ========================================
// 🎯 EVENTOS DE ACTIVIDAD
// ========================================

const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keypress',
  'scroll',
  'touchstart',
  'click',
];

// ========================================
// 🔄 FUNCIONES PRINCIPALES
// ========================================

/**
 * Registra actividad del usuario
 */
const recordActivity = () => {
  const now = Date.now();
  const timeSinceLastActivity = now - lastActivityTime;
  
  // Solo registrar si han pasado más de 5 segundos (evitar spam)
  if (timeSinceLastActivity < 5000) {
    return;
  }
  
  lastActivityTime = now;
  
  // Si hay warning activo, ocultarlo (usuario volvió)
  if (isWarningShown) {
    console.log('👤 Usuario activo nuevamente - Cancelando warning');
    hideWarning();
  }
  
  // Resetear timers
  resetInactivityTimer();
  
  console.log('👆 Actividad detectada - Timer reseteado');
};

/**
 * Resetea el timer de inactividad
 */
const resetInactivityTimer = () => {
  // Limpiar timers existentes
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  if (warningTimer) {
    clearTimeout(warningTimer);
  }
  
  // Timer para mostrar warning
  warningTimer = setTimeout(() => {
    showWarning();
  }, currentConfig.warningTime);
  
  // Timer para logout forzado
  inactivityTimer = setTimeout(() => {
    performLogout();
  }, currentConfig.logoutTime);
};

/**
 * Muestra el warning modal
 */
const showWarning = () => {
  if (isWarningShown) return;
  
  isWarningShown = true;
  console.warn('⚠️ Mostrando warning de inactividad');
  
  // Renovar token antes de mostrar warning
  forceRefreshToken();
  
  // Iniciar countdown
  let secondsLeft = Math.floor(currentConfig.countdownDuration / 1000);
  
  // Notificar a UI para mostrar modal
  if (warningCallback) {
    warningCallback(secondsLeft);
  }
  
  // Countdown cada segundo
  const countdownInterval = setInterval(() => {
    secondsLeft--;
    
    if (warningCallback) {
      warningCallback(secondsLeft);
    }
    
    if (secondsLeft <= 0 || !isWarningShown) {
      clearInterval(countdownInterval);
    }
  }, 1000);
};

/**
 * Oculta el warning modal
 */
const hideWarning = () => {
  if (!isWarningShown) return;
  
  isWarningShown = false;
  console.log('✅ Warning ocultado - Usuario respondió');
  
  // Notificar a UI para cerrar modal
  if (warningCallback) {
    warningCallback(-1); // -1 indica cerrar modal
  }
  
  // Resetear timers
  resetInactivityTimer();
};

/**
 * Ejecuta el logout
 */
const performLogout = () => {
  console.warn('🔒 Logout por inactividad - Cerrando sesión');
  
  // Limpiar todo
  stopInactivityManager();
  
  // Ejecutar callback de logout
  if (logoutCallback) {
    logoutCallback();
  } else {
    // Fallback: limpiar y redirigir
    localStorage.removeItem('accessToken');
    window.location.href = '/login?reason=inactivity';
  }
};

/**
 * Usuario respondió al warning (click en "Seguir Trabajando")
 */
export const respondToWarning = () => {
  console.log('✅ Usuario respondió al warning');
  hideWarning();
};

// ========================================
// 🚀 INICIALIZACIÓN Y CONTROL
// ========================================

/**
 * Inicia el sistema de gestión de inactividad
 */
export const startInactivityManager = (
  role: string = 'default',
  onWarning?: (secondsLeft: number) => void,
  onLogout?: () => void
) => {
  // Prevenir múltiples inicios
  if (inactivityTimer) {
    console.warn('⚠️ Inactivity manager ya está activo');
    return;
  }
  
  // Configurar según rol
  currentConfig = INACTIVITY_CONFIGS[role.toLowerCase()] || INACTIVITY_CONFIGS.default;
  warningCallback = onWarning || null;
  logoutCallback = onLogout || null;
  
  console.log('🚀 Iniciando sistema de inactividad');
  console.log(`👤 Rol: ${role}`);
  console.log(`⏰ Warning: ${currentConfig.warningTime / 1000 / 60} minutos`);
  console.log(`🔒 Logout: ${currentConfig.logoutTime / 1000 / 60} minutos`);
  
  // Registrar eventos de actividad
  ACTIVITY_EVENTS.forEach(event => {
    window.addEventListener(event, recordActivity, { passive: true });
  });
  
  // Iniciar timer
  lastActivityTime = Date.now();
  resetInactivityTimer();
  
  console.log('✅ Sistema de inactividad iniciado');
};

/**
 * Detiene el sistema de gestión de inactividad
 */
export const stopInactivityManager = () => {
  // Limpiar timers
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
  if (warningTimer) {
    clearTimeout(warningTimer);
    warningTimer = null;
  }
  
  // Remover event listeners
  ACTIVITY_EVENTS.forEach(event => {
    window.removeEventListener(event, recordActivity);
  });
  
  // Resetear estado
  isWarningShown = false;
  warningCallback = null;
  logoutCallback = null;
  
  console.log('🛑 Sistema de inactividad detenido');
};

/**
 * Obtiene el tiempo de inactividad actual
 */
export const getInactivityTime = (): number => {
  return Date.now() - lastActivityTime;
};

/**
 * Verifica si el warning está visible
 */
export const isWarningVisible = (): boolean => {
  return isWarningShown;
};

export default {
  start: startInactivityManager,
  stop: stopInactivityManager,
  respond: respondToWarning,
  getInactivityTime,
  isWarningVisible,
};

/**
 * Sistema de Keep-Alive para Next.js
 * Previene que el servidor de desarrollo se cierre por inactividad
 */

let keepAliveInterval: NodeJS.Timeout | null = null;
let healthCheckInterval: NodeJS.Timeout | null = null;

/**
 * Inicia el sistema de keep-alive
 */
export const startKeepAlive = () => {
  // Prevenir múltiples inicios
  if (keepAliveInterval || healthCheckInterval) {
    console.log('⚠️ Keep-alive ya está activo');
    return;
  }

  // Keep-alive: Hacer peticiones periódicas para mantener el servidor activo
  keepAliveInterval = setInterval(() => {
    // Hacer una petición HEAD a la página actual para mantener Next.js activo
    fetch(window.location.href, { method: 'HEAD' })
      .then(() => {
        console.log('🏓 Keep-alive: Next.js activo');
      })
      .catch((error) => {
        console.warn('⚠️ Keep-alive falló:', error.message);
      });
  }, 5 * 60 * 1000); // Cada 5 minutos

  // Health check del backend: Verificar que el backend esté respondiendo
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const healthUrl = API_URL.replace('/api', '/health');

  healthCheckInterval = setInterval(() => {
    fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
    })
      .then((response) => {
        if (response.ok) {
          console.log('💚 Backend activo:', healthUrl);
        } else {
          console.warn('⚠️ Backend respondió con error:', response.status);
        }
      })
      .catch((error) => {
        console.error('❌ Backend no responde:', error.message);
      });
  }, 5 * 60 * 1000); // Cada 5 minutos

  console.log('✅ Keep-alive iniciado (frontend + backend check cada 5 min)');
};

/**
 * Detiene el sistema de keep-alive
 */
export const stopKeepAlive = () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }

  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }

  console.log('🛑 Keep-alive detenido');
};

/**
 * Reinicia el sistema de keep-alive
 */
export const restartKeepAlive = () => {
  stopKeepAlive();
  startKeepAlive();
};

// Auto-iniciar en el cliente
if (typeof window !== 'undefined') {
  // Iniciar cuando el documento esté listo
  if (document.readyState === 'complete') {
    startKeepAlive();
  } else {
    window.addEventListener('load', () => {
      startKeepAlive();
    });
  }

  // Limpiar al cerrar la ventana
  window.addEventListener('beforeunload', () => {
    stopKeepAlive();
  });

  // Reiniciar si la ventana recupera el foco (después de inactividad)
  window.addEventListener('focus', () => {
    console.log('👀 Ventana recuperó el foco, verificando keep-alive...');
    if (!keepAliveInterval) {
      startKeepAlive();
    }
  });
}

export default {
  start: startKeepAlive,
  stop: stopKeepAlive,
  restart: restartKeepAlive,
};

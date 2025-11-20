import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Usar variable de entorno o fallback a localhost en desarrollo
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Configuración de reintentos y timeouts
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 segundos
const REQUEST_TIMEOUT = 30000; // 30 segundos

// Crear instancia de axios con configuración robusta
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT, // Timeout de 30s para todas las requests
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ⚠️ CRÍTICO: Permite enviar cookies httpOnly
  // Configuración adicional para conexiones más estables
  transitional: {
    clarifyTimeoutError: true // Errores de timeout más claros
  }
});

// Variable para evitar múltiples refreshes simultáneos
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Función para notificar a todos los requests en espera
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// Función para agregar requests a la cola de espera
const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Interceptor para agregar token a todas las requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken'); // Cambiado de cookies a localStorage
    console.log('🔑 Access token encontrado:', token ? 'SÍ' : 'NO');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('📡 Request a:', config.url, 'con token');
    } else {
      console.warn('⚠️ No hay access token para la request a:', config.url);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Error en interceptor de request:', error);
    return Promise.reject(error);
  }
);

// Función auxiliar para determinar si un error es recuperable
const isRetryableError = (error: AxiosError): boolean => {
  // Errores de red que se pueden reintentar
  if (!error.response) {
    // ECONNREFUSED, ETIMEDOUT, Network Error, etc.
    return true;
  }
  
  // Errores HTTP que se pueden reintentar
  const status = error.response.status;
  return (
    status === 408 || // Request Timeout
    status === 429 || // Too Many Requests
    status === 500 || // Internal Server Error (puede ser temporal)
    status === 502 || // Bad Gateway
    status === 503 || // Service Unavailable
    status === 504    // Gateway Timeout
  );
};

// Función para esperar antes de reintentar
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Interceptor para manejar errores de autenticación y refresh automático
api.interceptors.response.use(
  (response) => {
    // Solo logear en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Response exitosa de:', response.config.url);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { 
      _retry?: boolean; 
      _retryCount?: number;
    };
    
    // Silenciar logs de error para login fallido (credenciales incorrectas)
    const isLoginError = error.config?.url?.includes('/auth/login') && error.response?.status === 401;
    
    if (!isLoginError) {
      console.error('❌ Error en response:', error.response?.status, error.response?.data);
    }
    
    // 🔄 LÓGICA DE REINTENTO PARA ERRORES DE RED
    if (isRetryableError(error) && originalRequest && !originalRequest._retry) {
      originalRequest._retryCount = originalRequest._retryCount || 0;
      
      if (originalRequest._retryCount < MAX_RETRIES) {
        originalRequest._retryCount++;
        
        console.warn(
          `⚠️ Reintentando request (${originalRequest._retryCount}/${MAX_RETRIES}):`,
          originalRequest.url,
          'Razón:',
          error.code || error.response?.status || 'Network Error'
        );
        
        // Esperar antes de reintentar (exponential backoff)
        await delay(RETRY_DELAY * originalRequest._retryCount);
        
        try {
          return await api(originalRequest);
        } catch (retryError) {
          console.error('❌ Reintento falló:', retryError);
          // Si falló el reintento, continuar con lógica de error normal
        }
      } else {
        console.error(
          '❌ Máximo de reintentos alcanzado para:',
          originalRequest.url,
          '- Sugerencia: Verificar conexión de red o estado del servidor'
        );
      }
    }
    
    // 🔑 LÓGICA DE REFRESH TOKEN (401 Unauthorized)
    // Si es error 401 y no hemos intentado refresh aún
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      
      // Evitar refresh en endpoints de auth
      if (originalRequest.url?.includes('/auth/login') || 
          originalRequest.url?.includes('/auth/refresh')) {
        console.warn('⚠️ Error 401 en endpoint de auth - No intentar refresh');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (window.location.pathname !== '/login') {
          // Mostrar mensaje antes de redirigir
          alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // Si ya hay un refresh en proceso, esperar
      if (isRefreshing) {
        console.log('⏳ Refresh en proceso, esperando...');
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;
      console.log('🔄 Intentando renovar access token...');

      try {
        // Llamar al endpoint de refresh (el refresh token está en httpOnly cookie)
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true } // Enviar cookies
        );

        console.log('✅ Refresh exitoso:', response.data);

        // Extraer nuevo access token
        const newAccessToken = response.data.data?.accessToken;
        
        if (!newAccessToken) {
          throw new Error('No se recibió access token en la respuesta');
        }

        // Guardar nuevo access token
        localStorage.setItem('accessToken', newAccessToken);
        console.log('💾 Nuevo access token guardado');

        // Notificar a todos los requests en espera
        onRefreshed(newAccessToken);
        isRefreshing = false;

        // Reintentar el request original con nuevo token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        console.error('❌ Error al renovar token:', refreshError);
        
        // Refresh falló, limpiar y redirigir a login
        isRefreshing = false;
        refreshSubscribers = [];
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        if (window.location.pathname !== '/login') {
          console.warn('⚠️ Token inválido - Redirigiendo a login...');
          alert('Tu sesión ha expirado o es inválida. Por favor, inicia sesión nuevamente.');
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    // 🛡️ MANEJO ESPECIAL DE ERRORES DE RED
    if (!error.response && error.code) {
      // Errores de red sin respuesta del servidor
      const networkErrors: Record<string, string> = {
        'ECONNREFUSED': 'Conexión rechazada - Verificar que el backend esté corriendo en puerto 5000',
        'ETIMEDOUT': 'Tiempo de espera agotado - La red o el servidor están lentos',
        'ENOTFOUND': 'Servidor no encontrado - Verificar URL del backend',
        'ECONNRESET': 'Conexión interrumpida - La red se desconectó durante la request',
        'ERR_NETWORK': 'Error de red - Sin conexión a internet o firewall bloqueando',
      };
      
      const errorMessage = networkErrors[error.code] || `Error de red: ${error.code}`;
      console.error('🌐', errorMessage);
      
      // Agregar mensaje amigable al error
      error.message = errorMessage;
    }
    
    // 🚨 MANEJO DE TIMEOUT
    if (error.code === 'ECONNABORTED') {
      console.error(
        '⏱️ Request timeout después de 30s:',
        originalRequest?.url,
        '- Sugerencia: El servidor puede estar sobrecargado o la operación es muy pesada'
      );
    }
    
    // Para otros errores, rechazar normalmente
    return Promise.reject(error);
  }
);

// 🏥 Función de health check para verificar conexión con backend
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000, // 5s timeout para health check
      withCredentials: false // No necesita autenticación
    });
    
    console.log('✅ Backend está saludable:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Backend no responde:', error);
    return false;
  }
};

// 🔄 Función para reintentar conexión al backend (útil en componentes)
export const waitForBackend = async (
  maxAttempts: number = 10,
  delayMs: number = 3000
): Promise<boolean> => {
  for (let i = 1; i <= maxAttempts; i++) {
    console.log(`🔄 Verificando backend (intento ${i}/${maxAttempts})...`);
    
    const isHealthy = await checkBackendHealth();
    if (isHealthy) {
      console.log('✅ Backend conectado exitosamente');
      return true;
    }
    
    if (i < maxAttempts) {
      console.warn(`⏳ Esperando ${delayMs / 1000}s antes del siguiente intento...`);
      await delay(delayMs);
    }
  }
  
  console.error('❌ No se pudo conectar al backend después de', maxAttempts, 'intentos');
  return false;
};

export default api;

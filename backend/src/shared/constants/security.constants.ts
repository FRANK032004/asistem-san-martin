/**
 * ============================================================
 * CONSTANTES DE SEGURIDAD
 * Sistema de Asistencias - Instituto San Martín
 * ============================================================
 * Centralización de todos los valores de seguridad del sistema
 * para facilitar mantenimiento y evitar "magic numbers"
 */

/**
 * Configuración de JWT (JSON Web Tokens)
 */
export const JWT_CONFIG = {
  /**
   * Tiempo de expiración del Access Token
   * @default '24h' - 24 horas
   * @recommendation '15m' para mayor seguridad (requiere refresh más frecuente)
   */
  ACCESS_TOKEN_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  
  /**
   * Tiempo de expiración del Refresh Token
   * @default '7d' - 7 días
   */
  REFRESH_TOKEN_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  /**
   * Algoritmo de encriptación para JWT
   * @default 'HS256'
   */
  ALGORITHM: 'HS256' as const,
  
  /**
   * Issuer del token (identificador del sistema)
   */
  ISSUER: 'instituto-san-martin',
  
  /**
   * Audience del token
   */
  AUDIENCE: 'instituto-san-martin-api',
} as const;

/**
 * Configuración de Bcrypt para hashing de passwords
 */
export const BCRYPT_CONFIG = {
  /**
   * Número de rondas de salt para bcrypt
   * @default 10
   * @recommendation 12 para mayor seguridad (pero más lento)
   * @note Cada incremento duplica el tiempo de procesamiento
   */
  SALT_ROUNDS: 10,
  
  /**
   * Número mínimo de rondas aceptables
   */
  MIN_SALT_ROUNDS: 10,
  
  /**
   * Número máximo de rondas recomendadas
   */
  MAX_SALT_ROUNDS: 14,
} as const;

/**
 * Políticas de contraseñas
 */
export const PASSWORD_POLICY = {
  /**
   * Longitud mínima de contraseña
   */
  MIN_LENGTH: 8,
  
  /**
   * Longitud máxima de contraseña
   */
  MAX_LENGTH: 128,
  
  /**
   * Requiere al menos una mayúscula
   */
  REQUIRE_UPPERCASE: true,
  
  /**
   * Requiere al menos una minúscula
   */
  REQUIRE_LOWERCASE: true,
  
  /**
   * Requiere al menos un número
   */
  REQUIRE_NUMBER: true,
  
  /**
   * Requiere al menos un carácter especial
   */
  REQUIRE_SPECIAL_CHAR: true,
  
  /**
   * Caracteres especiales permitidos
   */
  SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
} as const;

/**
 * Configuración de Rate Limiting
 */
export const RATE_LIMIT_CONFIG = {
  /**
   * Ventana de tiempo para rate limiting (en milisegundos)
   * @default 900000 - 15 minutos
   */
  WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  
  /**
   * Número máximo de requests por ventana
   */
  MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  
  /**
   * Rate limit específico para endpoints de autenticación
   */
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutos
    MAX_REQUESTS: 5, // 5 intentos de login
  },
  
  /**
   * Rate limit para operaciones de creación
   */
  CREATE: {
    WINDOW_MS: 60 * 1000, // 1 minuto
    MAX_REQUESTS: 10, // 10 creaciones por minuto
  },
  
  /**
   * Rate limit para endpoints públicos
   */
  PUBLIC: {
    WINDOW_MS: 60 * 1000, // 1 minuto
    MAX_REQUESTS: 60, // 60 requests por minuto
  },
} as const;

/**
 * Configuración de intentos fallidos de login
 */
export const LOGIN_ATTEMPTS_CONFIG = {
  /**
   * Número máximo de intentos fallidos antes de bloquear
   */
  MAX_FAILED_ATTEMPTS: 5,
  
  /**
   * Tiempo de bloqueo en minutos
   */
  LOCKOUT_DURATION_MINUTES: 15,
  
  /**
   * Tiempo de bloqueo en milisegundos (calculado)
   */
  LOCKOUT_DURATION_MS: 15 * 60 * 1000,
  
  /**
   * Tiempo para resetear contador de intentos (en horas)
   */
  RESET_ATTEMPTS_AFTER_HOURS: 24,
} as const;

/**
 * Configuración de sesiones
 */
export const SESSION_CONFIG = {
  /**
   * Duración máxima de una sesión (en horas)
   */
  MAX_DURATION_HOURS: 24,
  
  /**
   * Tiempo de inactividad antes de expirar sesión (en minutos)
   */
  INACTIVITY_TIMEOUT_MINUTES: 30,
  
  /**
   * Tiempo de inactividad en milisegundos (calculado)
   */
  INACTIVITY_TIMEOUT_MS: 30 * 60 * 1000,
  
  /**
   * Número máximo de sesiones activas por usuario
   */
  MAX_ACTIVE_SESSIONS: 5,
} as const;

/**
 * Configuración de CORS
 */
export const CORS_CONFIG = {
  /**
   * Orígenes permitidos en desarrollo
   */
  DEVELOPMENT_ORIGINS: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
  ],
  
  /**
   * Orígenes permitidos en producción (desde variable de entorno)
   */
  PRODUCTION_ORIGINS: (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean),
  
  /**
   * Métodos HTTP permitidos
   */
  ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  
  /**
   * Headers permitidos
   */
  ALLOWED_HEADERS: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-ID',
  ],
  
  /**
   * Headers expuestos
   */
  EXPOSED_HEADERS: ['X-Request-ID', 'X-Total-Count'],
  
  /**
   * Tiempo de cache de preflight (en segundos)
   */
  MAX_AGE: 86400, // 24 horas
  
  /**
   * Permitir credenciales (cookies, headers de autenticación)
   */
  CREDENTIALS: true,
} as const;

/**
 * Configuración de cookies de seguridad
 */
export const COOKIE_CONFIG = {
  /**
   * Nombre de la cookie del refresh token
   */
  REFRESH_TOKEN_NAME: 'refreshToken',
  
  /**
   * Opciones de la cookie
   */
  OPTIONS: {
    httpOnly: true, // No accesible desde JavaScript
    secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
    sameSite: 'strict' as const, // Protección contra CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    path: '/',
  },
} as const;

/**
 * Configuración de GPS y geolocalización
 */
export const GPS_CONFIG = {
  /**
   * Precisión requerida en metros
   */
  PRECISION_METERS: parseInt(process.env.GPS_PRECISION_METERS || '50'),
  
  /**
   * Radio máximo permitido para ubicaciones (en metros)
   */
  MAX_RADIUS_METERS: 500,
  
  /**
   * Radio mínimo permitido para ubicaciones (en metros)
   */
  MIN_RADIUS_METERS: 10,
  
  /**
   * Timeout para obtener ubicación (en segundos)
   */
  TIMEOUT_SECONDS: parseInt(process.env.GPS_TIMEOUT_SECONDS || '30'),
  
  /**
   * Coordenadas por defecto (Lima, Perú)
   */
  DEFAULT_LOCATION: {
    LAT: parseFloat(process.env.GPS_DEFAULT_LOCATION_LAT || '-12.0464'),
    LNG: parseFloat(process.env.GPS_DEFAULT_LOCATION_LNG || '-77.0428'),
  },
} as const;

/**
 * Configuración de archivos
 */
export const FILE_CONFIG = {
  /**
   * Tamaño máximo de archivo (en bytes)
   * @default 5MB
   */
  MAX_SIZE_BYTES: parseInt(process.env.MAX_FILE_SIZE || '5242880'),
  
  /**
   * Tamaño máximo en MB (calculado)
   */
  MAX_SIZE_MB: 5,
  
  /**
   * Tipos de archivo permitidos
   */
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  
  /**
   * Extensiones permitidas
   */
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'],
} as const;

/**
 * Configuración de timeouts del servidor
 */
export const SERVER_TIMEOUTS = {
  /**
   * Timeout general de requests (en ms)
   * @default 120000 - 2 minutos
   */
  REQUEST_TIMEOUT_MS: parseInt(process.env.SERVER_TIMEOUT || '120000'),
  
  /**
   * Keep-alive timeout (en ms)
   * @default 65000 - 65 segundos
   */
  KEEP_ALIVE_TIMEOUT_MS: parseInt(process.env.SERVER_KEEP_ALIVE_TIMEOUT || '65000'),
  
  /**
   * Headers timeout (en ms)
   * @default 66000 - 66 segundos (mayor que keep-alive)
   */
  HEADERS_TIMEOUT_MS: parseInt(process.env.SERVER_HEADERS_TIMEOUT || '66000'),
  
  /**
   * Timeout para conexión a base de datos (en segundos)
   */
  DB_CONNECTION_TIMEOUT_SEC: 60,
} as const;

/**
 * Configuración de validación de emails
 */
export const EMAIL_CONFIG = {
  /**
   * Regex para validación de email
   */
  VALIDATION_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  /**
   * Dominios permitidos (vacío = todos)
   */
  ALLOWED_DOMAINS: [] as string[],
  
  /**
   * Longitud máxima de email
   */
  MAX_LENGTH: 150,
} as const;

/**
 * Configuración de validación de DNI (Perú)
 */
export const DNI_CONFIG = {
  /**
   * Longitud exacta del DNI peruano
   */
  LENGTH: 8,
  
  /**
   * Regex para validación (8 dígitos)
   */
  VALIDATION_REGEX: /^\d{8}$/,
} as const;

/**
 * Headers de seguridad (para Helmet)
 */
export const SECURITY_HEADERS = {
  /**
   * Content Security Policy
   */
  CSP: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  
  /**
   * Otros headers de seguridad
   */
  HSTS: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true,
  },
} as const;

/**
 * Niveles de logging
 */
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
} as const;

/**
 * Configuración de paginación
 */
export const PAGINATION_CONFIG = {
  /**
   * Número de items por página por defecto
   */
  DEFAULT_PAGE_SIZE: 10,
  
  /**
   * Tamaño máximo de página
   */
  MAX_PAGE_SIZE: 100,
  
  /**
   * Tamaño mínimo de página
   */
  MIN_PAGE_SIZE: 1,
} as const;

/**
 * Exportar todas las constantes
 */
export const SECURITY_CONSTANTS = {
  JWT_CONFIG,
  BCRYPT_CONFIG,
  PASSWORD_POLICY,
  RATE_LIMIT_CONFIG,
  LOGIN_ATTEMPTS_CONFIG,
  SESSION_CONFIG,
  CORS_CONFIG,
  COOKIE_CONFIG,
  GPS_CONFIG,
  FILE_CONFIG,
  SERVER_TIMEOUTS,
  EMAIL_CONFIG,
  DNI_CONFIG,
  SECURITY_HEADERS,
  LOG_LEVELS,
  PAGINATION_CONFIG,
} as const;

/**
 * Tipo para acceso type-safe a las constantes
 */
export type SecurityConstants = typeof SECURITY_CONSTANTS;

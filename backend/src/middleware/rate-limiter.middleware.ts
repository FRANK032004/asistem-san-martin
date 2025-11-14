import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../shared/utils/logger';

// 🔧 DESHABILITAR RATE LIMITING EN DESARROLLO
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Middleware bypass para desarrollo
 */
const bypassRateLimit = (_req: Request, _res: Response, next: NextFunction) => {
  if (isDevelopment) {
    return next();
  }
  // En producción, continuar con el rate limiter real
  return next();
};

/**
 * Rate Limiter para endpoints de autenticación
 * Previene ataques de fuerza bruta
 * ⚠️ DESHABILITADO EN DESARROLLO
 */
export const authRateLimiter = isDevelopment ? bypassRateLimit : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por ventana
  message: {
    error: 'Demasiados intentos de login. Por favor, intenta de nuevo en 15 minutos.',
    code: 'RATE_LIMIT_AUTH'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit excedido - Auth', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('user-agent')
    });
    
    res.status(429).json({
      error: 'Demasiados intentos de login. Por favor, intenta de nuevo en 15 minutos.',
      code: 'RATE_LIMIT_AUTH',
      retryAfter: 900 // segundos
    });
  }
});

/**
 * Rate Limiter para creación de recursos
 * Previene spam y abuso
 * ⚠️ DESHABILITADO EN DESARROLLO
 */
export const createResourceLimiter = isDevelopment ? bypassRateLimit : rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 creaciones por minuto
  message: {
    error: 'Demasiadas solicitudes de creación. Por favor, espera un momento.',
    code: 'RATE_LIMIT_CREATE'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit excedido - Create', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    
    res.status(429).json({
      error: 'Demasiadas solicitudes de creación. Por favor, espera un momento.',
      code: 'RATE_LIMIT_CREATE',
      retryAfter: 60
    });
  }
});

/**
 * Rate Limiter general para API
 * Aplica a todos los endpoints no específicos
 * ⚠️ DESHABILITADO EN DESARROLLO
 */
export const generalApiLimiter = isDevelopment ? bypassRateLimit : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  message: {
    error: 'Demasiadas solicitudes desde esta IP. Por favor, intenta más tarde.',
    code: 'RATE_LIMIT_GENERAL'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limit para health checks
    return req.path.startsWith('/health') || req.path.startsWith('/api/health');
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit excedido - General', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    
    res.status(429).json({
      error: 'Demasiadas solicitudes desde esta IP. Por favor, intenta más tarde.',
      code: 'RATE_LIMIT_GENERAL',
      retryAfter: 900
    });
  }
});

/**
 * Rate Limiter para endpoints de justificaciones
 * Previene spam de justificaciones
 * ⚠️ DESHABILITADO EN DESARROLLO
 */
export const justificacionLimiter = isDevelopment ? bypassRateLimit : rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // 20 justificaciones por hora
  message: {
    error: 'Has alcanzado el límite de justificaciones por hora. Intenta más tarde.',
    code: 'RATE_LIMIT_JUSTIFICACION'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit excedido - Justificaciones', {
      ip: req.ip,
      userId: (req as any).user?.userId
    });
    
    res.status(429).json({
      error: 'Has alcanzado el límite de justificaciones por hora. Intenta más tarde.',
      code: 'RATE_LIMIT_JUSTIFICACION',
      retryAfter: 3600
    });
  }
});

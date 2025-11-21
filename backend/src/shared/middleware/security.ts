import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';
import { ResponseFormatter } from '../utils/response-formatter';

/**
 * SISTEMA DE SEGURIDAD EMPRESARIAL - VERSIÓN FINAL CORREGIDA
 * Implementa protección multicapa con TypeScript estricto y manejo seguro de tipos
 */

interface SecurityEvent {
  type: string;
  ip: string;
  userAgent?: string | null;
  userId?: string | null;
  details?: any;
  timestamp: Date;
  risk: 'low' | 'medium' | 'high' | 'critical';
}

// Almacenes en memoria (en producción usar Redis/Base de datos)
const securityEvents: SecurityEvent[] = [];
const suspiciousIPs = new Set<string>();
const blockedIPs = new Set<string>();

/**
 * Utility functions para manejar datos de request de forma segura
 */
const getClientIP = (req: Request): string => {
  return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
};

const getUserAgent = (req: Request): string | null => {
  return req.get('User-Agent') || null;
};

/**
 * RATE LIMITERS CONFIGURADOS POR CONTEXTO
 */
export const rateLimiters = {
  // General API - 100 requests por 15 minutos
  general: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    keyGenerator: (req: Request) => getClientIP(req),
    handler: (req: Request, res: Response) => {
      logSecurityEvent({
        type: 'RATE_LIMIT_EXCEEDED',
        ip: getClientIP(req),
        userAgent: getUserAgent(req),
        userId: (req as any).user?.id || null,
        risk: 'medium',
        timestamp: new Date()
      });

      const response = ResponseFormatter.error(
        'RATE_LIMIT_EXCEEDED',
        'Demasiadas solicitudes. Intente más tarde.'
      );
      
      res.status(429).json(response);
    }
  }),

  // Autenticación - 10 intentos por 15 minutos
  auth: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true,
    keyGenerator: (req: Request) => getClientIP(req),
    handler: (_req: Request, res: Response) => {
      const response = ResponseFormatter.error(
        'AUTH_RATE_LIMIT_EXCEEDED',
        'Demasiados intentos de autenticación. Intente más tarde.'
      );
      res.status(429).json(response);
    }
  }),

  // Creación de recursos - 20 por hora
  create: rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    keyGenerator: (req: Request) => getClientIP(req)
  }),

  // Endpoints públicos - 50 por 15 minutos
  public: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    keyGenerator: (req: Request) => getClientIP(req)
  }),

  // Por usuario autenticado - 200 por hora
  perUser: rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 200,
    keyGenerator: (req: Request) => {
      const user = (req as any).user;
      return user ? `user:${user.id}` : getClientIP(req);
    }
  })
};

/**
 * DETECTOR DE ATAQUES Y PATRONES MALICIOSOS
 */
export const attackDetection = (req: Request, res: Response, next: NextFunction): void => {
  const ip = getClientIP(req);
  const userAgent = getUserAgent(req) || '';
  const url = req.originalUrl;
  const method = req.method;

  // Verificar IP bloqueada
  if (blockedIPs.has(ip)) {
    logSecurityEvent({
      type: 'BLOCKED_IP_ACCESS_ATTEMPT',
      ip,
      userAgent,
      details: { url, method },
      risk: 'high',
      timestamp: new Date()
    });

    const response = ResponseFormatter.error('ACCESS_DENIED', 'Acceso denegado');
    res.status(403).json(response);
    return;
  }

  // Detección de User-Agents sospechosos
  const suspiciousAgents = [
    /sqlmap/i,
    /nmap/i,
    /nikto/i,
    /masscan/i,
    /zap/i,
    /burpsuite/i,
    /crawler/i,
    /bot/i
  ];

  if (suspiciousAgents.some(pattern => pattern.test(userAgent))) {
    logSecurityEvent({
      type: 'SUSPICIOUS_USER_AGENT',
      ip,
      userAgent,
      details: { url, method },
      risk: 'high',
      timestamp: new Date()
    });

    addSuspiciousIP(ip);
  }

  // Detección de SQL Injection
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER|EXEC)\b)/i,
    /(\'|\"|;|--|\||&|\*|%27|%22)/,
    /(\bOR\b.*=.*\bOR\b|\bAND\b.*=.*\bAND\b)/i,
    /(union.*select|select.*from|insert.*into|delete.*from)/i,
    /('|(.27)|(.2D){2})/i
  ];

  const checkSQLInjection = (value: string): boolean => {
    try {
      return sqlInjectionPatterns.some(pattern => pattern.test(decodeURIComponent(value)));
    } catch {
      return sqlInjectionPatterns.some(pattern => pattern.test(value));
    }
  };

  // Verificar URL y parámetros
  let hasSQLInjection = checkSQLInjection(url);
  
  if (req.query && typeof req.query === 'object') {
    Object.values(req.query).forEach(value => {
      if (typeof value === 'string' && checkSQLInjection(value)) {
        hasSQLInjection = true;
      }
    });
  }

  if (hasSQLInjection) {
    logSecurityEvent({
      type: 'SQL_INJECTION_ATTEMPT',
      ip,
      userAgent,
      details: { url, method, query: req.query },
      risk: 'critical',
      timestamp: new Date()
    });

    addSuspiciousIP(ip);
    
    const response = ResponseFormatter.error('MALICIOUS_REQUEST', 'Solicitud maliciosa detectada');
    res.status(400).json(response);
    return;
  }

  // Detección de XSS
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe[^>]*>/i,
    /<object[^>]*>/i,
    /<embed[^>]*>/i,
    /eval\s*\(/i,
    /expression\s*\(/i
  ];

  const checkXSS = (value: string): boolean => {
    try {
      return xssPatterns.some(pattern => pattern.test(decodeURIComponent(value)));
    } catch {
      return xssPatterns.some(pattern => pattern.test(value));
    }
  };

  let hasXSS = false;
  
  // Verificar body
  if (req.body && typeof req.body === 'object') {
    try {
      JSON.stringify(req.body, (_key, value) => {
        if (typeof value === 'string' && checkXSS(value)) {
          hasXSS = true;
        }
        return value;
      });
    } catch (error) {
      // Error al procesar body, log y continúa
      logger.warn('Error processing request body for XSS check', { error });
    }
  }

  // Verificar query parameters
  if (req.query && typeof req.query === 'object') {
    Object.values(req.query).forEach(value => {
      if (typeof value === 'string' && checkXSS(value)) {
        hasXSS = true;
      }
    });
  }

  if (hasXSS) {
    logSecurityEvent({
      type: 'XSS_ATTEMPT',
      ip,
      userAgent,
      details: { url, method },
      risk: 'high',
      timestamp: new Date()
    });

    addSuspiciousIP(ip);

    const response = ResponseFormatter.error('MALICIOUS_REQUEST', 'Contenido malicioso detectado');
    res.status(400).json(response);
    return;
  }

  // Detección de Path Traversal
  const pathTraversalPatterns = [
    /\.\.\//,
    /\.\.\\/,
    /%2e%2e%2f/i,
    /%2e%2e%5c/i,
    /\.\..%2f/i,
    /\.\..%5c/i
  ];

  if (pathTraversalPatterns.some(pattern => pattern.test(url))) {
    logSecurityEvent({
      type: 'PATH_TRAVERSAL_ATTEMPT',
      ip,
      userAgent,
      details: { url, method },
      risk: 'high',
      timestamp: new Date()
    });

    addSuspiciousIP(ip);

    const response = ResponseFormatter.error('MALICIOUS_REQUEST', 'Intento de acceso no autorizado detectado');
    res.status(400).json(response);
    return;
  }

  next();
};

/**
 * LOGGER DE EVENTOS DE AUTENTICACIÓN
 */
export const authEventLogger = (req: Request, res: Response, next: NextFunction): void => {
  const originalSend = res.send;
  
  res.send = function(body: any) {
    // Log eventos de autenticación según la respuesta
    if (req.path.includes('/login') || req.path.includes('/auth')) {
      const statusCode = res.statusCode;
      let responseData: any;
      
      try {
        responseData = typeof body === 'string' ? JSON.parse(body) : body;
      } catch {
        responseData = { success: false };
      }
      
      const ip = getClientIP(req);
      
      if (statusCode === 200 && responseData.success) {
        logSecurityEvent({
          type: 'LOGIN_SUCCESS',
          ip,
          userAgent: getUserAgent(req),
          details: { email: req.body?.email },
          risk: 'low',
          timestamp: new Date()
        });
      } else if (statusCode === 401 || !responseData.success) {
        logSecurityEvent({
          type: 'LOGIN_FAILURE',
          ip,
          userAgent: getUserAgent(req),
          details: { 
            email: req.body?.email,
            reason: responseData.error?.message || responseData.message
          },
          risk: 'medium',
          timestamp: new Date()
        });

        // Marcar IP como sospechosa después de varios fallos
        const recentFailures = securityEvents.filter(
          event => event.type === 'LOGIN_FAILURE' && 
                   event.ip === ip && 
                   Date.now() - event.timestamp.getTime() < 15 * 60 * 1000 // 15 minutos
        );

        if (recentFailures.length >= 5) {
          addSuspiciousIP(ip);
        }
      }
    }

    return originalSend.call(this, body);
  };
  
  next();
};

/**
 * VALIDADOR DE HEADERS DE SEGURIDAD
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Agregar headers de seguridad a la respuesta
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.removeHeader('X-Powered-By');

  // Validar Content-Type en requests con body
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    
    if (!contentType || (!contentType.includes('application/json') && !contentType.includes('multipart/form-data'))) {
      const response = ResponseFormatter.error(
        'INVALID_CONTENT_TYPE',
        'Content-Type debe ser application/json'
      );
      res.status(400).json(response);
      return;
    }
  }

  // Validar tamaño de request
  const contentLength = parseInt(req.get('Content-Length') || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    logSecurityEvent({
      type: 'LARGE_REQUEST',
      ip: getClientIP(req),
      userAgent: getUserAgent(req),
      details: { contentLength, maxSize },
      risk: 'medium',
      timestamp: new Date()
    });

    const response = ResponseFormatter.error(
      'REQUEST_TOO_LARGE',
      'Solicitud demasiado grande'
    );
    res.status(413).json(response);
    return;
  }

  next();
};

/**
 * FUNCIONES AUXILIARES DE SEGURIDAD
 */
const logSecurityEvent = (event: SecurityEvent): void => {
  securityEvents.push(event);
  
  // Mantener solo los últimos 1000 eventos en memoria
  if (securityEvents.length > 1000) {
    securityEvents.splice(0, securityEvents.length - 1000);
  }
  
  // Log estructurado
  logger.warn('Security event detected', {
    securityEvent: event,
    type: 'security_alert'
  });

  // Alertas críticas en producción
  if (event.risk === 'critical' && process.env.NODE_ENV === 'production') {
    console.error('🚨 CRITICAL SECURITY EVENT:', event);
    // Aquí se podría integrar con servicios de alertas como Slack, email, etc.
  }
};

const addSuspiciousIP = (ip: string): void => {
  suspiciousIPs.add(ip);
  
  // Auto-bloquear después de múltiples eventos sospechosos
  const suspiciousEvents = securityEvents.filter(
    event => event.ip === ip && 
             ['medium', 'high', 'critical'].includes(event.risk) &&
             Date.now() - event.timestamp.getTime() < 60 * 60 * 1000 // 1 hora
  );

  if (suspiciousEvents.length >= 10) {
    blockedIPs.add(ip);
    
    logSecurityEvent({
      type: 'IP_AUTO_BLOCKED',
      ip,
      details: { 
        suspiciousEventCount: suspiciousEvents.length,
        reason: 'Múltiples eventos de seguridad detectados'
      },
      risk: 'critical',
      timestamp: new Date()
    });

    // En producción, actualizar firewall o sistema de bloqueo externo
    console.warn(`🔒 IP ${ip} bloqueada automáticamente por actividad sospechosa`);
  }
};

/**
 * FUNCIONES DE ADMINISTRACIÓN
 */

// Desbloquear IP (solo para administradores)
export const unblockIP = (ip: string): boolean => {
  const wasBlocked = blockedIPs.delete(ip);
  suspiciousIPs.delete(ip);
  
  if (wasBlocked) {
    logSecurityEvent({
      type: 'IP_MANUALLY_UNBLOCKED',
      ip,
      details: { action: 'manual_unblock' },
      risk: 'low',
      timestamp: new Date()
    });
  }
  
  return wasBlocked;
};

// Limpiar eventos antiguos
export const cleanupOldEvents = (maxAgeHours: number = 24): number => {
  const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
  const initialLength = securityEvents.length;
  
  for (let i = securityEvents.length - 1; i >= 0; i--) {
    const event = securityEvents[i];
    if (event && event.timestamp.getTime() < cutoffTime) {
      securityEvents.splice(i, 1);
    }
  }
  
  return initialLength - securityEvents.length;
};

/**
 * ENDPOINT DE ESTADÍSTICAS (solo para administradores)
 */
export const getSecurityStats = (_req: Request, res: Response): void => {
  const now = Date.now();
  const last24h = now - (24 * 60 * 60 * 1000);
  const lastHour = now - (60 * 60 * 1000);
  
  const recentEvents = securityEvents.filter(
    event => event.timestamp.getTime() > last24h
  );
  
  const stats = {
    summary: {
      totalEvents: securityEvents.length,
      eventsLast24h: recentEvents.length,
      eventsLastHour: securityEvents.filter(
        event => event.timestamp.getTime() > lastHour
      ).length,
      suspiciousIPs: Array.from(suspiciousIPs),
      blockedIPs: Array.from(blockedIPs),
      topRisks: recentEvents.filter(e => ['high', 'critical'].includes(e.risk)).length
    },
    
    eventsByType: recentEvents.reduce((acc: Record<string, number>, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {}),
    
    riskDistribution: recentEvents.reduce((acc: Record<string, number>, event) => {
      acc[event.risk] = (acc[event.risk] || 0) + 1;
      return acc;
    }, {}),
    
    topIPs: Object.entries(
      recentEvents.reduce((acc: Record<string, number>, event) => {
        acc[event.ip] = (acc[event.ip] || 0) + 1;
        return acc;
      }, {})
    )
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10),
    
    recentCriticalEvents: securityEvents
      .filter(event => event.risk === 'critical' && event.timestamp.getTime() > last24h)
      .slice(-20)
      .map(event => ({
        type: event.type,
        ip: event.ip,
        timestamp: event.timestamp,
        risk: event.risk
      }))
  };

  const response = ResponseFormatter.success(stats, 'Estadísticas de seguridad obtenidas');
  res.json(response);
};

// Exportar funciones de utilidad para tests
export const securityUtils = {
  getSecurityEvents: () => [...securityEvents],
  getSuspiciousIPs: () => Array.from(suspiciousIPs),
  getBlockedIPs: () => Array.from(blockedIPs),
  clearSecurityData: () => {
    securityEvents.length = 0;
    suspiciousIPs.clear();
    blockedIPs.clear();
  }
};
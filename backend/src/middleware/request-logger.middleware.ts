import { Request, Response, NextFunction } from 'express';
import { logger } from '../shared/utils/logger';

/**
 * Middleware de logging de requests con Winston
 * Reemplaza a Morgan con logger estructurado
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log de request entrante
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    requestId: (req as any).id
  });

  // Interceptar el response
  const originalSend = res.send;
  res.send = function(data): Response {
    const duration = Date.now() - startTime;
    
    // Log de response
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      requestId: (req as any).id
    };

    if (res.statusCode >= 500) {
      logger.error('HTTP Response - Server Error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Response - Client Error', logData);
    } else if (res.statusCode >= 300) {
      logger.info('HTTP Response - Redirect', logData);
    } else {
      logger.debug('HTTP Response - Success', logData);
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware para loguear errores de requests
 */
export const errorLogger = (err: Error, req: Request, _res: Response, next: NextFunction) => {
  logger.error('Request Error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    requestId: (req as any).id
  });
  
  next(err);
};

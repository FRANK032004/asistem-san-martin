import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AppError, isOperationalError } from '../utils/app-error';
import { ResponseFormatter } from '../utils/response-formatter';
import { logger } from '../utils/logger';

/**
 * Middleware Global de Manejo de Errores
 * Captura todos los errores y los formatea de manera consistente
 */
export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Generar ID único para la request
  const requestId = req.headers['x-request-id'] as string || generateRequestId();

  // Log del error
  logError(err, req, requestId);

  // Determinar si es error operacional o bug del sistema
  if (isOperationalError(err)) {
    handleOperationalError(err as AppError, res, requestId);
  } else {
    handleProgrammingError(err, res, requestId);
  }
};

/**
 * Maneja errores operacionales (esperados)
 */
const handleOperationalError = (err: AppError, res: Response, requestId: string): void => {
  const response = ResponseFormatter.error(
    err.errorCode,
    err.message,
    err.details,
    requestId,
    process.env.NODE_ENV === 'development'
  );

  res.status(err.statusCode).json(response);
};

/**
 * Maneja errores de programación (bugs)
 */
const handleProgrammingError = (err: Error, res: Response, requestId: string): void => {
  // Error de Prisma
  if (err instanceof PrismaClientKnownRequestError) {
    handlePrismaError(err, res, requestId);
    return;
  }

  // Error de validación de JSON
  if (err instanceof SyntaxError && 'body' in err) {
    const response = ResponseFormatter.error(
      'INVALID_JSON',
      'Formato JSON inválido',
      undefined,
      requestId
    );
    res.status(400).json(response);
    return;
  }

  // Error genérico interno
  const response = ResponseFormatter.internal(
    'Error interno del servidor',
    requestId
  );
  
  res.status(500).json(response);
};

/**
 * Maneja errores específicos de Prisma
 */
const handlePrismaError = (err: PrismaClientKnownRequestError, res: Response, requestId: string): void => {
  let statusCode = 500;
  let message = 'Error de base de datos';
  let code = 'DATABASE_ERROR';

  switch (err.code) {
    case 'P2002':
      // Violación de constraint único
      statusCode = 409;
      code = 'DUPLICATE_ENTRY';
      message = 'Ya existe un registro con esos datos';
      break;
      
    case 'P2014':
      // Violación de relación requerida
      statusCode = 400;
      code = 'INVALID_RELATION';
      message = 'Relación inválida detectada';
      break;
      
    case 'P2003':
      // Violación de foreign key
      statusCode = 400;
      code = 'FOREIGN_KEY_VIOLATION';
      message = 'Referencia a registro inexistente';
      break;
      
    case 'P2025':
      // Registro no encontrado
      statusCode = 404;
      code = 'NOT_FOUND';
      message = 'Registro no encontrado';
      break;
      
    default:
      // Error genérico de Prisma
      if (process.env.NODE_ENV === 'development') {
        message = `Error Prisma: ${err.message}`;
      }
  }

  const response = ResponseFormatter.error(
    code,
    message,
    process.env.NODE_ENV === 'development' ? { prismaCode: err.code, meta: err.meta } : undefined,
    requestId
  );

  res.status(statusCode).json(response);
};

/**
 * Middleware para capturar rutas no encontradas
 */
export const notFoundHandler = (req: Request, res: Response, _next: NextFunction): void => {
  const response = ResponseFormatter.notFound(`Ruta ${req.originalUrl}`);
  res.status(404).json(response);
};

/**
 * Wrapper para funciones async que automáticamente captura errores
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware para generar ID único de request
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.headers['x-request-id']) {
    req.headers['x-request-id'] = generateRequestId();
  }
  
  // Añadir ID a la respuesta
  res.setHeader('X-Request-ID', req.headers['x-request-id'] as string);
  
  next();
};

/**
 * Log estructurado de errores
 */
const logError = (err: Error, req: Request, requestId: string): void => {
  const errorLog = {
    requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      ...(err instanceof AppError && {
        statusCode: err.statusCode,
        errorCode: err.errorCode,
        isOperational: err.isOperational
      })
    }
  };

  if (err instanceof AppError && err.statusCode < 500) {
    // Error operacional - log como warning
    logger.warn('Operational error', errorLog);
  } else {
    // Error de sistema - log como error
    logger.error('System error', errorLog);
  }
};

/**
 * Generar ID único para request
 */
const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Middleware de validación de contenido
 */
export const contentTypeValidation = (req: Request, res: Response, next: NextFunction): void => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    
    if (!contentType || !contentType.includes('application/json')) {
      const response = ResponseFormatter.error(
        'INVALID_CONTENT_TYPE',
        'Content-Type debe ser application/json'
      );
      res.status(400).json(response);
      return;
    }
  }
  
  next();
};
/**
 * Clases de Error Personalizadas para el Sistema San Martín
 * Implementa jerarquía de errores con códigos y mensajes consistentes
 */

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  errorCode: string;
  details?: any;
  timestamp: Date;

  constructor(
    message: string,
    statusCode: number,
    errorCode: string,
    details?: any
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errorCode = errorCode;
    this.details = details;
    this.timestamp = new Date();

    // Mantener stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Errores específicos del dominio
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Token no válido o expirado') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'No tienes permisos para realizar esta acción') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} no encontrado`, 404, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT_ERROR', details);
  }
}

export class BusinessLogicError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 422, 'BUSINESS_LOGIC_ERROR', details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Error de base de datos', details?: any) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, details?: any) {
    super(`Error en servicio externo: ${service}`, 503, 'EXTERNAL_SERVICE_ERROR', details);
  }
}

// Códigos de error del sistema
export const ERROR_CODES = {
  // Validación
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Autenticación
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  
  // Autorización
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ROLE_NOT_AUTHORIZED: 'ROLE_NOT_AUTHORIZED',
  
  // Recursos
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  
  // Negocio
  HORARIO_CONFLICT: 'HORARIO_CONFLICT',
  DOCENTE_NOT_AVAILABLE: 'DOCENTE_NOT_AVAILABLE',
  UBICACION_OUT_OF_RANGE: 'UBICACION_OUT_OF_RANGE',
  
  // Sistema
  DATABASE_CONNECTION: 'DATABASE_CONNECTION',
  INTERNAL_SERVER: 'INTERNAL_SERVER',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
} as const;

// Helper para crear errores específicos
export const createError = {
  validation: (message: string, field?: string) => 
    new ValidationError(message, { field }),
    
  auth: (code: string = ERROR_CODES.INVALID_CREDENTIALS) => 
    new AuthenticationError(`Error de autenticación: ${code}`),
    
  authorization: (action?: string) => 
    new AuthorizationError(action ? `No autorizado para: ${action}` : undefined),
    
  notFound: (resource: string) => 
    new NotFoundError(resource),
    
  conflict: (message: string, details?: any) => 
    new ConflictError(message, details),
    
  business: (message: string, code?: string) => 
    new BusinessLogicError(message, { code }),
    
  database: (operation?: string) => 
    new DatabaseError(operation ? `Error en operación: ${operation}` : undefined)
};

// Verificar si un error es operacional (esperado) vs programa bug
export const isOperationalError = (error: Error): boolean => {
  return error instanceof AppError && error.isOperational;
};
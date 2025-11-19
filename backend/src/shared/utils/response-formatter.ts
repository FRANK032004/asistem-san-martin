/**
 * Formateador de Respuestas Consistentes
 * Estandariza el formato de todas las respuestas del API
 */

interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data: T;
  meta?: {
    timestamp: string;
    version: string;
    requestId?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string;
  };
  meta: {
    timestamp: string;
    version: string;
    requestId?: string;
  };
}

export class ResponseFormatter {
  private static version = '1.0.0';

  /**
   * Formatear respuesta exitosa
   */
  static success<T>(
    data: T,
    message: string = 'Operación exitosa',
    meta?: Partial<SuccessResponse['meta']>
  ): SuccessResponse<T> {
    return {
      success: true,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: this.version,
        ...meta
      }
    };
  }

  /**
   * Formatear respuesta de error
   */
  static error(
    code: string,
    message: string,
    details?: any,
    requestId?: string,
    includeStack: boolean = false
  ): ErrorResponse {
    const response: ErrorResponse = {
      success: false,
      error: {
        code,
        message,
        details
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: this.version,
        ...(requestId && { requestId })
      }
    };

    // Solo incluir stack trace en desarrollo
    if (includeStack && process.env.NODE_ENV === 'development') {
      const stack = new Error().stack;
      if (stack) {
        response.error.stack = stack;
      }
    }

    return response;
  }

  /**
   * Formatear respuesta paginada
   */
  static paginated<T>(
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    message: string = 'Datos obtenidos correctamente'
  ): SuccessResponse<T[]> {
    return this.success(data, message, {
      pagination: {
        ...pagination,
        totalPages: Math.ceil(pagination.total / pagination.limit)
      }
    });
  }

  /**
   * Formatear respuesta de creación
   */
  static created<T>(
    data: T,
    message: string = 'Recurso creado exitosamente'
  ): SuccessResponse<T> {
    return this.success(data, message);
  }

  /**
   * Formatear respuesta de actualización
   */
  static updated<T>(
    data: T,
    message: string = 'Recurso actualizado exitosamente'
  ): SuccessResponse<T> {
    return this.success(data, message);
  }

  /**
   * Formatear respuesta de eliminación
   */
  static deleted(
    message: string = 'Recurso eliminado exitosamente'
  ): SuccessResponse<null> {
    return this.success(null, message);
  }

  /**
   * Formatear respuesta de validación
   */
  static validation(
    errors: Array<{ field: string; message: string }>
  ): ErrorResponse {
    return this.error(
      'VALIDATION_ERROR',
      'Errores de validación',
      { fields: errors }
    );
  }

  /**
   * Formatear respuesta de autenticación
   */
  static unauthorized(
    message: string = 'Acceso no autorizado'
  ): ErrorResponse {
    return this.error('UNAUTHORIZED', message);
  }

  /**
   * Formatear respuesta de recurso no encontrado
   */
  static notFound(
    resource: string = 'Recurso'
  ): ErrorResponse {
    return this.error('NOT_FOUND', `${resource} no encontrado`);
  }

  /**
   * Formatear respuesta de conflicto
   */
  static conflict(
    message: string,
    details?: any
  ): ErrorResponse {
    return this.error('CONFLICT', message, details);
  }

  /**
   * Formatear respuesta de error interno
   */
  static internal(
    message: string = 'Error interno del servidor',
    requestId?: string
  ): ErrorResponse {
    return this.error('INTERNAL_ERROR', message, undefined, requestId);
  }
}

// Helper para extraer mensaje de error de diferentes tipos
export const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Error desconocido';
};

// Helper para determinar si mostrar detalles de error
export const shouldShowErrorDetails = (): boolean => {
  return process.env.NODE_ENV === 'development';
};
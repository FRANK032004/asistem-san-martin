/**
 * ============================================================
 * MIDDLEWARE DE PAGINACIÓN PROFESIONAL
 * Sistema de Asistencias - Instituto San Martín
 * ============================================================
 * Manejo consistente de paginación para todos los endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { PAGINATION_CONFIG } from '../constants/security.constants';

/**
 * Interface para parámetros de paginación
 */
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * Interface para metadata de paginación en respuesta
 */
export interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Interface para respuesta paginada
 */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Extiende Request de Express para incluir parámetros de paginación
 */
declare global {
  namespace Express {
    interface Request {
      pagination?: PaginationParams;
    }
  }
}

/**
 * Middleware para parsear y validar parámetros de paginación
 * 
 * @example
 * router.get('/docentes', paginationMiddleware, getDocentes);
 * 
 * Query params soportados:
 * - page: número de página (default: 1)
 * - limit: items por página (default: 10, max: 100)
 * - sort: campo por el cual ordenar (default: 'created_at')
 * - order: dirección del ordenamiento ('asc' | 'desc', default: 'desc')
 */
export const paginationMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // Parsear página
    const page = Math.max(1, parseInt(req.query.page as string) || 1);

    // Parsear límite con validación
    let limit = parseInt(req.query.limit as string) || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE;
    limit = Math.min(
      Math.max(PAGINATION_CONFIG.MIN_PAGE_SIZE, limit),
      PAGINATION_CONFIG.MAX_PAGE_SIZE
    );

    // Calcular skip
    const skip = (page - 1) * limit;

    // Parsear ordenamiento
    const sort = (req.query.sort as string) || 'created_at';
    const order = (req.query.order as string)?.toLowerCase() === 'asc' ? 'asc' : 'desc';

    // Agregar a request
    req.pagination = {
      page,
      limit,
      skip,
      sort,
      order,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Helper para crear metadata de paginación
 * 
 * @example
 * const meta = createPaginationMeta(25, req.pagination!);
 * res.json({ data: results, pagination: meta });
 */
export const createPaginationMeta = (
  totalItems: number,
  params: PaginationParams
): PaginationMeta => {
  const totalPages = Math.ceil(totalItems / params.limit);

  return {
    currentPage: params.page,
    pageSize: params.limit,
    totalPages,
    totalItems,
    hasNextPage: params.page < totalPages,
    hasPreviousPage: params.page > 1,
  };
};

/**
 * Helper para formatear respuesta paginada
 * 
 * @example
 * return res.json(createPaginatedResponse(docentes, totalCount, req.pagination!));
 */
export const createPaginatedResponse = <T>(
  data: T[],
  totalItems: number,
  params: PaginationParams
): PaginatedResponse<T> => {
  return {
    success: true,
    data,
    pagination: createPaginationMeta(totalItems, params),
  };
};

/**
 * Opciones de paginación para Prisma
 * 
 * @example
 * const usuarios = await prisma.usuarios.findMany({
 *   ...getPrismaP aginationOptions(req.pagination!),
 *   where: { activo: true }
 * });
 */
export const getPrismaPaginationOptions = (params: PaginationParams) => {
  return {
    skip: params.skip,
    take: params.limit,
    orderBy: params.sort ? { [params.sort]: params.order } : undefined,
  };
};

/**
 * Validar parámetros de paginación manualmente (sin middleware)
 * Útil para servicios que no usan Express Request
 */
export const validatePaginationParams = (
  page?: number,
  limit?: number
): PaginationParams => {
  const validPage = Math.max(1, page || 1);
  
  // Si limit no está definido o es <= 0, usar default
  let validLimit = (limit && limit > 0) ? limit : PAGINATION_CONFIG.DEFAULT_PAGE_SIZE;
  
  // Aplicar límites min/max
  validLimit = Math.min(
    Math.max(PAGINATION_CONFIG.MIN_PAGE_SIZE, validLimit),
    PAGINATION_CONFIG.MAX_PAGE_SIZE
  );

  return {
    page: validPage,
    limit: validLimit,
    skip: (validPage - 1) * validLimit,
  };
};

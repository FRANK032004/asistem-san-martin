/**
 * 📊 Pagination Helper
 * 
 * Utilidad para manejar paginación de manera consistente en toda la aplicación.
 * Proporciona tipos, interfaces y funciones para paginar cualquier tipo de dato.
 * 
 * @example
 * ```typescript
 * const result = createPaginationResponse(
 *   docentes,
 *   totalCount,
 *   { page: 1, limit: 10 }
 * );
 * ```
 */

/**
 * Parámetros de paginación extraídos de query params
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Metadata de paginación que se envía al cliente
 */
export interface PaginationMeta {
  page: number;           // Página actual (1-indexed)
  limit: number;          // Items por página
  total: number;          // Total de items
  totalPages: number;     // Total de páginas
  hasNext: boolean;       // ¿Hay página siguiente?
  hasPrev: boolean;       // ¿Hay página anterior?
  from: number;           // Índice del primer item en página actual
  to: number;             // Índice del último item en página actual
}

/**
 * Estructura de respuesta paginada
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Configuración por defecto de paginación
 */
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;  // Límite máximo para prevenir abuso

/**
 * Parsea y valida parámetros de paginación desde query params
 * 
 * @param page - Número de página (string desde query)
 * @param limit - Items por página (string desde query)
 * @returns Parámetros validados y parseados
 */
export function parsePaginationParams(
  page?: string | number,
  limit?: string | number
): PaginationParams {
  // Parsear página
  let parsedPage = typeof page === 'string' ? parseInt(page, 10) : (page || DEFAULT_PAGE);
  parsedPage = isNaN(parsedPage) || parsedPage < 1 ? DEFAULT_PAGE : parsedPage;

  // Parsear límite
  let parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : (limit || DEFAULT_LIMIT);
  parsedLimit = isNaN(parsedLimit) || parsedLimit < 1 ? DEFAULT_LIMIT : parsedLimit;
  parsedLimit = parsedLimit > MAX_LIMIT ? MAX_LIMIT : parsedLimit;

  return {
    page: parsedPage,
    limit: parsedLimit
  };
}

/**
 * Calcula skip y take para Prisma basado en página y límite
 * 
 * @param params - Parámetros de paginación
 * @returns Objeto con skip y take para usar en Prisma
 */
export function getPrismaSkipTake(params: PaginationParams): { skip: number; take: number } {
  const { page, limit } = params;
  const skip = (page - 1) * limit;
  
  return {
    skip,
    take: limit
  };
}

/**
 * Crea metadata de paginación basada en datos y parámetros
 * 
 * @param total - Total de items en la base de datos
 * @param params - Parámetros de paginación
 * @param currentCount - Cantidad de items en la página actual
 * @returns Metadata de paginación completa
 */
export function createPaginationMeta(
  total: number,
  params: PaginationParams,
  currentCount: number
): PaginationMeta {
  const { page, limit } = params;
  const totalPages = Math.ceil(total / limit);
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(from + currentCount - 1, total);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    from,
    to
  };
}

/**
 * Crea una respuesta paginada completa
 * 
 * @param data - Array de datos de la página actual
 * @param total - Total de items en la base de datos
 * @param params - Parámetros de paginación
 * @returns Respuesta paginada con data y metadata
 * 
 * @example
 * ```typescript
 * const docentes = await prisma.docentes.findMany({ skip, take });
 * const total = await prisma.docentes.count();
 * 
 * const response = createPaginationResponse(docentes, total, { page: 1, limit: 10 });
 * res.json(response);
 * ```
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const pagination = createPaginationMeta(total, params, data.length);

  return {
    data,
    pagination
  };
}

/**
 * Valida que una página solicitada exista
 * 
 * @param page - Página solicitada
 * @param totalPages - Total de páginas disponibles
 * @returns true si la página es válida
 */
export function isValidPage(page: number, totalPages: number): boolean {
  return page >= 1 && page <= totalPages;
}

/**
 * Calcula el número de página basado en un offset
 * 
 * @param offset - Offset deseado
 * @param limit - Items por página
 * @returns Número de página correspondiente
 */
export function offsetToPage(offset: number, limit: number): number {
  return Math.floor(offset / limit) + 1;
}

/**
 * Calcula el offset basado en un número de página
 * 
 * @param page - Número de página
 * @param limit - Items por página
 * @returns Offset correspondiente
 */
export function pageToOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

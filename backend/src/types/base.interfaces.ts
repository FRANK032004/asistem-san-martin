/**
 * INTERFACES BASE PARA LA ARQUITECTURA
 * Definiciones comunes para Repository y Service patterns
 */

export interface BaseEntity {
  id?: string | number;
  created_at?: Date | null;
  updated_at?: Date | null;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface FilterParams {
  [key: string]: any;
}

/**
 * Repository Base Interface
 */
export interface IBaseRepository<T extends BaseEntity> {
  // CRUD básico
  create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T>;
  findById(id: string | number): Promise<T | null>;
  findAll(params?: PaginationParams & FilterParams): Promise<PaginationResult<T>>;
  update(id: string | number, data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>): Promise<T | null>;
  delete(id: string | number): Promise<boolean>;
  
  // Utilidades
  exists(id: string | number): Promise<boolean>;
  count(filter?: FilterParams): Promise<number>;
}

/**
 * Service Base Interface
 */
export interface IBaseService<T extends BaseEntity> {
  // Operaciones principales
  create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T>;
  getById(id: string | number): Promise<T | null>;
  getAll(params?: PaginationParams & FilterParams): Promise<PaginationResult<T>>;
  update(id: string | number, data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>): Promise<T | null>;
  delete(id: string | number): Promise<boolean>;
  
  // Validación
  validateData(data: Partial<T>): Promise<void>;
  exists(id: string | number): Promise<boolean>;
}
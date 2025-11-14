/**
 * 🪝 usePagination Hook
 * 
 * Hook personalizado para manejar el estado y lógica de paginación.
 * Incluye sincronización con URL, fetching de datos y manejo de errores.
 * 
 * @example
 * ```tsx
 * const { 
 *   data, 
 *   pagination, 
 *   loading, 
 *   error,
 *   goToPage,
 *   setPageSize 
 * } = usePagination('/api/docentes', { initialPageSize: 10 });
 * ```
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api'; // ✅ Importar la instancia de axios con interceptores
import { AxiosError } from 'axios';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  from: number;
  to: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  syncWithUrl?: boolean;
  autoFetch?: boolean;
  queryParams?: Record<string, any>;
}

export interface UsePaginationReturn<T> {
  data: T[];
  pagination: PaginationMeta | null;
  loading: boolean;
  error: string | null;
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  setPageSize: (size: number) => void;
  refresh: () => void;
  setQueryParams: (params: Record<string, any>) => void;
}

export function usePagination<T = any>(
  endpoint: string,
  options: UsePaginationOptions = {}
): UsePaginationReturn<T> {
  const {
    initialPage = 1,
    initialPageSize = 10,
    syncWithUrl = true,
    autoFetch = true,
    queryParams: initialQueryParams = {}
  } = options;

  const router = useRouter();
  const searchParams = useSearchParams();

  // Estado
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [queryParams, setQueryParamsState] = useState(initialQueryParams);

  // Inicializar desde URL si syncWithUrl está activo
  useEffect(() => {
    if (syncWithUrl && searchParams) {
      const pageFromUrl = searchParams.get('page');
      const limitFromUrl = searchParams.get('limit');
      
      if (pageFromUrl) {
        setCurrentPage(parseInt(pageFromUrl, 10));
      }
      if (limitFromUrl) {
        setPageSizeState(parseInt(limitFromUrl, 10));
      }
    }
  }, []);

  // Construir URL con parámetros
  const buildUrl = useCallback((page: number, limit: number): string => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());

    // Agregar query params adicionales
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    });

    return `${endpoint}?${params.toString()}`;
  }, [endpoint, queryParams]);

  // Actualizar URL del navegador
  const updateUrl = useCallback((page: number, limit: number) => {
    if (!syncWithUrl || !searchParams) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    params.set('limit', limit.toString());

    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams, syncWithUrl]);

  // Función principal de fetch
  const fetchData = useCallback(async (page: number, limit: number) => {
    setLoading(true);
    setError(null);

    try {
      const url = buildUrl(page, limit);
      
      // ✅ Usar axios en lugar de fetch para aprovechar interceptores (refresh token automático)
      const response = await api.get(url);
      
      const result = response.data;

      // Manejar diferentes formatos de respuesta
      if (result.success && result.data) {
        // Formato: { success: true, data: { data: [], pagination: {} } }
        if (result.data.data && result.data.pagination) {
          setData(result.data.data);
          setPagination(result.data.pagination);
        } 
        // Formato: { success: true, data: [] }
        else if (Array.isArray(result.data)) {
          setData(result.data);
          // Crear paginación mock si no viene
          setPagination({
            page,
            limit,
            total: result.data.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
            from: 1,
            to: result.data.length
          });
        }
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (err) {
      // Manejo de errores de axios
      if (err instanceof AxiosError) {
        const errorMessage = err.response?.data?.message || err.message || 'Error al cargar datos';
        setError(errorMessage);
        console.error('❌ Error en usePagination:', errorMessage, err.response?.status);
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar datos';
        setError(errorMessage);
        console.error('❌ Error en usePagination:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  // Efecto para cargar datos cuando cambian los parámetros
  useEffect(() => {
    if (autoFetch) {
      fetchData(currentPage, pageSize);
      updateUrl(currentPage, pageSize);
    }
  }, [currentPage, pageSize, queryParams, autoFetch]);

  // Funciones de navegación
  const goToPage = useCallback((page: number) => {
    if (pagination && page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
    }
  }, [pagination]);

  const goToNextPage = useCallback(() => {
    if (pagination?.hasNext) {
      setCurrentPage(prev => prev + 1);
    }
  }, [pagination]);

  const goToPreviousPage = useCallback(() => {
    if (pagination?.hasPrev) {
      setCurrentPage(prev => prev - 1);
    }
  }, [pagination]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    if (pagination) {
      setCurrentPage(pagination.totalPages);
    }
  }, [pagination]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1); // Resetear a página 1 al cambiar tamaño
  }, []);

  const refresh = useCallback(() => {
    fetchData(currentPage, pageSize);
  }, [currentPage, pageSize, fetchData]);

  const setQueryParams = useCallback((params: Record<string, any>) => {
    setQueryParamsState(params);
    setCurrentPage(1); // Resetear a página 1 al cambiar filtros
  }, []);

  return {
    data,
    pagination,
    loading,
    error,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    setPageSize,
    refresh,
    setQueryParams
  };
}

/**
 * 🔍 Hook simplificado para paginación con búsqueda
 */
export interface UseSearchPaginationOptions extends UsePaginationOptions {
  searchDelay?: number;
}

export function useSearchPagination<T = any>(
  endpoint: string,
  options: UseSearchPaginationOptions = {}
) {
  const { searchDelay = 500, ...paginationOptions } = options;
  const [searchTerm, setSearchTermState] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const paginationResult = usePagination<T>(endpoint, {
    ...paginationOptions,
    queryParams: { search: debouncedSearch, ...paginationOptions.queryParams }
  });

  // Debounce del término de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, searchDelay);

    return () => clearTimeout(timer);
  }, [searchTerm, searchDelay]);

  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
  }, []);

  return {
    ...paginationResult,
    searchTerm,
    setSearchTerm
  };
}

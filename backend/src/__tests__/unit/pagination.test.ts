/**
 * ============================================================
 * TESTS UNITARIOS - PAGINACIÓN
 * Sistema de Asistencias - Instituto San Martín
 * ============================================================
 */

/// <reference types="jest" />

import {
  validatePaginationParams,
  createPaginationMeta,
} from '../../shared/middleware/pagination.middleware';
import { PAGINATION_CONFIG } from '../../shared/constants/security.constants';

describe('Pagination Utils - Unit Tests', () => {
  
  describe('validatePaginationParams', () => {
    it('debe usar valores por defecto cuando no se proporcionan parámetros', () => {
      const result = validatePaginationParams();
      
      expect(result.page).toBe(1);
      expect(result.limit).toBe(PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);
      expect(result.skip).toBe(0);
    });

    it('debe validar página mínima de 1', () => {
      const result = validatePaginationParams(0);
      expect(result.page).toBe(1);
      
      const result2 = validatePaginationParams(-5);
      expect(result2.page).toBe(1);
    });

    it('debe respetar el límite máximo', () => {
      const result = validatePaginationParams(1, 200);
      expect(result.limit).toBe(PAGINATION_CONFIG.MAX_PAGE_SIZE); // 100
    });

    it('debe respetar el límite mínimo', () => {
      const result = validatePaginationParams(1, 0);
      expect(result.limit).toBe(PAGINATION_CONFIG.DEFAULT_PAGE_SIZE); // Usa default cuando es 0
      
      const result2 = validatePaginationParams(1, -10);
      expect(result2.limit).toBe(PAGINATION_CONFIG.DEFAULT_PAGE_SIZE); // Usa default cuando es negativo
    });

    it('debe calcular skip correctamente', () => {
      // Página 1, límite 10
      const result1 = validatePaginationParams(1, 10);
      expect(result1.skip).toBe(0);
      
      // Página 2, límite 10
      const result2 = validatePaginationParams(2, 10);
      expect(result2.skip).toBe(10);
      
      // Página 3, límite 20
      const result3 = validatePaginationParams(3, 20);
      expect(result3.skip).toBe(40);
      
      // Página 5, límite 25
      const result4 = validatePaginationParams(5, 25);
      expect(result4.skip).toBe(100);
    });

    it('debe aceptar límites válidos', () => {
      const validLimits = [1, 10, 20, 50, 100];
      
      validLimits.forEach(limit => {
        const result = validatePaginationParams(1, limit);
        expect(result.limit).toBe(limit);
      });
    });
  });

  describe('createPaginationMeta', () => {
    it('debe crear metadata correcta para la primera página', () => {
      const params = validatePaginationParams(1, 10);
      const meta = createPaginationMeta(100, params);
      
      expect(meta.currentPage).toBe(1);
      expect(meta.pageSize).toBe(10);
      expect(meta.totalPages).toBe(10);
      expect(meta.totalItems).toBe(100);
      expect(meta.hasNextPage).toBe(true);
      expect(meta.hasPreviousPage).toBe(false);
    });

    it('debe crear metadata correcta para página intermedia', () => {
      const params = validatePaginationParams(5, 10);
      const meta = createPaginationMeta(100, params);
      
      expect(meta.currentPage).toBe(5);
      expect(meta.hasNextPage).toBe(true);
      expect(meta.hasPreviousPage).toBe(true);
    });

    it('debe crear metadata correcta para última página', () => {
      const params = validatePaginationParams(10, 10);
      const meta = createPaginationMeta(100, params);
      
      expect(meta.currentPage).toBe(10);
      expect(meta.totalPages).toBe(10);
      expect(meta.hasNextPage).toBe(false);
      expect(meta.hasPreviousPage).toBe(true);
    });

    it('debe manejar correctamente totales que no son múltiplos del límite', () => {
      const params = validatePaginationParams(1, 10);
      const meta = createPaginationMeta(95, params);
      
      expect(meta.totalPages).toBe(10); // 95/10 = 9.5 → 10 páginas
      expect(meta.totalItems).toBe(95);
    });

    it('debe manejar caso sin resultados', () => {
      const params = validatePaginationParams(1, 10);
      const meta = createPaginationMeta(0, params);
      
      expect(meta.totalPages).toBe(0);
      expect(meta.totalItems).toBe(0);
      expect(meta.hasNextPage).toBe(false);
      expect(meta.hasPreviousPage).toBe(false);
    });

    it('debe calcular totalPages correctamente', () => {
      const testCases = [
        { total: 10, limit: 10, expected: 1 },
        { total: 11, limit: 10, expected: 2 },
        { total: 100, limit: 20, expected: 5 },
        { total: 101, limit: 20, expected: 6 },
        { total: 1, limit: 10, expected: 1 },
      ];

      testCases.forEach(({ total, limit, expected }) => {
        const params = validatePaginationParams(1, limit);
        const meta = createPaginationMeta(total, params);
        expect(meta.totalPages).toBe(expected);
      });
    });
  });

  describe('Edge Cases', () => {
    it('debe manejar números muy grandes', () => {
      const params = validatePaginationParams(1000, 100);
      const meta = createPaginationMeta(10000, params);
      
      expect(meta.currentPage).toBe(1000);
      expect(meta.totalPages).toBe(100); // 10000/100
    });

    it('debe manejar límite de 1 item por página', () => {
      const params = validatePaginationParams(5, 1);
      expect(params.limit).toBe(1);
      expect(params.skip).toBe(4);
    });
  });
});

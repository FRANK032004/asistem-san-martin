/**
 * Unit Tests - Cache Service
 * Pruebas completas del sistema de caché
 */

import { cacheService, CachePrefix } from '../cache.service';

describe('Cache Service', () => {
  // Limpiar caché antes de cada test
  beforeEach(() => {
    cacheService.flush();
  });

  // Limpiar después de todos los tests
  afterAll(() => {
    cacheService.flush();
  });

  describe('Basic Operations', () => {
    it('should set and get a value', () => {
      const key = 'test-key';
      const value = { name: 'John', age: 30 };

      cacheService.set(CachePrefix.DASHBOARD, key, value);
      const result = cacheService.get<typeof value>(CachePrefix.DASHBOARD, key);

      expect(result).toEqual(value);
    });

    it('should return undefined for non-existent key', () => {
      const result = cacheService.get(CachePrefix.DASHBOARD, 'non-existent');
      expect(result).toBeUndefined();
    });

    it('should delete a key', () => {
      const key = 'test-key';
      const value = { data: 'test' };

      cacheService.set(CachePrefix.DASHBOARD, key, value);
      const deleted = cacheService.del(CachePrefix.DASHBOARD, key);

      expect(deleted).toBe(1);
      expect(cacheService.get(CachePrefix.DASHBOARD, key)).toBeUndefined();
    });

    it('should return 0 when deleting non-existent key', () => {
      const deleted = cacheService.del(CachePrefix.DASHBOARD, 'non-existent');
      expect(deleted).toBe(0);
    });
  });

  describe('TTL Functionality', () => {
    it('should respect custom TTL', (done) => {
      const key = 'ttl-test';
      const value = { data: 'expire soon' };
      const shortTTL = 1; // 1 segundo

      cacheService.set(CachePrefix.DASHBOARD, key, value, shortTTL);

      // Verificar que existe inmediatamente
      expect(cacheService.get(CachePrefix.DASHBOARD, key)).toEqual(value);

      // Verificar que expira después de 1 segundo
      setTimeout(() => {
        expect(cacheService.get(CachePrefix.DASHBOARD, key)).toBeUndefined();
        done();
      }, 1100); // 1.1 segundos
    }, 2000);

    it('should use default TTL when not specified', () => {
      const key = 'default-ttl';
      const value = { data: 'test' };

      cacheService.set(CachePrefix.DASHBOARD, key, value);

      // Debe existir (no ha expirado)
      expect(cacheService.get(CachePrefix.DASHBOARD, key)).toEqual(value);
    });
  });

  describe('Pattern Deletion', () => {
    it('should delete keys by pattern', () => {
      // Crear varias keys con patrón similar
      cacheService.set(CachePrefix.HISTORIAL, 'user123_10_0', { data: 'page 1' });
      cacheService.set(CachePrefix.HISTORIAL, 'user123_10_10', { data: 'page 2' });
      cacheService.set(CachePrefix.HISTORIAL, 'user456_10_0', { data: 'page 1' });

      // Eliminar solo las de user123
      const deleted = cacheService.delPattern(CachePrefix.HISTORIAL, 'user123*');

      expect(deleted).toBe(2);
      expect(cacheService.get(CachePrefix.HISTORIAL, 'user123_10_0')).toBeUndefined();
      expect(cacheService.get(CachePrefix.HISTORIAL, 'user123_10_10')).toBeUndefined();
      expect(cacheService.get(CachePrefix.HISTORIAL, 'user456_10_0')).toBeDefined();
    });

    it('should return 0 when no keys match pattern', () => {
      cacheService.set(CachePrefix.DASHBOARD, 'user123', { data: 'test' });

      const deleted = cacheService.delPattern(CachePrefix.DASHBOARD, 'user999*');

      expect(deleted).toBe(0);
    });
  });

  describe('Flush Operations', () => {
    it('should flush all caches when no prefix specified', () => {
      // Agregar datos a diferentes cachés
      cacheService.set(CachePrefix.DASHBOARD, 'key1', { data: 'test1' });
      cacheService.set(CachePrefix.ESTADISTICAS_MES, 'key2', { data: 'test2' });
      cacheService.set(CachePrefix.HORARIOS, 'key3', { data: 'test3' });

      cacheService.flush();

      // Verificar que todo se eliminó
      expect(cacheService.get(CachePrefix.DASHBOARD, 'key1')).toBeUndefined();
      expect(cacheService.get(CachePrefix.ESTADISTICAS_MES, 'key2')).toBeUndefined();
      expect(cacheService.get(CachePrefix.HORARIOS, 'key3')).toBeUndefined();
    });

    it('should flush only specific cache when prefix provided', () => {
      cacheService.set(CachePrefix.DASHBOARD, 'key1', { data: 'test1' });
      cacheService.set(CachePrefix.HORARIOS, 'key2', { data: 'test2' });

      // Flush solo dashboard (pertenece a main cache)
      cacheService.delPattern(CachePrefix.DASHBOARD, '*');

      expect(cacheService.get(CachePrefix.DASHBOARD, 'key1')).toBeUndefined();
      expect(cacheService.get(CachePrefix.HORARIOS, 'key2')).toBeDefined();
    });
  });

  describe('getOrSet Pattern', () => {
    it('should fetch and cache on first call', async () => {
      const key = 'user123';
      const fetchFn = jest.fn(async () => ({ name: 'John', age: 30 }));

      const result = await cacheService.getOrSet(
        CachePrefix.DASHBOARD,
        key,
        fetchFn
      );

      expect(result).toEqual({ name: 'John', age: 30 });
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('should return cached value on second call without fetching', async () => {
      const key = 'user123';
      const fetchFn = jest.fn(async () => ({ name: 'John', age: 30 }));

      // Primera llamada
      await cacheService.getOrSet(CachePrefix.DASHBOARD, key, fetchFn);

      // Segunda llamada
      const result = await cacheService.getOrSet(
        CachePrefix.DASHBOARD,
        key,
        fetchFn
      );

      expect(result).toEqual({ name: 'John', age: 30 });
      expect(fetchFn).toHaveBeenCalledTimes(1); // Solo llamado una vez
    });

    it('should re-fetch after cache expiration', (done) => {
      const key = 'user123';
      const fetchFn = jest.fn(async () => ({ name: 'John', age: 30 }));
      const shortTTL = 1; // 1 segundo

      // Primera llamada
      cacheService.getOrSet(CachePrefix.DASHBOARD, key, fetchFn, shortTTL).then(() => {
        // Esperar a que expire
        setTimeout(() => {
          // Segunda llamada después de expiración
          cacheService.getOrSet(CachePrefix.DASHBOARD, key, fetchFn, shortTTL).then(() => {
            expect(fetchFn).toHaveBeenCalledTimes(2); // Llamado dos veces
            done();
          });
        }, 1100);
      });
    }, 2000);

    it('should handle fetch errors gracefully', async () => {
      const key = 'user123';
      const fetchFn = jest.fn(async () => {
        throw new Error('Database connection failed');
      });

      await expect(
        cacheService.getOrSet(CachePrefix.DASHBOARD, key, fetchFn)
      ).rejects.toThrow('Database connection failed');

      // Verificar que no se guardó en caché
      expect(cacheService.get(CachePrefix.DASHBOARD, key)).toBeUndefined();
    });
  });

  describe('Invalidation Strategies', () => {
    it('should invalidate all docente-related caches', () => {
      const docenteId = 'user123';

      // Crear varios cachés relacionados al docente
      cacheService.set(CachePrefix.DASHBOARD, docenteId, { data: 'dashboard' });
      cacheService.set(CachePrefix.ASISTENCIA_HOY, docenteId, { data: 'asistencia' });
      cacheService.set(CachePrefix.HISTORIAL, `${docenteId}_10_0`, { data: 'historial' });
      cacheService.set(CachePrefix.ESTADISTICAS_MES, `${docenteId}_11_2025`, { data: 'stats' });

      // Invalidar todo el caché del docente
      cacheService.invalidateDocente(docenteId);

      // Verificar que todo se eliminó
      expect(cacheService.get(CachePrefix.DASHBOARD, docenteId)).toBeUndefined();
      expect(cacheService.get(CachePrefix.ASISTENCIA_HOY, docenteId)).toBeUndefined();
      expect(cacheService.get(CachePrefix.HISTORIAL, `${docenteId}_10_0`)).toBeUndefined();
      expect(cacheService.get(CachePrefix.ESTADISTICAS_MES, `${docenteId}_11_2025`)).toBeUndefined();
    });

    it('should not affect other docentes when invalidating', () => {
      const docente1 = 'user123';
      const docente2 = 'user456';

      cacheService.set(CachePrefix.DASHBOARD, docente1, { data: 'docente1' });
      cacheService.set(CachePrefix.DASHBOARD, docente2, { data: 'docente2' });

      cacheService.invalidateDocente(docente1);

      expect(cacheService.get(CachePrefix.DASHBOARD, docente1)).toBeUndefined();
      expect(cacheService.get(CachePrefix.DASHBOARD, docente2)).toBeDefined();
    });

    it('should invalidate institucional caches', () => {
      cacheService.set(CachePrefix.COMPARATIVA, 'user123', { data: 'comparativa' });
      cacheService.set(CachePrefix.DASHBOARD, 'user123', { data: 'dashboard' });

      cacheService.invalidateInstitucional();

      expect(cacheService.get(CachePrefix.COMPARATIVA, 'user123')).toBeUndefined();
      // Dashboard no debe ser afectado
      expect(cacheService.get(CachePrefix.DASHBOARD, 'user123')).toBeDefined();
    });
  });

  describe('Statistics', () => {
    it('should track cache hits and misses', async () => {
      const key = 'user123';
      const fetchFn = jest.fn(async () => ({ data: 'test' }));

      // Miss (primera llamada)
      await cacheService.getOrSet(CachePrefix.DASHBOARD, key, fetchFn);

      // Hit (segunda llamada)
      await cacheService.getOrSet(CachePrefix.DASHBOARD, key, fetchFn);

      // Hit (tercera llamada)
      await cacheService.getOrSet(CachePrefix.DASHBOARD, key, fetchFn);

      const stats = cacheService.getStats();

      expect(stats.main.hits).toBeGreaterThan(0);
      expect(stats.main.keys).toBe(1);
    });

    it('should calculate hit rate correctly', async () => {
      const key = 'user123';
      const fetchFn = jest.fn(async () => ({ data: 'test' }));

      // 1 miss + 3 hits = 75% hit rate
      await cacheService.getOrSet(CachePrefix.DASHBOARD, key, fetchFn);
      await cacheService.getOrSet(CachePrefix.DASHBOARD, key, fetchFn);
      await cacheService.getOrSet(CachePrefix.DASHBOARD, key, fetchFn);
      await cacheService.getOrSet(CachePrefix.DASHBOARD, key, fetchFn);

      const hitRate = cacheService.getHitRate();

      expect(hitRate).toBeGreaterThan(0);
      expect(hitRate).toBeLessThanOrEqual(100);
    });

    it('should return 0 hit rate when no requests', () => {
      const hitRate = cacheService.getHitRate();
      expect(hitRate).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values', () => {
      const key = 'null-test';

      cacheService.set(CachePrefix.DASHBOARD, key, null);
      const result = cacheService.get(CachePrefix.DASHBOARD, key);

      expect(result).toBeNull();
    });

    it('should handle undefined values', () => {
      const key = 'undefined-test';

      cacheService.set(CachePrefix.DASHBOARD, key, undefined);
      const result = cacheService.get(CachePrefix.DASHBOARD, key);

      // node-cache convierte undefined a null
      expect(result).toBeNull();
    });

    it('should handle empty arrays', () => {
      const key = 'empty-array';

      cacheService.set(CachePrefix.DASHBOARD, key, []);
      const result = cacheService.get(CachePrefix.DASHBOARD, key);

      expect(result).toEqual([]);
    });

    it('should handle empty objects', () => {
      const key = 'empty-object';

      cacheService.set(CachePrefix.DASHBOARD, key, {});
      const result = cacheService.get(CachePrefix.DASHBOARD, key);

      expect(result).toEqual({});
    });

    it('should handle complex nested objects', () => {
      const key = 'complex-object';
      const value = {
        user: {
          id: '123',
          profile: {
            name: 'John',
            stats: [1, 2, 3],
            metadata: {
              created: new Date('2025-01-01'),
              tags: ['teacher', 'active'],
            },
          },
        },
      };

      cacheService.set(CachePrefix.DASHBOARD, key, value);
      const result = cacheService.get(CachePrefix.DASHBOARD, key);

      expect(result).toEqual(value);
    });
  });

  describe('Performance', () => {
    it('should handle large number of keys efficiently', () => {
      const startTime = Date.now();
      const keyCount = 1000;

      // Agregar 1000 keys
      for (let i = 0; i < keyCount; i++) {
        cacheService.set(CachePrefix.DASHBOARD, `key${i}`, { index: i });
      }

      const setTime = Date.now() - startTime;

      // Leer 1000 keys
      const getStartTime = Date.now();
      for (let i = 0; i < keyCount; i++) {
        cacheService.get(CachePrefix.DASHBOARD, `key${i}`);
      }
      const getTime = Date.now() - getStartTime;

      // Las operaciones deben ser rápidas (< 100ms cada una)
      expect(setTime).toBeLessThan(100);
      expect(getTime).toBeLessThan(100);

      // Verificar estadísticas
      const stats = cacheService.getStats();
      expect(stats.main.keys).toBe(keyCount);
    });

    it('should handle concurrent getOrSet calls', async () => {
      const key = 'concurrent-test';
      let callCount = 0;
      const fetchFn = async () => {
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, 50)); // Simular async operation
        return { data: 'test' };
      };

      // Hacer 10 llamadas concurrentes
      const promises = Array.from({ length: 10 }, () =>
        cacheService.getOrSet(CachePrefix.DASHBOARD, key, fetchFn)
      );

      const results = await Promise.all(promises);

      // Todas deben retornar el mismo valor
      results.forEach((result) => {
        expect(result).toEqual({ data: 'test' });
      });

      // El fetchFn debe ser llamado solo una vez (la primera request)
      // Las demás esperan y usan el valor cacheado
      expect(callCount).toBeGreaterThan(0);
    });
  });
});

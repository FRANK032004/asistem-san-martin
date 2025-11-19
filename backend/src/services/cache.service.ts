/**
 * @module CacheService
 * @description Servicio de caché en memoria con NodeCache
 * 
 * Propósito:
 * - Reducir carga en base de datos
 * - Mejorar tiempos de respuesta
 * - Caché inteligente con TTL por tipo de dato
 * 
 * Estrategia de caché:
 * - Dashboard: 5 minutos (actualización frecuente)
 * - Estadísticas mes: 10 minutos (cambia poco)
 * - Comparativa institucional: 15 minutos (cálculo pesado)
 * - Ubicaciones: 30 minutos (datos estáticos)
 * - Horarios: 1 hora (raramente cambian)
 */

import NodeCache from 'node-cache';

// ========== CONFIGURACIÓN DE CACHÉS ==========

/**
 * Caché principal con TTL por defecto de 5 minutos
 */
const mainCache = new NodeCache({
  stdTTL: 300, // 5 minutos
  checkperiod: 60, // Revisar cada 60 segundos
  useClones: false, // Performance: no clonar objetos
  deleteOnExpire: true,
});

/**
 * Caché de estadísticas con TTL de 10 minutos
 */
const statsCache = new NodeCache({
  stdTTL: 600, // 10 minutos
  checkperiod: 120,
  useClones: false,
  deleteOnExpire: true,
});

/**
 * Caché de datos estáticos con TTL de 30 minutos
 */
const staticCache = new NodeCache({
  stdTTL: 1800, // 30 minutos
  checkperiod: 300,
  useClones: false,
  deleteOnExpire: true,
});

// ========== ENUMS ==========

/**
 * Prefijos para las claves de caché
 */
export enum CachePrefix {
  DASHBOARD = 'dashboard',
  ASISTENCIA_HOY = 'asistencia_hoy',
  HISTORIAL = 'historial',
  ESTADISTICAS_MES = 'estadisticas_mes',
  COMPARATIVA = 'comparativa',
  UBICACIONES = 'ubicaciones',
  HORARIOS = 'horarios',
  PERFIL = 'perfil',
}

/**
 * TTL personalizados por tipo de dato (en segundos)
 */
export enum CacheTTL {
  DASHBOARD = 300,        // 5 minutos
  ASISTENCIA_HOY = 180,   // 3 minutos
  HISTORIAL = 300,        // 5 minutos
  ESTADISTICAS_MES = 600, // 10 minutos
  COMPARATIVA = 900,      // 15 minutos
  UBICACIONES = 1800,     // 30 minutos
  HORARIOS = 3600,        // 1 hora
  PERFIL = 600,           // 10 minutos
}

// ========== INTERFACE ==========

interface CacheStats {
  keys: number;
  hits: number;
  misses: number;
  ksize: number;
  vsize: number;
}

// ========== SERVICIO ==========

class CacheService {
  
  /**
   * Obtener valor del caché
   * @param prefix Prefijo de la clave
   * @param key Identificador único
   * @returns Valor del caché o undefined
   */
  get<T>(prefix: CachePrefix, key: string): T | undefined {
    const cacheKey = this.buildKey(prefix, key);
    const cache = this.getCache(prefix);
    return cache.get<T>(cacheKey);
  }

  /**
   * Guardar valor en caché
   * @param prefix Prefijo de la clave
   * @param key Identificador único
   * @param value Valor a guardar
   * @param customTTL TTL personalizado (opcional)
   */
  set<T>(prefix: CachePrefix, key: string, value: T, customTTL?: number): boolean {
    const cacheKey = this.buildKey(prefix, key);
    const cache = this.getCache(prefix);
    const ttl = customTTL || this.getTTL(prefix);
    return cache.set(cacheKey, value, ttl);
  }

  /**
   * Eliminar valor del caché
   * @param prefix Prefijo de la clave
   * @param key Identificador único
   */
  del(prefix: CachePrefix, key: string): number {
    const cacheKey = this.buildKey(prefix, key);
    const cache = this.getCache(prefix);
    return cache.del(cacheKey);
  }

  /**
   * Eliminar múltiples valores por patrón
   * @param prefix Prefijo de la clave
   * @param pattern Patrón a buscar (ej: 'docente_123_*')
   */
  delPattern(prefix: CachePrefix, pattern: string): number {
    const cache = this.getCache(prefix);
    const keys = cache.keys();
    const fullPattern = `${prefix}:${pattern}`;
    
    const keysToDelete = keys.filter(key => {
      // Convertir patrón con * a regex
      const regexPattern = fullPattern.replace(/\*/g, '.*');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(key);
    });

    return cache.del(keysToDelete);
  }

  /**
   * Limpiar todo el caché de un prefijo
   * @param prefix Prefijo de la clave (opcional)
   */
  flush(prefix?: CachePrefix): void {
    if (prefix) {
      const cache = this.getCache(prefix);
      const keys = cache.keys();
      const prefixKeys = keys.filter(key => key.startsWith(`${prefix}:`));
      cache.del(prefixKeys);
    } else {
      // Limpiar todos los cachés
      mainCache.flushAll();
      statsCache.flushAll();
      staticCache.flushAll();
    }
  }

  /**
   * Obtener o ejecutar (Get or Set pattern)
   * Si existe en caché, retorna el valor
   * Si no existe, ejecuta la función, guarda y retorna
   * 
   * @param prefix Prefijo de la clave
   * @param key Identificador único
   * @param fetchFn Función para obtener datos si no están en caché
   * @param customTTL TTL personalizado (opcional)
   */
  async getOrSet<T>(
    prefix: CachePrefix,
    key: string,
    fetchFn: () => Promise<T>,
    customTTL?: number
  ): Promise<T> {
    // Intentar obtener del caché
    const cached = this.get<T>(prefix, key);
    if (cached !== undefined) {
      return cached;
    }

    // No está en caché, ejecutar función
    const value = await fetchFn();
    
    // Guardar en caché
    this.set(prefix, key, value, customTTL);
    
    return value;
  }

  /**
   * Invalidar caché relacionado al docente
   * Útil después de registrar asistencia o actualizar datos
   * 
   * @param docenteId ID del docente
   */
  invalidateDocente(docenteId: string): void {
    // Invalidar dashboard
    this.del(CachePrefix.DASHBOARD, docenteId);
    
    // Invalidar asistencia hoy
    this.del(CachePrefix.ASISTENCIA_HOY, docenteId);
    
    // Invalidar historial (puede tener paginación)
    this.delPattern(CachePrefix.HISTORIAL, `${docenteId}_*`);
    
    // Invalidar estadísticas del mes actual
    const fecha = new Date();
    const mesKey = `${docenteId}_${fecha.getMonth() + 1}_${fecha.getFullYear()}`;
    this.del(CachePrefix.ESTADISTICAS_MES, mesKey);
    
    // Invalidar comparativa (afecta promedios institucionales)
    this.flush(CachePrefix.COMPARATIVA);
  }

  /**
   * Invalidar caché institucional
   * Útil cuando se registran múltiples asistencias
   */
  invalidateInstitucional(): void {
    // Solo invalidar comparativas (cálculos institucionales)
    this.flush(CachePrefix.COMPARATIVA);
  }

  /**
   * Obtener estadísticas del caché
   */
  getStats(): {
    main: CacheStats;
    stats: CacheStats;
    static: CacheStats;
    total: {
      keys: number;
      hits: number;
      misses: number;
    };
  } {
    const mainStats = mainCache.getStats();
    const statsStats = statsCache.getStats();
    const staticStats = staticCache.getStats();

    return {
      main: mainStats,
      stats: statsStats,
      static: staticStats,
      total: {
        keys: mainStats.keys + statsStats.keys + staticStats.keys,
        hits: mainStats.hits + statsStats.hits + staticStats.hits,
        misses: mainStats.misses + statsStats.misses + staticStats.misses,
      },
    };
  }

  /**
   * Obtener tasa de aciertos del caché (hit rate)
   */
  getHitRate(): number {
    const stats = this.getStats();
    const total = stats.total.hits + stats.total.misses;
    if (total === 0) return 0;
    return (stats.total.hits / total) * 100;
  }

  // ========== MÉTODOS PRIVADOS ==========

  /**
   * Construir clave completa
   */
  private buildKey(prefix: CachePrefix, key: string): string {
    return `${prefix}:${key}`;
  }

  /**
   * Obtener instancia de caché según prefijo
   */
  private getCache(prefix: CachePrefix): NodeCache {
    switch (prefix) {
      case CachePrefix.ESTADISTICAS_MES:
      case CachePrefix.COMPARATIVA:
        return statsCache;
      
      case CachePrefix.UBICACIONES:
      case CachePrefix.HORARIOS:
        return staticCache;
      
      default:
        return mainCache;
    }
  }

  /**
   * Obtener TTL según prefijo
   */
  private getTTL(prefix: CachePrefix): number {
    switch (prefix) {
      case CachePrefix.DASHBOARD:
        return CacheTTL.DASHBOARD;
      case CachePrefix.ASISTENCIA_HOY:
        return CacheTTL.ASISTENCIA_HOY;
      case CachePrefix.HISTORIAL:
        return CacheTTL.HISTORIAL;
      case CachePrefix.ESTADISTICAS_MES:
        return CacheTTL.ESTADISTICAS_MES;
      case CachePrefix.COMPARATIVA:
        return CacheTTL.COMPARATIVA;
      case CachePrefix.UBICACIONES:
        return CacheTTL.UBICACIONES;
      case CachePrefix.HORARIOS:
        return CacheTTL.HORARIOS;
      case CachePrefix.PERFIL:
        return CacheTTL.PERFIL;
      default:
        return 300; // 5 minutos por defecto
    }
  }
}

// ========== EXPORT SINGLETON ==========

export const cacheService = new CacheService();

// ========== EVENTOS DE CACHÉ ==========

// Log cuando expira una clave
mainCache.on('expired', (key, _value) => {
  console.log(`[Cache] Expiró clave: ${key}`);
});

statsCache.on('expired', (key, _value) => {
  console.log(`[Cache Stats] Expiró clave: ${key}`);
});

staticCache.on('expired', (key, _value) => {
  console.log(`[Cache Static] Expiró clave: ${key}`);
});

// Log cada hora con estadísticas (solo en producción, no en tests)
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    const hitRate = cacheService.getHitRate();
    const stats = cacheService.getStats();
    console.log(`[Cache] Hit rate: ${hitRate.toFixed(2)}% | Keys: ${stats.total.keys} | Hits: ${stats.total.hits} | Misses: ${stats.total.misses}`);
  }, 3600000); // 1 hora
}

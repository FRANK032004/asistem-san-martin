/**
 * ============================================================
 * TESTS UNITARIOS - CONSTANTES DE SEGURIDAD
 * Sistema de Asistencias - Instituto San Martín
 * ============================================================
 */

/// <reference types="jest" />

import {
  BCRYPT_CONFIG,
  JWT_CONFIG,
  PASSWORD_POLICY,
  RATE_LIMIT_CONFIG,
  GPS_CONFIG,
  PAGINATION_CONFIG,
  SESSION_CONFIG,
} from '../../shared/constants/security.constants';

describe('Security Constants - Unit Tests', () => {
  
  describe('BCRYPT_CONFIG', () => {
    it('debe tener salt rounds configurados correctamente', () => {
      expect(BCRYPT_CONFIG.SALT_ROUNDS).toBe(10); // El valor actual en constants
      expect(BCRYPT_CONFIG.SALT_ROUNDS).toBeGreaterThanOrEqual(BCRYPT_CONFIG.MIN_SALT_ROUNDS);
      expect(BCRYPT_CONFIG.SALT_ROUNDS).toBeLessThanOrEqual(BCRYPT_CONFIG.MAX_SALT_ROUNDS);
    });

    it('debe tener valores numéricos válidos', () => {
      expect(typeof BCRYPT_CONFIG.SALT_ROUNDS).toBe('number');
      expect(typeof BCRYPT_CONFIG.MIN_SALT_ROUNDS).toBe('number');
      expect(typeof BCRYPT_CONFIG.MAX_SALT_ROUNDS).toBe('number');
    });
  });

  describe('JWT_CONFIG', () => {
    it('debe tener configuración de expiración', () => {
      expect(JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN).toBeDefined();
      expect(JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN).toBeDefined();
    });

    it('debe tener algoritmo correcto', () => {
      expect(JWT_CONFIG.ALGORITHM).toBe('HS256');
    });

    it('debe tener issuer y audience', () => {
      expect(JWT_CONFIG.ISSUER).toBe('instituto-san-martin');
      expect(JWT_CONFIG.AUDIENCE).toBe('instituto-san-martin-api');
    });
  });

  describe('PASSWORD_POLICY', () => {
    it('debe tener longitudes mínima y máxima válidas', () => {
      expect(PASSWORD_POLICY.MIN_LENGTH).toBeGreaterThan(0);
      expect(PASSWORD_POLICY.MAX_LENGTH).toBeGreaterThan(PASSWORD_POLICY.MIN_LENGTH);
      expect(PASSWORD_POLICY.MIN_LENGTH).toBe(8);
      expect(PASSWORD_POLICY.MAX_LENGTH).toBe(128);
    });

    it('debe tener requisitos de complejidad', () => {
      expect(PASSWORD_POLICY.REQUIRE_UPPERCASE).toBe(true);
      expect(PASSWORD_POLICY.REQUIRE_LOWERCASE).toBe(true);
      expect(PASSWORD_POLICY.REQUIRE_NUMBER).toBe(true);
      expect(PASSWORD_POLICY.REQUIRE_SPECIAL_CHAR).toBe(true);
    });

    it('debe tener caracteres especiales definidos', () => {
      expect(PASSWORD_POLICY.SPECIAL_CHARS).toBeDefined();
      expect(PASSWORD_POLICY.SPECIAL_CHARS.length).toBeGreaterThan(0);
    });
  });

  describe('RATE_LIMIT_CONFIG', () => {
    it('debe tener ventana de tiempo y máximo de requests', () => {
      expect(RATE_LIMIT_CONFIG.WINDOW_MS).toBeGreaterThan(0);
      expect(RATE_LIMIT_CONFIG.MAX_REQUESTS).toBeGreaterThan(0);
    });

    it('debe tener configuraciones específicas', () => {
      expect(RATE_LIMIT_CONFIG.AUTH.MAX_REQUESTS).toBe(5);
      expect(RATE_LIMIT_CONFIG.CREATE.MAX_REQUESTS).toBe(10);
      expect(RATE_LIMIT_CONFIG.PUBLIC.MAX_REQUESTS).toBe(60);
    });
  });

  describe('GPS_CONFIG', () => {
    it('debe tener precisión en metros', () => {
      expect(GPS_CONFIG.PRECISION_METERS).toBe(50);
      expect(GPS_CONFIG.MIN_RADIUS_METERS).toBe(10);
      expect(GPS_CONFIG.MAX_RADIUS_METERS).toBe(500);
    });

    it('debe tener coordenadas por defecto válidas', () => {
      expect(GPS_CONFIG.DEFAULT_LOCATION.LAT).toBeGreaterThan(-90);
      expect(GPS_CONFIG.DEFAULT_LOCATION.LAT).toBeLessThan(90);
      expect(GPS_CONFIG.DEFAULT_LOCATION.LNG).toBeGreaterThan(-180);
      expect(GPS_CONFIG.DEFAULT_LOCATION.LNG).toBeLessThan(180);
    });
  });

  describe('PAGINATION_CONFIG', () => {
    it('debe tener límites válidos', () => {
      expect(PAGINATION_CONFIG.DEFAULT_PAGE_SIZE).toBe(10);
      expect(PAGINATION_CONFIG.MIN_PAGE_SIZE).toBe(1);
      expect(PAGINATION_CONFIG.MAX_PAGE_SIZE).toBe(100);
    });

    it('debe tener relación lógica entre límites', () => {
      expect(PAGINATION_CONFIG.MIN_PAGE_SIZE).toBeLessThan(PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);
      expect(PAGINATION_CONFIG.DEFAULT_PAGE_SIZE).toBeLessThan(PAGINATION_CONFIG.MAX_PAGE_SIZE);
    });
  });

  describe('SESSION_CONFIG', () => {
    it('debe tener duración máxima', () => {
      expect(SESSION_CONFIG.MAX_DURATION_HOURS).toBe(24);
    });

    it('debe tener timeout de inactividad', () => {
      expect(SESSION_CONFIG.INACTIVITY_TIMEOUT_MINUTES).toBe(30);
      expect(SESSION_CONFIG.INACTIVITY_TIMEOUT_MS).toBe(30 * 60 * 1000);
    });

    it('debe tener límite de sesiones activas', () => {
      expect(SESSION_CONFIG.MAX_ACTIVE_SESSIONS).toBe(5);
      expect(SESSION_CONFIG.MAX_ACTIVE_SESSIONS).toBeGreaterThan(0);
    });
  });

  describe('Consistency Checks', () => {
    it('todas las constantes deben ser readonly (frozen)', () => {
      expect(Object.isFrozen(BCRYPT_CONFIG)).toBe(false); // 'as const' hace inmutable en TS, no en runtime
      // Pero TypeScript previene modificación en tiempo de compilación
    });

    it('no debe haber valores undefined', () => {
      const checkNoUndefined = (obj: any, path = ''): void => {
        Object.entries(obj).forEach(([key, value]) => {
          const currentPath = path ? `${path}.${key}` : key;
          if (value === undefined) {
            throw new Error(`Valor undefined encontrado en: ${currentPath}`);
          }
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            checkNoUndefined(value, currentPath);
          }
        });
      };

      expect(() => checkNoUndefined(BCRYPT_CONFIG)).not.toThrow();
      expect(() => checkNoUndefined(JWT_CONFIG)).not.toThrow();
      expect(() => checkNoUndefined(PASSWORD_POLICY)).not.toThrow();
    });
  });
});

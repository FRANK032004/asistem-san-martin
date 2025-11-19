/**
 * ============================================================
 * TESTS UNITARIOS - AUTENTICACIÓN
 * Sistema de Asistencias - Instituto San Martín
 * ============================================================
 * Tests críticos del sistema de autenticación
 */

/// <reference types="jest" />

import { hashPassword, comparePassword, generateToken, verifyToken } from '../../utils/auth';
import { BCRYPT_CONFIG } from '../../shared/constants/security.constants';

describe('Auth Utils - Unit Tests', () => {
  
  describe('hashPassword', () => {
    it('debe generar un hash válido de bcrypt', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(50);
      expect(hash).toMatch(/^\$2[ayb]\$/); // Formato bcrypt
    });

    it('debe generar hashes diferentes para la misma contraseña', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2); // Salt diferente
    });

    it('debe usar el número correcto de rounds', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      // Extraer rounds del hash (formato: $2b$rounds$...)
      const roundsStr = hash.split('$')[2];
      const rounds = roundsStr ? parseInt(roundsStr) : 0;
      expect(rounds).toBe(BCRYPT_CONFIG.SALT_ROUNDS);
    });
  });

  describe('comparePassword', () => {
    it('debe verificar correctamente una contraseña válida', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      const isValid = await comparePassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('debe rechazar una contraseña inválida', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hash = await hashPassword(password);
      
      const isValid = await comparePassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('debe ser case-sensitive', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      const isValid = await comparePassword('testpassword123!', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('generateToken', () => {
    const testPayload = {
      userId: 'test-uuid-123',
      email: 'test@example.com',
      rol: 'docente',
      rol_id: 2, // ID numérico del rol docente
      isDocente: true,
    };

    it('debe generar un JWT válido', () => {
      const token = generateToken(testPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // header.payload.signature
    });

    it('debe incluir el payload en el token', () => {
      const token = generateToken(testPayload);
      const decoded = verifyToken(token);
      
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.rol).toBe(testPayload.rol);
    });
  });

  describe('verifyToken', () => {
    const testPayload = {
      userId: 'test-uuid-123',
      email: 'test@example.com',
      rol: 'docente',
      rol_id: 2, // ID numérico del rol docente
      isDocente: true,
    };

    it('debe verificar correctamente un token válido', () => {
      const token = generateToken(testPayload);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(testPayload.userId);
    });

    it('debe lanzar error con token inválido', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => verifyToken(invalidToken)).toThrow();
    });

    it('debe lanzar error con token manipulado', () => {
      const token = generateToken(testPayload);
      const manipulatedToken = token.slice(0, -5) + 'XXXXX';
      
      expect(() => verifyToken(manipulatedToken)).toThrow();
    });
  });

  describe('Password Validation', () => {
    it('debe aceptar contraseñas válidas', async () => {
      const validPasswords = [
        'Password123!',
        'MyP@ssw0rd',
        'Secure#Pass1',
        'Test@123Pass',
      ];

      for (const password of validPasswords) {
        const hash = await hashPassword(password);
        const isValid = await comparePassword(password, hash);
        expect(isValid).toBe(true);
      }
    });
  });
});

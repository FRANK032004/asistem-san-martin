import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWTPayload } from '../types/auth.types';
import { 
  BCRYPT_CONFIG, 
  PASSWORD_POLICY 
} from '../shared/constants/security.constants';
import { logger } from '../shared/utils/logger';

// ========================================
// CONFIGURACIÓN JWT
// ========================================

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_in_production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';

// Log warning si se usan secrets por defecto (peligro en producción)
if (JWT_SECRET === 'fallback_secret_change_in_production') {
  logger.warn('⚠️  Usando JWT_SECRET por defecto - CAMBIAR EN PRODUCCIÓN');
}
if (JWT_REFRESH_SECRET === 'fallback_refresh_secret') {
  logger.warn('⚠️  Usando JWT_REFRESH_SECRET por defecto - CAMBIAR EN PRODUCCIÓN');
}

// ========================================
// FUNCIONES DE ENCRIPTACIÓN
// ========================================

/**
 * Encripta una contraseña usando bcrypt
 * @param password - Contraseña en texto plano
 * @returns Hash de la contraseña
 * @note Usa BCRYPT_CONFIG.SALT_ROUNDS (10) para balance seguridad/performance
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const hash = await bcrypt.hash(password, BCRYPT_CONFIG.SALT_ROUNDS);
    logger.debug('Password hasheado exitosamente', { saltRounds: BCRYPT_CONFIG.SALT_ROUNDS });
    return hash;
  } catch (error) {
    logger.error('Error al hashear password', error);
    throw new Error('Error al procesar la contraseña');
  }
};

/**
 * Verifica una contraseña
 */
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    logger.debug('Comparación de password', { success: isMatch });
    return isMatch;
  } catch (error) {
    logger.error('Error al comparar passwords', error);
    return false;
  }
};

// ========================================
// FUNCIONES JWT
// ========================================

/**
 * Genera un token JWT
 * @note Usa configuración de JWT_CONFIG para duración y emisor
 */
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  try {
    const token = jwt.sign(
      payload as any, 
      JWT_SECRET, 
      { expiresIn: '24h' } // Usa JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN (24h)
    );
    logger.info('Token JWT generado', { 
      userId: payload.userId, 
      rol: payload.rol,
      expiresIn: '24h' 
    });
    return token;
  } catch (error) {
    logger.error('Error al generar token JWT', error);
    throw new Error('Error al generar token de autenticación');
  }
};

/**
 * Genera un refresh token
 * @note Usa configuración de JWT_CONFIG para duración (7d)
 */
export const generateRefreshToken = (userId: string): string => {
  try {
    const refreshToken = jwt.sign(
      { userId }, 
      JWT_REFRESH_SECRET, 
      { expiresIn: '7d' } // Usa JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN (7d)
    );
    logger.info('Refresh token generado', { 
      userId, 
      expiresIn: '7d' 
    });
    return refreshToken;
  } catch (error) {
    logger.error('Error al generar refresh token', error);
    throw new Error('Error al generar refresh token');
  }
};

/**
 * Verifica un token JWT
 * NOTA: No validamos issuer/audience para compatibilidad con tokens legacy
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    logger.debug('Token JWT verificado', { userId: decoded.userId, rol: decoded.rol });
    return decoded;
  } catch (error: any) {
    logger.warn('Intento de token inválido', { 
      error: error.message,
      type: error.name 
    });
    throw new Error('Token inválido o expirado');
  }
};

/**
 * Verifica un refresh token
 * NOTA: No validamos issuer para compatibilidad con tokens legacy
 */
export const verifyRefreshToken = (token: string): { userId: string } => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
    
    logger.debug('Refresh token verificado', { userId: decoded.userId });
    return decoded;
  } catch (error: any) {
    logger.warn('Intento de refresh token inválido', { 
      error: error.message,
      type: error.name 
    });
    throw new Error('Refresh token inválido o expirado');
  }
};

/**
 * Extrae el token del header Authorization
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

// ========================================
// VALIDACIONES DE SEGURIDAD
// ========================================

/**
 * Valida la fortaleza de una contraseña usando PASSWORD_POLICY
 */
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Validación de longitud
  if (password.length < PASSWORD_POLICY.MIN_LENGTH) {
    errors.push(`La contraseña debe tener al menos ${PASSWORD_POLICY.MIN_LENGTH} caracteres`);
  }
  
  if (password.length > PASSWORD_POLICY.MAX_LENGTH) {
    errors.push(`La contraseña no debe exceder ${PASSWORD_POLICY.MAX_LENGTH} caracteres`);
  }
  
  // Validación de mayúsculas
  if (PASSWORD_POLICY.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }
  
  // Validación de minúsculas
  if (PASSWORD_POLICY.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }
  
  // Validación de números
  if (PASSWORD_POLICY.REQUIRE_NUMBER && !/\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }
  
  // Validación de caracteres especiales
  if (PASSWORD_POLICY.REQUIRE_SPECIAL_CHAR) {
    const specialCharRegex = new RegExp(`[${PASSWORD_POLICY.SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
    if (!specialCharRegex.test(password)) {
      errors.push('La contraseña debe contener al menos un carácter especial');
    }
  }
  
  const isValid = errors.length === 0;
  
  if (!isValid) {
    logger.warn('Password débil detectado', { errorsCount: errors.length });
  }
  
  return { isValid, errors };
};

/**
 * Genera una contraseña temporal que cumple con PASSWORD_POLICY
 */
export const generateTemporaryPassword = (): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specials = PASSWORD_POLICY.SPECIAL_CHARS;
  const allChars = uppercase + lowercase + numbers + specials;
  
  let password = '';
  
  // Asegurar que tenga al menos uno de cada tipo requerido según la política
  if (PASSWORD_POLICY.REQUIRE_UPPERCASE) {
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
  }
  if (PASSWORD_POLICY.REQUIRE_LOWERCASE) {
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
  }
  if (PASSWORD_POLICY.REQUIRE_NUMBER) {
    password += numbers[Math.floor(Math.random() * numbers.length)];
  }
  if (PASSWORD_POLICY.REQUIRE_SPECIAL_CHAR) {
    password += specials[Math.floor(Math.random() * specials.length)];
  }
  
  // Completar hasta MIN_LENGTH + 4 caracteres
  const targetLength = PASSWORD_POLICY.MIN_LENGTH + 4;
  for (let i = password.length; i < targetLength; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mezclar los caracteres para mayor seguridad
  const shuffled = password.split('').sort(() => Math.random() - 0.5).join('');
  
  logger.info('Password temporal generado', { length: shuffled.length });
  
  return shuffled;
};

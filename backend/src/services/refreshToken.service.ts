/**
 * Servicio para gestión de Refresh Tokens
 * Maneja la creación, validación y revocación de refresh tokens
 */

import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Configuración
const ACCESS_TOKEN_EXPIRY = '15m';  // 15 minutos
// Refresh token expiry: 7 días (se calcula al crear cada token)
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Genera un par de tokens (access + refresh)
 */
export async function generateTokenPair(userId: string, email: string): Promise<TokenPair> {
  // Generar access token (corta duración)
  const accessToken = jwt.sign(
    { userId: userId, email },  // ✅ Cambiado de "id" a "userId" para consistencia
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  // Generar refresh token único
  const refreshTokenValue = crypto.randomBytes(64).toString('hex');

  // Calcular fecha de expiración
  const expires_at = new Date();
  expires_at.setDate(expires_at.getDate() + 7); // 7 días

  // Guardar refresh token en BD
  await prisma.refresh_tokens.create({
    data: {
      token: refreshTokenValue,
      usuario_id: userId,
      expires_at,
    },
  });

  return {
    accessToken,
    refreshToken: refreshTokenValue,
  };
}

/**
 * Valida y renueva un refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenPair | null> {
  try {
    // Buscar refresh token en BD
    const tokenRecord = await prisma.refresh_tokens.findUnique({
      where: { token: refreshToken },
      include: { usuarios: true },
    });

    // Validar que existe
    if (!tokenRecord) {
      return null;
    }

    // Validar que no esté revocado
    if (tokenRecord.revoked_at) {
      return null;
    }

    // Validar que no esté expirado
    if (new Date() > tokenRecord.expires_at) {
      return null;
    }

    // Validar que el usuario esté activo
    if (!tokenRecord.usuarios.activo) {
      return null;
    }

    // Revocar el refresh token usado (one-time use)
    await prisma.refresh_tokens.update({
      where: { id: tokenRecord.id },
      data: { revoked_at: new Date() },
    });

    // Generar nuevo par de tokens
    const newTokenPair = await generateTokenPair(
      tokenRecord.usuarios.id,
      tokenRecord.usuarios.email
    );

    return newTokenPair;
  } catch (error) {
    console.error('Error al renovar token:', error);
    return null;
  }
}

/**
 * Revoca todos los refresh tokens de un usuario (logout)
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refresh_tokens.updateMany({
    where: {
      usuario_id: userId,
      revoked_at: null,
    },
    data: {
      revoked_at: new Date(),
    },
  });
}

/**
 * Revoca un refresh token específico
 */
export async function revokeRefreshToken(refreshToken: string): Promise<boolean> {
  try {
    const result = await prisma.refresh_tokens.updateMany({
      where: {
        token: refreshToken,
        revoked_at: null,
      },
      data: {
        revoked_at: new Date(),
      },
    });

    return result.count > 0;
  } catch (error) {
    console.error('Error al revocar token:', error);
    return false;
  }
}

/**
 * Limpia refresh tokens expirados (tarea de mantenimiento)
 */
export async function cleanExpiredTokens(): Promise<number> {
  const result = await prisma.refresh_tokens.deleteMany({
    where: {
      OR: [
        { expires_at: { lt: new Date() } },
        { revoked_at: { not: null } },
      ],
    },
  });

  return result.count;
}

export const refreshTokenService = {
  generateTokenPair,
  refreshAccessToken,
  revokeAllUserTokens,
  revokeRefreshToken,
  cleanExpiredTokens,
};

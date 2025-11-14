import express from 'express';
import { 
  login, 
  register, 
  getProfile, 
  logout, 
  updateProfile, 
  changePassword,
  refreshAccessToken
} from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';
import { validateDTO } from '../middleware/validate.middleware';
import { LoginDTO, RegisterDTO, UpdateProfileDTO, ChangePasswordDTO } from '../dtos/auth.dto';
import { authRateLimiter } from '../middleware/rate-limiter.middleware';

const router = express.Router();

// ========================================
// RUTAS PÚBLICAS
// ========================================

/**
 * POST /api/auth/login
 * Iniciar sesión
 * Valida automáticamente con LoginDTO
 * Rate limited: 5 intentos por 15 minutos
 */
router.post('/login', authRateLimiter, validateDTO(LoginDTO), login);

/**
 * POST /api/auth/register
 * Registrar nuevo usuario (solo admin)
 * Valida automáticamente con RegisterDTO
 * Rate limited: 5 intentos por 15 minutos
 */
router.post('/register', authRateLimiter, validateDTO(RegisterDTO), register);

/**
 * POST /api/auth/refresh
 * Renovar access token usando refresh token
 * No requiere autenticación (usa refresh token)
 * Rate limited: 5 intentos por 15 minutos
 */
router.post('/refresh', authRateLimiter, refreshAccessToken);

// ========================================
// RUTAS PROTEGIDAS
// ========================================

/**
 * GET /api/auth/me
 * Obtener perfil del usuario autenticado
 */
router.get('/me', authenticateToken, getProfile);

/**
 * PUT /api/auth/profile
 * Actualizar perfil del usuario autenticado
 * Valida automáticamente con UpdateProfileDTO
 */
router.put('/profile', authenticateToken, validateDTO(UpdateProfileDTO), updateProfile);

/**
 * POST /api/auth/change-password
 * Cambiar contraseña del usuario autenticado
 * Valida automáticamente con ChangePasswordDTO
 */
router.post('/change-password', authenticateToken, validateDTO(ChangePasswordDTO), changePassword);

/**
 * POST /api/auth/logout
 * Cerrar sesión
 */
router.post('/logout', authenticateToken, logout);

export default router;

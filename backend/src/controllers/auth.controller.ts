import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/database';
import { UserResponse } from '../types/auth.types';
import { asyncHandler } from '../middleware/error-handler';
import { AuthenticationError, AuthorizationError, ConflictError, NotFoundError } from '../utils/app-error';
import { ResponseFormatter } from '../utils/response-formatter';
import { LoginDTO, RegisterDTO } from '../dtos/auth.dto';
import { UpdateProfileDTO, ChangePasswordDTO } from '../dtos/auth.dto';
import { refreshTokenService } from '../services/refreshToken.service';

type AuthRequest = Request & { user?: { id: string; email: string; rol: string; rol_id: number; isDocente: boolean; docenteId?: string; }; usuario?: { id: string; email: string; rol: string; rol_id: number; isDocente: boolean; docenteId?: string; }; }

// ========================================
// CONTROLADOR DE LOGIN
// ========================================
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // DTO ya validado por el middleware
  const { email, password } = req.body as LoginDTO;

  console.log('🔍 Intento de login para:', email);

  // Buscar usuario
  const usuario = await prisma.usuarios.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      roles: true,
      docentes: { include: { areas: true
        }
      }
    }
  });

  if (!usuario) {
    console.log('❌ Usuario no encontrado:', email);
    throw new AuthenticationError('Credenciales inválidas');
  }

  console.log('👤 Usuario encontrado:', usuario.email, 'Rol:', usuario.roles.nombre);

  // 🚫 VALIDACIÓN: Usuario desactivado
  if (!usuario.activo) {
    console.log('❌ Usuario inactivo:', email);
    throw new AuthorizationError('Su cuenta está desactivada. Por favor, comuníquese con el personal administrativo.');
  }

  // 🔒 VALIDACIÓN: Cuenta bloqueada por intentos fallidos
  if (usuario.bloqueado_hasta && usuario.bloqueado_hasta > new Date()) {
    const minutosRestantes = Math.ceil((usuario.bloqueado_hasta.getTime() - Date.now()) / 60000);
    console.log('🔒 Cuenta bloqueada temporalmente:', email, 'Minutos restantes:', minutosRestantes);
    throw new AuthenticationError(
      `Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intente nuevamente en ${minutosRestantes} minuto(s).`
    );
  }

  // 🔄 RESETEAR contador si el bloqueo expiró
  if (usuario.bloqueado_hasta && usuario.bloqueado_hasta <= new Date()) {
    console.log('🔓 Bloqueo expirado, reseteando contador de intentos');
    await prisma.usuarios.update({
      where: { id: usuario.id },
      data: {
        intentos_fallidos: 0,
        bloqueado_hasta: null
      }
    });
    // Actualizar variable local para la lógica siguiente
    usuario.intentos_fallidos = 0;
    usuario.bloqueado_hasta = null;
  }

  // Verificar contraseña
  console.log('🔐 Verificando contraseña...');
  const passwordValid = await bcrypt.compare(password, usuario.password_hash);
  console.log('🔐 Contraseña válida:', passwordValid);
  
  if (!passwordValid) {
    console.log('❌ Contraseña incorrecta para:', email);
    
    // 🔒 INCREMENTAR intentos fallidos
    const intentos_fallidos = (usuario.intentos_fallidos || 0) + 1;
    const MAX_INTENTOS = 5;
    const BLOQUEO_MINUTOS = 15;
    
    let bloqueado_hasta: Date | null = null;
    
    if (intentos_fallidos >= MAX_INTENTOS) {
      bloqueado_hasta = new Date(Date.now() + BLOQUEO_MINUTOS * 60 * 1000);
      console.log('🔒 Bloqueando cuenta por', BLOQUEO_MINUTOS, 'minutos');
    }
    
    await prisma.usuarios.update({
      where: { id: usuario.id },
      data: {
        intentos_fallidos: intentos_fallidos,
        bloqueado_hasta: bloqueado_hasta
      }
    });
    
    if (bloqueado_hasta) {
      throw new AuthenticationError(
        `Cuenta bloqueada por ${BLOQUEO_MINUTOS} minutos debido a múltiples intentos fallidos. Por favor, intente más tarde.`
      );
    }
    
    const intentosRestantes = MAX_INTENTOS - intentos_fallidos;
    throw new AuthenticationError(
      `Credenciales inválidas. Le quedan ${intentosRestantes} intento(s) antes de que su cuenta sea bloqueada temporalmente.`
    );
  }

  // 🔒 RESETEAR intentos fallidos y desbloquear al login exitoso
  await prisma.usuarios.update({
    where: { id: usuario.id },
    data: {
      intentos_fallidos: 0,
      bloqueado_hasta: null,
      ultimo_acceso: new Date()
    }
  });

  // ✨ Generar par de tokens (access + refresh)
  const { accessToken, refreshToken } = await refreshTokenService.generateTokenPair(
    usuario.id,
    usuario.email
  );

  // 🍪 Configurar cookie para refresh token (httpOnly para seguridad)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' permite CORS entre dominios
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
  });

  // Preparar respuesta
  const userResponse: UserResponse = {
    id: usuario.id,
    dni: usuario.dni,
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    email: usuario.email,
    telefono: usuario.telefono,
    activo: usuario.activo,
    roles: {
      id: usuario.roles.id,
      nombre: usuario.roles.nombre,
      descripcion: usuario.roles.descripcion
    },
    docente: Array.isArray(usuario.docentes) && usuario.docentes.length > 0 && usuario.docentes[0] ? {
      id: usuario.docentes[0].id,
      codigo_docente: usuario.docentes[0].codigo_docente,
      areas: usuario.docentes[0].areas ? {
        id: usuario.docentes[0].areas.id,
        nombre: usuario.docentes[0].areas.nombre
      } : undefined
    } : undefined
  };

  const response = ResponseFormatter.success(
    { 
      accessToken,  // 🔑 Access token de 15 minutos
      refreshToken, // 🔄 Refresh token de 7 días
      usuario: userResponse // ✅ Singular para compatibilidad con frontend
    },
    'Login exitoso'
  );

  res.status(200).json(response);
});

// ========================================
// CONTROLADOR DE REFRESH TOKEN
// ========================================
export const refreshAccessToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Obtener refresh token desde cookie o body
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    throw new AuthenticationError('Refresh token no proporcionado');
  }

  console.log('🔄 Intentando renovar access token...');

  // Intentar renovar el access token
  const tokenPair = await refreshTokenService.refreshAccessToken(refreshToken);

  if (!tokenPair) {
    // Token inválido, expirado o revocado
    console.log('❌ Refresh token inválido o expirado');
    res.clearCookie('refreshToken'); // Limpiar cookie inválida
    throw new AuthenticationError('Refresh token inválido o expirado. Por favor, inicie sesión nuevamente.');
  }

  console.log('✅ Access token renovado exitosamente');

  // Actualizar cookie con nuevo refresh token
  res.cookie('refreshToken', tokenPair.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' permite CORS entre dominios
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
  });

  const response = ResponseFormatter.success(
    { 
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken
    },
    'Token renovado exitosamente'
  );

  res.status(200).json(response);
});

// ========================================
// CONTROLADOR DE REGISTRO
// ========================================
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // DTO ya validado por el middleware
  const { email, password, nombres, apellidos, rol, telefono, dni } = req.body as RegisterDTO;

  // Verificar si el usuario ya existe
  const existingUser = await prisma.usuarios.findFirst({
    where: {
      OR: [
        { email: email.toLowerCase() },
        ...(dni ? [{ dni }] : [])
      ]
    }
  });

  if (existingUser) {
    throw new ConflictError('El usuario ya existe');
  }

  // Buscar el rol por nombre
  const rolDb = await prisma.roles.findFirst({
    where: { nombre: { equals: rol, mode: 'insensitive' } }
  });

  if (!rolDb) {
    throw new NotFoundError('Rol');
  }

  // Hash de la contraseña
  const password_hash = await bcrypt.hash(password, 10);

  // Crear usuario
  const usuario = await prisma.usuarios.create({
    data: {
      dni: dni || `TEMP-${Date.now()}`, // DNI temporal si no se proporciona
      nombres,
      apellidos,
      email: email.toLowerCase(),
      telefono: telefono ?? null,
      password_hash,
      rol_id: rolDb.id,
      activo: true
    }
  });

  // Si es docente, crear registro de docente
  if (rolDb.nombre.toLowerCase() === 'docente') {
    await prisma.docentes.create({
      data: {
        usuario_id: usuario.id,
        area_id: null,
        codigo_docente: null,
        fecha_ingreso: new Date()
      }
    });
  }

  const response = ResponseFormatter.created(
    {
      id: usuario.id,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.email,
      rol: rolDb.nombre
    },
    'Usuario creado exitosamente'
  );

  res.status(201).json(response);
});

// ========================================
// OBTENER PERFIL
// ========================================
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.usuario) {
    throw new AuthenticationError('Usuario no autenticado');
  }

  // Buscar el usuario completo con sus datos
  const usuario = await prisma.usuarios.findUnique({
    where: { id: req.usuario.id },
    include: {
      roles: true,
      docentes: {
        include: {
          areas: true
        }
      }
    }
  });

  if (!usuario) {
    throw new NotFoundError('Usuario');
  }

  // Formatear respuesta
  const userData = {
    id: usuario.id,
    dni: usuario.dni,
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    email: usuario.email,
    telefono: usuario.telefono,
    rol: usuario.roles,
    activo: usuario.activo,
    ultimo_acceso: usuario.ultimo_acceso,
    ...(usuario.docentes && usuario.docentes.length > 0 && usuario.docentes[0] && {
      docentes: {
        id: usuario.docentes[0].id,
        codigo_docente: usuario.docentes[0].codigo_docente,
        areas: usuario.docentes[0].areas?.nombre || null,
        fecha_ingreso: usuario.docentes[0].fecha_ingreso,
        horario_entrada: usuario.docentes[0].horario_entrada,
        horario_salida: usuario.docentes[0].horario_salida
      }
    })
  };

  const response = ResponseFormatter.success(
    userData,
    'Perfil obtenido correctamente'
  );

  res.status(200).json(response);
});

// ========================================
// LOGOUT
// ========================================
export const logout = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const usuario_id = req.usuario?.id;

  if (usuario_id) {
    // Revocar todos los refresh tokens del usuario
    await refreshTokenService.revokeAllUserTokens(usuario_id);
    console.log('🔒 Tokens revocados para usuarios:', usuario_id);
  }

  // Limpiar cookie de refresh token
  res.clearCookie('refreshToken');

  const response = ResponseFormatter.success(
    null,
    'Logout exitoso'
  );
  
  res.status(200).json(response);
});

// ========================================
// ACTUALIZAR PERFIL
// ========================================
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const dto = req.body as UpdateProfileDTO;
  const usuario_id = req.usuario?.id;

  if (!usuario_id) {
    throw new AuthenticationError('Usuario no autenticado');
  }

  // Actualizar datos del usuario
  const updateData: any = {};
  if (dto.nombres) updateData.nombres = dto.nombres;
  if (dto.apellidos) updateData.apellidos = dto.apellidos;
  if (dto.telefono) updateData.telefono = dto.telefono;

  const usuarioActualizado = await prisma.usuarios.update({
    where: { id: usuario_id },
    data: updateData,
    select: {
      id: true,
      email: true,
      nombres: true,
      apellidos: true,
      telefono: true,
      dni: true,
      roles: {
        select: {
          id: true,
          nombre: true
        }
      }
    }
  });

  const response = ResponseFormatter.success(
    usuarioActualizado,
    'Perfil actualizado exitosamente'
  );
  
  res.status(200).json(response);
});

// ========================================
// CAMBIAR CONTRASEÑA
// ========================================
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const dto = req.body as ChangePasswordDTO;
  const usuario_id = req.usuario?.id;

  if (!usuario_id) {
    throw new AuthenticationError('Usuario no autenticado');
  }

  // Obtener usuario con contraseña
  const usuario = await prisma.usuarios.findUnique({
    where: { id: usuario_id },
    select: {
      id: true,
      password_hash: true
    }
  });

  if (!usuario) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // Verificar contraseña actual
  const isValidPassword = await bcrypt.compare(dto.currentPassword, usuario.password_hash);
  if (!isValidPassword) {
    throw new AuthenticationError('Contraseña actual incorrecta');
  }

  // Hash nueva contraseña
  const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

  // Actualizar contraseña
  await prisma.usuarios.update({
    where: { id: usuario_id },
    data: {
      password_hash: hashedPassword
    }
  });

  const response = ResponseFormatter.success(
    null,
    'Contraseña actualizada exitosamente'
  );
  
  res.status(200).json(response);
});


import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/database';
import { verifyToken } from '../utils/auth';
import { calcularDistancia } from '../utils/gps.utils';

// Extender la interfaz Request para incluir el usuario
declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id: string;
        email: string;
        roles: string;
        rol_id: number;
        isDocente: boolean;
        docenteId?: string;
      };
    }
  }
}

/**
 * Middleware para verificar autenticación
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
      return;
    }

    // Verificar el token
    const decoded = verifyToken(token);
    
    // Verificar que el usuario existe y está activo
    const usuario = await prisma.usuarios.findUnique({
      where: { id: decoded.userId },
      include: {
        roles: true,
        docentes: true
      }
    });

    if (!usuario || !usuario.activo) {
      res.status(401).json({
        success: false,
        message: 'Usuario no válido o inactivo'
      });
      return;
    }

    // Agregar información del usuario a la request
    const docenteArray = Array.isArray(usuario.docentes) ? usuario.docentes: [];
    const docenteRecord = docenteArray.length > 0 ? docenteArray[0] : null;
    
    const usuarioData: typeof req.usuario = {
      id: usuario.id,
      email: usuario.email,
      roles: usuario.roles.nombre,
      rol_id: usuario.rol_id,
      isDocente: !!docenteRecord
    };
    
    if (docenteRecord?.id) {
      usuarioData.docenteId = docenteRecord.id;
    }
    
    req.usuario = usuarioData;

    console.log('✅ Usuario autenticado:', req.usuario);

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

/**
 * Middleware para requerir rol específico (case-insensitive)
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    const userRole = req.usuario.roles.toLowerCase();
    const requiredRoles = roles.map(r => r.toLowerCase());

    if (!requiredRoles.includes(userRole)) {
      console.log(`❌ Acceso denegado - Rol requerido: ${roles.join(', ')} | Rol usuarios: ${req.usuario.roles}`);
      res.status(403).json({
        success: false,
        message: 'Acceso denegado'
      });
      return;
    }

    console.log(`✅ Acceso permitido - roles: ${req.usuario.roles}`);
    next();
  };
};

/**
 * Middleware para requerir que el usuario sea admin
 */
export const requireAdmin = requireRole(['administrador']);

/**
 * Middleware para requerir que el usuario sea docente
 */
export const requireDocente = requireRole(['docente']);

/**
 * Middleware para requerir que el usuario sea admin o supervisor
 */
export const requireAdminOrSupervisor = requireRole(['administrador', 'supervisor']);

/**
 * Middleware para verificar que el usuario accede solo a sus propios datos o es admin
 */
export const requireSelfOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.usuario) {
    res.status(401).json({
      success: false,
      message: 'Usuario no autenticado'
    });
    return;
  }

  const { id } = req.params;
  
  if (req.usuario.roles === 'admin' || req.usuario.id === id) {
    next();
    return;
  }

  res.status(403).json({
    success: false,
    message: 'Acceso denegado'
  });
};

/**
 * Middleware para validar ubicación GPS
 */
export const requireValidLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { latitud, longitud } = req.body;

    if (!latitud || !longitud) {
      res.status(400).json({
        success: false,
        message: 'Coordenadas GPS requeridas'
      });
      return;
    }

    // Obtener ubicaciones permitidas
    const ubicacionesPermitidas = await prisma.ubicaciones_permitidas.findMany({
      where: { activo: true }
    });

    let ubicacionValida = false;

    for (const ubicacion of ubicacionesPermitidas) {
      const distancia = calcularDistancia(
        parseFloat(latitud),
        parseFloat(longitud),
        parseFloat(ubicacion.latitud.toString()),
        parseFloat(ubicacion.longitud.toString())
      );

      if (distancia <= (ubicacion.radio_metros ?? 50)) {
        ubicacionValida = true;
        break;
      }
    }

    if (!ubicacionValida) {
      res.status(400).json({
        success: false,
        message: 'No se encuentra en una ubicación válida para registrar asistencia'
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al validar ubicación'
    });
  }
};

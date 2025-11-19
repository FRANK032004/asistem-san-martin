import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/database';
import { 
  parsePaginationParams, 
  getPrismaSkipTake, 
  createPaginatedResponse 
} from '../utils/pagination.helper';
import { ResponseFormatter } from '../utils/response-formatter';

export const getUsuarios = async (req: Request, res: Response): Promise<void> => {
  try {
    // 📊 Parsear parámetros de paginación con validación
    const paginationParams = parsePaginationParams(
      req.query.page as string,
      req.query.limit as string
    );
    
    // 🔍 Parámetros de búsqueda y filtros
    const search = req.query.search as string || '';
    const rol_id = req.query.rol_id as string;
    const activo = req.query.activo as string;
    
    // Construir condiciones WHERE dinámicas
    const whereCondition: any = {};
    
    // Filtro de búsqueda
    if (search) {
      whereCondition.OR = [
        { nombres: { contains: search, mode: 'insensitive' as const } },
        { apellidos: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { dni: { contains: search, mode: 'insensitive' as const } }
      ];
    }
    
    // Filtro por rol
    if (rol_id) {
      whereCondition.rol_id = parseInt(rol_id);
    }
    
    // Filtro por estado activo
    if (activo !== undefined) {
      whereCondition.activo = activo === 'true';
    }
    
    // ⚡ Calcular skip y take
    const { skip, take } = getPrismaSkipTake(paginationParams);
    
    // 📊 Ejecutar queries en paralelo
    const [usuarios, total] = await Promise.all([
      prisma.usuarios.findMany({
        where: whereCondition,
        select: {
          id: true,
          nombres: true,
          apellidos: true,
          email: true,
          dni: true,
          telefono: true,
          activo: true,
          roles: {
            select: {
              id: true,
              nombre: true
            }
          }
        },
        skip,
        take,
        orderBy: { nombres: 'asc' }
      }),
      prisma.usuarios.count({ where: whereCondition })
    ]);
    
    // 📦 Crear respuesta paginada
    const paginatedResponse = createPaginatedResponse(
      usuarios,
      total,
      paginationParams
    );
    
    // ✅ Enviar respuesta formateada
    const response = ResponseFormatter.success(
      paginatedResponse,
      'Usuarios obtenidos exitosamente'
    );
    
    res.json(response);
  } catch (error) {
    console.error('Error en getUsuarios:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getUsuarioById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({ error: 'ID de usuario requerido' });
      return;
    }
    
    const usuario = await prisma.usuarios.findUnique({
      where: { id },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        email: true,
        dni: true,
        telefono: true,
        activo: true,
        roles: {
          select: {
            nombre: true
          }
        }
      }
    });
    
    if (!usuario) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    
    res.json(usuario);
  } catch (error) {
    console.error('Error en getUsuarioById:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const toggleUsuarioEstado = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const usuarioSesion = req.usuario; // Usuario autenticado desde middleware
    
    if (!id) {
      res.status(400).json({ error: 'ID de usuario requerido' });
      return;
    }

    // 🚫 VALIDACIÓN 1: No puede desactivarse a sí mismo
    if (usuarioSesion && id === usuarioSesion.id) {
      res.status(403).json({ 
        error: 'Por razones de seguridad, no puede desactivar su propia cuenta. Por favor, solicite a otro administrador que realice esta acción.' 
      });
      return;
    }
    
    const usuarioActual = await prisma.usuarios.findUnique({
      where: { id },
      select: { 
        activo: true,
        roles: {
          select: {
            nombre: true
          }
        }
      }
    });
    
    if (!usuarioActual) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // 🚫 VALIDACIÓN 2: No desactivar al último admin activo
    if (usuarioActual.roles.nombre === 'ADMIN' && usuarioActual.activo) {
      const adminActivos = await prisma.usuarios.count({
        where: {
          roles: { nombre: 'ADMIN' },
          activo: true
        }
      });

      if (adminActivos <= 1) {
        res.status(403).json({ 
          error: 'No es posible desactivar al último administrador activo. El sistema requiere al menos un administrador activo para su gestión.' 
        });
        return;
      }
    }
    
    const usuario = await prisma.usuarios.update({
      where: { id },
      data: { activo: !usuarioActual.activo },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        email: true,
        dni: true,
        telefono: true,
        activo: true,
        roles: {
          select: {
            nombre: true
          }
        }
      }
    });
    
    // 🔐 Respuesta con información de sesión
    const fueDesactivado = usuarioActual.activo && !usuario.activo;
    
    res.json({
      ...usuario,
      requireLogout: fueDesactivado, // Requiere logout si fue desactivado
      reason: fueDesactivado ? 'ACCOUNT_DEACTIVATED' : undefined
    });
  } catch (error) {
    console.error('Error en toggleUsuarioEstado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombres, apellidos, email, dni, telefono, rol, password } = req.body;
    
    if (!nombres || !apellidos || !email || !dni || !rol || !password) {
      res.status(400).json({ error: 'Faltan campos obligatorios' });
      return;
    }
    
    // � NORMALIZAR: Convertir email a minúsculas para consistencia
    const emailNormalizado = email.toLowerCase().trim();
    
    // �🛡️ VALIDACIÓN: Email único
    const emailExistente = await prisma.usuarios.findUnique({
      where: { email: emailNormalizado }
    });
    
    if (emailExistente) {
      res.status(409).json({ 
        error: 'El correo electrónico ya está en uso',
        message: `El email ${emailNormalizado} ya está registrado en el sistema`
      });
      return;
    }

    // 🛡️ VALIDACIÓN: DNI único
    const dniExistente = await prisma.usuarios.findUnique({
      where: { dni }
    });
    
    if (dniExistente) {
      res.status(409).json({ 
        error: 'El DNI ya está en uso',
        message: `El DNI ${dni} ya está registrado en el sistema`
      });
      return;
    }

    // Buscar el rol por nombre
    const rolEncontrado = await prisma.roles.findUnique({
      where: { nombre: rol }
    });

    if (!rolEncontrado) {
      res.status(400).json({ error: 'Rol no válido' });
      return;
    }

    // Hashear la contraseña
    const password_hash = await bcrypt.hash(password, 10);
    
    const usuario = await prisma.usuarios.create({
      data: {
        nombres,
        apellidos,
        email: emailNormalizado, // 🔧 Usar email normalizado
        dni,
        telefono,
        password_hash,
        activo: true,
        roles: {
          connect: { id: rolEncontrado.id }
        }
      },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        email: true,
        dni: true,
        telefono: true,
        activo: true,
        roles: {
          select: {
            nombre: true
          }
        }
      }
    });
    
    res.status(201).json(usuario);
  } catch (error) {
    console.error('Error en createUsuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nombres, apellidos, email, dni, telefono, rol, activo, password, updated_at: clientUpdatedAt } = req.body;
    const usuarioSesion = req.usuario; // Usuario autenticado desde middleware
    
    if (!id) {
      res.status(400).json({ error: 'ID de usuario requerido' });
      return;
    }

    // Obtener usuario actual
    const usuarioActual = await prisma.usuarios.findUnique({
      where: { id },
      include: { roles: true }
    });

    if (!usuarioActual) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // 🔒 VERSIONADO OPTIMISTA: Verificar si el usuario fue modificado por otro admin
    if (clientUpdatedAt && usuarioActual.updated_at) {
      const clientDate = new Date(clientUpdatedAt);
      const serverDate = new Date(usuarioActual.updated_at);
      
      // Comparar timestamps (con margen de 1 segundo para diferencias de precisión)
      if (serverDate.getTime() - clientDate.getTime() > 1000) {
        res.status(409).json({ 
          error: 'Conflicto de versión',
          message: 'Este usuario fue modificado por otro administrador mientras lo editabas. Por favor, recarga los datos y vuelve a intentarlo.',
          code: 'VERSION_CONFLICT'
        });
        return;
      }
    }

    // 🔐 Detectar si el usuario está editando su propio perfil
    const esUsuarioPropio = usuarioSesion && usuarioSesion.id === id;
    
    // � NORMALIZAR: Convertir email a minúsculas si se proporciona
    const emailNormalizado = email ? email.toLowerCase().trim() : undefined;
    
    // �🔐 Detectar si se cambió el email del usuario en sesión
    const cambioEmailPropio = esUsuarioPropio && emailNormalizado && emailNormalizado !== usuarioActual.email;
    
    // 🔐 Detectar si se desactivó al usuario
    const fueDesactivado = activo === false && usuarioActual.activo;
    
    // 🔐 Detectar si se cambió el rol del usuario
    const cambioRol = rol && rol !== usuarioActual.roles.nombre;

    // 🛡️ VALIDACIÓN: Email único (si se está cambiando)
    if (emailNormalizado && emailNormalizado !== usuarioActual.email) {
      const emailExistente = await prisma.usuarios.findUnique({
        where: { email: emailNormalizado }
      });

      if (emailExistente) {
        res.status(409).json({ 
          error: 'El correo electrónico ya está en uso',
          message: `El email ${emailNormalizado} ya está registrado por otro usuario`
        });
        return;
      }
    }

    // 🛡️ VALIDACIÓN: DNI único (si se está cambiando)
    if (dni && dni !== usuarioActual.dni) {
      const dniExistente = await prisma.usuarios.findUnique({
        where: { dni }
      });

      if (dniExistente) {
        res.status(409).json({ 
          error: 'El DNI ya está en uso',
          message: `El DNI ${dni} ya está registrado por otro usuario`
        });
        return;
      }
    }

    // 🛡️ VALIDACIÓN 1: Si se está cambiando el rol o desactivando
    if ((rol && rol !== usuarioActual.roles.nombre) || (activo === false && usuarioActual.activo)) {
      // Verificar cuántos admins activos hay
      const adminsActivos = await prisma.usuarios.count({
        where: {
          activo: true,
          roles: {
            nombre: 'ADMIN'
          }
        }
      });

      // Si este es admin y es el último, no permitir el cambio
      if (usuarioActual.roles.nombre === 'ADMIN' && adminsActivos === 1) {
        if (rol === 'DOCENTE') {
          res.status(403).json({ 
            error: 'No se puede cambiar el rol del último administrador activo',
            message: 'Debe haber al menos un administrador en el sistema'
          });
          return;
        }
        if (activo === false) {
          res.status(403).json({ 
            error: 'No se puede desactivar al último administrador',
            message: 'Debe haber al menos un administrador activo en el sistema'
          });
          return;
        }
      }
    }

    // Preparar datos para actualizar
    const updateData: any = {};

    if (nombres) updateData.nombres = nombres;
    if (apellidos) updateData.apellidos = apellidos;
    if (emailNormalizado) updateData.email = emailNormalizado; // 🔧 Usar email normalizado
    if (dni) updateData.dni = dni;
    if (telefono !== undefined) updateData.telefono = telefono;
    if (activo !== undefined) updateData.activo = activo;

    // 🔄 GESTIÓN PROFESIONAL DE CAMBIO DE ROL
    if (rol && rol !== usuarioActual.roles.nombre) {
      const rolEncontrado = await prisma.roles.findUnique({
        where: { nombre: rol }
      });

      if (!rolEncontrado) {
        res.status(400).json({ error: 'Rol no válido' });
        return;
      }

      updateData.Role = { connect: { id: rolEncontrado.id } };

      // 📋 LÓGICA: Gestionar registro de docente según cambio de rol
      const registroDocente = await prisma.docentes.findFirst({
        where: { usuario_id: id }
      });

      // CASO 1: DOCENTE → ADMIN (Desactivar registro de docente)
      if (usuarioActual.roles.nombre === 'DOCENTE' && rol === 'ADMIN') {
        if (registroDocente) {
          await prisma.docentes.update({
            where: { id: registroDocente.id },
            data: { estado: 'inactivo' }
          });
          console.log(`📝 Registro de docente desactivado para usuario ${usuarioActual.email} (cambio a ADMIN)`);
        }
      }

      // CASO 2: ADMIN → DOCENTE (Reactivar o crear registro de docente)
      if (usuarioActual.roles.nombre === 'ADMIN' && rol === 'DOCENTE') {
        if (registroDocente) {
          // Reactivar registro existente
          await prisma.docentes.update({
            where: { id: registroDocente.id },
            data: { estado: 'activo' }
          });
          console.log(`📝 Registro de docente reactivado para usuario ${usuarioActual.email}`);
        } else {
          // Crear nuevo registro de docente si no existe
          await prisma.docentes.create({
            data: {
              usuario_id: id,
              codigo_docente: `DOC-${usuarioActual.dni}`,
              estado: 'activo',
              fecha_ingreso: new Date()
            }
          });
          console.log(`📝 Registro de docente creado para usuario ${usuarioActual.email}`);
        }
      }
    }

    // Si se proporciona una nueva contraseña, hashearla
    if (password) {
      const bcrypt = require('bcrypt');
      updateData.password_hash = await bcrypt.hash(password, 10);
    }
    
    const usuario = await prisma.usuarios.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        email: true,
        dni: true,
        telefono: true,
        activo: true,
        roles: {
          select: {
            id: true,
            nombre: true
          }
        },
        created_at: true,
        updated_at: true
      }
    });
    
    // 🔐 Respuesta con información de sesión
    res.json({
      ...usuario,
      requireLogout: cambioEmailPropio || fueDesactivado || cambioRol, // Requiere logout si cambió email, fue desactivado o cambió de rol
      reason: cambioEmailPropio 
        ? 'EMAIL_CHANGED' 
        : fueDesactivado 
        ? 'ACCOUNT_DEACTIVATED'
        : cambioRol
        ? 'ROLE_CHANGED'
        : undefined
    });
  } catch (error) {
    console.error('Error en updateUsuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const usuarioSesion = req.usuario; // Usuario autenticado desde middleware
    
    if (!id) {
      res.status(400).json({ error: 'ID de usuario requerido' });
      return;
    }

    // 🚫 VALIDACIÓN 1: No puede eliminarse a sí mismo
    if (usuarioSesion && id === usuarioSesion.id) {
      res.status(403).json({ 
        error: 'Por razones de seguridad, no puede eliminar su propia cuenta. Por favor, solicite a otro administrador que realice esta acción.' 
      });
      return;
    }

    // 🚫 VALIDACIÓN 2: No eliminar al último admin
    const usuarioAEliminar = await prisma.usuarios.findUnique({
      where: { id },
      select: {
        roles: {
          select: { nombre: true }
        }
      }
    });

    if (!usuarioAEliminar) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    if (usuarioAEliminar.roles.nombre === 'ADMIN') {
      const adminActivos = await prisma.usuarios.count({
        where: {
          roles: { nombre: 'ADMIN' },
          activo: true
        }
      });

      if (adminActivos <= 1) {
        res.status(403).json({ 
          error: 'No es posible eliminar al último administrador del sistema. El sistema requiere al menos un administrador para su gestión.' 
        });
        return;
      }
    }
    
    await prisma.usuarios.delete({
      where: { id }
    });
    
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error en deleteUsuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const toggleUsuarioStatus = toggleUsuarioEstado;


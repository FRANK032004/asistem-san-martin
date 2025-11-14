/**
 * @module GestionDocentesController
 * @description Controller para gestión administrativa de docentes
 * 
 * Responsabilidades:
 * - CRUD completo de docentes (Solo Admin)
 * - Consulta de asistencias de docentes
 * - Estadísticas de docentes
 * 
 * Separado del módulo docente para cumplir SRP (Single Responsibility Principle)
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../../../shared/utils/database';
import { asyncHandler } from '../../../shared/middleware/error-handler';
import { ResponseFormatter } from '../../../shared/utils/response-formatter';
import { NotFoundError, ValidationError, ConflictError } from '../../../shared/utils/app-error';
import { 
  parsePaginationParams, 
  getPrismaSkipTake, 
  createPaginatedResponse 
} from '../../../utils/pagination.helper';

// ========================================
// LISTAR TODOS LOS DOCENTES (CON PAGINACIÓN)
// ========================================
export const getDocentes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔍 [getDocentes] Iniciando petición...');
    
    // 📊 Extraer parámetros de paginación
    const paginationParams = parsePaginationParams(
      req.query.page as string,
      req.query.limit as string
    );
    
    console.log('📊 Parámetros:', { page: paginationParams.page, limit: paginationParams.limit });

    // 📝 Extraer parámetros de búsqueda/filtro (opcional)
    const search = req.query.search as string | undefined;
    const area_id = req.query.area_id as string | undefined;
    const estado = req.query.estado as string | undefined;

    // 🔍 Construir condiciones de filtro
    const whereConditions: any = {};

    // Filtro por búsqueda (nombres, apellidos, DNI, email)
    if (search) {
      whereConditions.usuario = {
        OR: [
          { nombres: { contains: search, mode: 'insensitive' } },
          { apellidos: { contains: search, mode: 'insensitive' } },
          { dni: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    // Filtro por área
    if (area_id) {
      whereConditions.area_id = parseInt(area_id); // Convertir a número
    }

    // Filtro por estado (activo/inactivo)
    if (estado) {
      whereConditions.estado = estado;
    }

    // ⚡ Calcular skip y take para Prisma
    const { skip, take } = getPrismaSkipTake(paginationParams);
    
    console.log('📊 Skip:', skip, 'Take:', take);
    console.log('� Where:', JSON.stringify(whereConditions, null, 2));

    // 📊 Ejecutar queries en paralelo para optimizar
    console.log('⏳ Ejecutando query a base de datos...');
    
    const [docentes, totalCount] = await Promise.all([
      // Query paginada
      prisma.docentes.findMany({
        where: whereConditions,
        skip,
        take,
        include: {
          usuarios: {
            select: {
              dni: true,
              nombres: true,
              apellidos: true,
              email: true,
              telefono: true,
              activo: true
            }
          },
          areas: {
            select: {
              id: true,
              nombre: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      }),
      // Count total para metadata
      prisma.docentes.count({
        where: whereConditions
      })
    ]);
    
    console.log('✅ Query exitosa!');
    console.log(`📊 Encontrados: ${docentes.length} docentes de ${totalCount} total`);

    // 📦 Crear respuesta paginada
    const paginatedResponse = createPaginatedResponse(
      docentes,
      totalCount,
      paginationParams
    );

    // ✅ Enviar respuesta
    const response = ResponseFormatter.success(
      paginatedResponse,
      'Docentes obtenidos exitosamente'
    );

    console.log('✅ Enviando respuesta al cliente');
    res.status(200).json(response);
    
  } catch (error: any) {
    console.error('❌❌❌ ERROR EN getDocentes ❌❌❌');
    console.error('Tipo de error:', error.constructor.name);
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    
    // Re-lanzar el error para que lo maneje el error handler global
    throw error;
  }
});

// ========================================
// OBTENER DOCENTE POR ID
// ========================================
export const getDocenteById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    throw new ValidationError('ID de docente requerido');
  }

  const docente = await prisma.docentes.findUnique({
    where: { id },
    include: {
      usuarios: {
        select: {
          dni: true,
          nombres: true,
          apellidos: true,
          email: true,
          telefono: true,
          activo: true
        }
      },
      areas: {
        select: {
          id: true,
          nombre: true
        }
      }
    }
  });

  if (!docente) {
    throw new NotFoundError('Docente');
  }

  const response = ResponseFormatter.success(
    docente,
    'Docente obtenido exitosamente'
  );

  res.status(200).json(response);
});

// ========================================
// CREAR NUEVO DOCENTE
// ========================================
export const createDocente = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Datos de docente inválidos', errors.array());
  }

  const {
    dni,
    nombres,
    apellidos,
    email,
    telefono,
    password,
    area_id,
    codigo_docente,
    fecha_ingreso,
    horario_entrada,
    horario_salida,
    sueldo,
    observaciones
  } = req.body;

  // Verificar si el usuario ya existe
  const existingUser = await prisma.usuarios.findFirst({
    where: {
      OR: [
        { email: email.toLowerCase() },
        { dni }
      ]
    }
  });

  if (existingUser) {
    throw new ConflictError('El usuario ya existe');
  }

  // Buscar rol de docente
  const rolDocente = await prisma.roles.findUnique({
    where: { nombre: 'docente' }
  });

  if (!rolDocente) {
    throw new NotFoundError('Rol de docente');
  }

  const result = await prisma.$transaction(async (tx) => {
    // Crear usuario
    const usuario = await tx.usuarios.create({
      data: {
        dni,
        nombres,
        apellidos,
        email: email.toLowerCase(),
        telefono: telefono || null,
        password_hash: password, // Debería estar hasheada
        rol_id: rolDocente.id,
        activo: true
      }
    });

    // Crear docente
    const docente = await tx.docentes.create({
      data: {
        usuario_id: usuario.id,
        area_id: area_id || null,
        codigo_docente: codigo_docente || null,
        fecha_ingreso: fecha_ingreso ? new Date(fecha_ingreso) : new Date(),
        horario_entrada: horario_entrada || new Date('1970-01-01T07:30:00'),
        horario_salida: horario_salida || new Date('1970-01-01T17:30:00'),
        sueldo: sueldo || null,
        observaciones: observaciones || null
      },
      include: {
        usuarios: {
          select: {
            dni: true,
            nombres: true,
            apellidos: true,
            email: true,
            telefono: true,
            activo: true
          }
        },
        areas: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    return docente;
  });

  const response = ResponseFormatter.created(
    result,
    'Docente creado exitosamente'
  );

  res.status(201).json(response);
});

// ========================================
// ACTUALIZAR DOCENTE
// ========================================
export const updateDocente = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const errors = validationResult(req);

  if (!id) {
    throw new ValidationError('ID de docente requerido');
  }

  if (!errors.isEmpty()) {
    throw new ValidationError('Datos de actualización inválidos', errors.array());
  }

  // Verificar que el docente existe
  const existingDocente = await prisma.docentes.findUnique({
    where: { id }
  });

  if (!existingDocente) {
    throw new NotFoundError('Docente');
  }

  const updateData = req.body;

  // Actualizar docente
  const docente = await prisma.docentes.update({
    where: { id },
    data: {
      area_id: updateData.area_id || existingDocente.area_id,
      codigo_docente: updateData.codigo_docente || existingDocente.codigo_docente,
      fecha_ingreso: updateData.fecha_ingreso ? new Date(updateData.fecha_ingreso) : existingDocente.fecha_ingreso,
      horario_entrada: updateData.horario_entrada ? new Date(updateData.horario_entrada) : existingDocente.horario_entrada,
      horario_salida: updateData.horario_salida ? new Date(updateData.horario_salida) : existingDocente.horario_salida,
      sueldo: updateData.sueldo !== undefined ? updateData.sueldo : existingDocente.sueldo,
      observaciones: updateData.observaciones !== undefined ? updateData.observaciones : existingDocente.observaciones
    },
    include: {
      usuarios: {
        select: {
          dni: true,
          nombres: true,
          apellidos: true,
          email: true,
          telefono: true,
          activo: true
        }
      },
      areas: {
        select: {
          id: true,
          nombre: true
        }
      }
    }
  });

  const response = ResponseFormatter.updated(
    docente,
    'Docente actualizado exitosamente'
  );

  res.status(200).json(response);
});

// ========================================
// ELIMINAR DOCENTE
// ========================================
export const deleteDocente = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    throw new ValidationError('ID de docente requerido');
  }

  const docente = await prisma.docentes.findUnique({
    where: { id }
  });

  if (!docente) {
    throw new NotFoundError('Docente');
  }

  // Eliminar docente (esto también debería desactivar el usuario)
  await prisma.docentes.delete({
    where: { id }
  });

  const response = ResponseFormatter.deleted(
    'Docente eliminado exitosamente'
  );

  res.status(200).json(response);
});

// ========================================
// OBTENER ASISTENCIAS DE UN DOCENTE
// ========================================
export const getDocenteAsistencias = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { fecha_inicio, fecha_fin } = req.query;

  if (!id) {
    throw new ValidationError('ID de docente requerido');
  }

  // Verificar que el docente existe
  const docente = await prisma.docentes.findUnique({
    where: { id }
  });

  if (!docente) {
    throw new NotFoundError('Docente');
  }

  const filtros: any = {
    docenteId: id
  };

  if (fecha_inicio && fecha_fin) {
    filtros.fecha = {
      gte: new Date(fecha_inicio as string),
      lte: new Date(fecha_fin as string)
    };
  }

  const asistencias = await prisma.asistencias.findMany({
    where: filtros,
    include: {
      ubicacionEntrada: {
        select: {
          nombre: true
        }
      },
      ubicacionSalida: {
        select: {
          nombre: true
        }
      }
    },
    orderBy: {
      fecha: 'desc'
    }
  });

  const response = ResponseFormatter.success(
    asistencias,
    'Asistencias obtenidas exitosamente'
  );

  res.status(200).json(response);
});

// ========================================
// OBTENER ESTADÍSTICAS DEL DOCENTE
// ========================================
export const getEstadisticasDocente = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { docenteId } = req.params;

  if (!docenteId) {
    throw new ValidationError('ID del docente es requerido');
  }

  // Verificar que el docente existe
  const docente = await prisma.docentes.findUnique({
    where: { id: docenteId },
    include: {
      usuarios: {
        select: {
          nombres: true,
          apellidos: true
        }
      }
    }
  });

  if (!docente) {
    throw new NotFoundError('Docente');
  }

  // Obtener fechas del mes actual
  const now = new Date();
  const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1);
  const ultimoDiaMes = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Contar asistencias del mes
  const asistenciasEsteMes = await prisma.asistencias.count({
    where: {
      docenteId: docenteId,
      fecha: {
        gte: primerDiaMes,
        lte: ultimoDiaMes
      },
      estado: {
        in: ['PRESENTE', 'TARDANZA']
      }
    }
  });

  // Calcular días laborales del mes (excluyendo sábados y domingos)
  let totalDiasLaborales = 0;
  const fechaActual = new Date(primerDiaMes);
  
  while (fechaActual <= ultimoDiaMes) {
    const dia_semana = fechaActual.getDay();
    if (dia_semana !== 0 && dia_semana !== 6) { // No domingo (0) ni sábado (6)
      totalDiasLaborales++;
    }
    fechaActual.setDate(fechaActual.getDate() + 1);
  }

  // Calcular puntualidad (asistencias a tiempo vs total asistencias)
  const asistenciasPuntuales = await prisma.asistencias.count({
    where: {
      docenteId: docenteId,
      fecha: {
        gte: primerDiaMes,
        lte: ultimoDiaMes
      },
      estado: 'PRESENTE'
    }
  });

  const puntualidad = asistenciasEsteMes > 0 
    ? Math.round((asistenciasPuntuales / asistenciasEsteMes) * 100)
    : 0;

  // Calcular horas laboradas del mes
  const asistenciasConHoras = await prisma.asistencias.findMany({
    where: {
      docenteId: docenteId,
      fecha: {
        gte: primerDiaMes,
        lte: ultimoDiaMes
      },
      horaEntrada: { not: null },
      horaSalida: { not: null }
    },
    select: {
      horaEntrada: true,
      horaSalida: true
    }
  });

  let horasLaboradas = 0;
  asistenciasConHoras.forEach(asistencia => {
    if (asistencia.horaEntrada && asistencia.horaSalida) {
      const entrada = new Date(asistencia.horaEntrada);
      const salida = new Date(asistencia.horaSalida);
      const diferencia = salida.getTime() - entrada.getTime();
      horasLaboradas += diferencia / (1000 * 60 * 60); // Convertir a horas
    }
  });

  const estadisticas = {
    docentes: {
      id: docente.id,
      nombre: `${docente.usuarios.nombres} ${docente.usuarios.apellidos}`,
      codigo_docente: docente.codigo_docente
    },
    periodo: {
      inicio: primerDiaMes,
      fin: ultimoDiaMes
    },
    asistenciasEsteMes,
    totalDiasLaborales,
    puntualidad,
    horasLaboradas: Math.round(horasLaboradas),
    porcentajeAsistencia: totalDiasLaborales > 0 
      ? Math.round((asistenciasEsteMes / totalDiasLaborales) * 100)
      : 0
  };

  const response = ResponseFormatter.success(
    estadisticas,
    'Estadísticas del docente obtenidas exitosamente'
  );

  res.status(200).json(response);
});

// ========================================
// OBTENER ESTADO RESUMIDO DE TODOS LOS DOCENTES
// ========================================
export const getEstadoDocentes = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const docentes = await prisma.docentes.findMany({
    include: {
      usuarios: {
        select: {
          id: true,
          nombres: true,
          apellidos: true,
          email: true,
          activo: true
        }
      },
      areas: {
        select: {
          nombre: true
        }
      },
      asistencias: {
        where: {
          fecha: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)) // Solo hoy
          }
        },
        select: {
          estado: true,
          horaEntrada: true
        },
        take: 1
      }
    },
    where: {
      usuarios: {
        activo: true
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  });

  const estadoDocentes = docentes.map(docente => {
    const asistenciaHoy = docente.asistencias[0];
    let estado: 'presente' | 'ausente' | 'tarde' | 'sin_registrar' = 'sin_registrar';

    if (asistenciaHoy) {
      if (asistenciaHoy.estado === 'PRESENTE') {
        estado = 'presente';
      } else if (asistenciaHoy.estado === 'TARDE') {
        estado = 'tarde';
      } else if (asistenciaHoy.estado === 'AUSENTE') {
        estado = 'ausente';
      }
    }

    return {
      id: docente.id,
      nombre: `${docente.usuarios.nombres} ${docente.usuarios.apellidos}`,
      email: docente.usuarios.email,
      areas: docente.areas?.nombre || 'Sin área',
      estado,
      horaRegistro: asistenciaHoy?.horaEntrada || null,
      activo: docente.usuarios.activo
    };
  });

  const response = ResponseFormatter.success(
    estadoDocentes,
    'Estado de docentes obtenido exitosamente'
  );

  res.status(200).json(response);
});

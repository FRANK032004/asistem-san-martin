import { Request, Response } from 'express';
import prisma from '../utils/database';
import { asyncHandler } from '../middleware/error-handler';
import { ResponseFormatter } from '../utils/response-formatter';
import { NotFoundError, ValidationError, ConflictError } from '../utils/app-error';

type AuthRequest = Request & { 
  user?: { 
    id: string; 
    email: string; 
    rol: string; 
    rol_id: number; 
    isDocente: boolean; 
    docenteId?: string; 
  }; 
  usuario?: { 
    id: string; 
    email: string; 
    rol: string; 
    rol_id: number; 
    isDocente: boolean; 
    docenteId?: string; 
  }; 
};

/**
 * ?? FUNCIONES POSTGIS PARA GPS DE ALTA PRECISI?N
 * Utilizan c?lculos geoespaciales del servidor PostgreSQL
 * Precisi?n: hasta ?5 metros (vs ?17km sin PostGIS)
 */

/**
 * Validar si coordenadas est?n dentro de una ubicaci?n permitida
 * Usa: ST_DWithin() de PostGIS para c?lculo preciso en servidor
 * 
 * @deprecated - Usar encontrarUbicacionCercana() que incluye validaci?n
 */
/*
const validarUbicacionConPostGIS = async (
  latitud: number,
  longitud: number,
  ubicacionId: number
): Promise<boolean> => {
  try {
    const resultado = await prisma.$queryRaw<Array<{ validar_ubicacion_en_radio: boolean }>>`
      SELECT validar_ubicacion_en_radio(
        ${latitud}::DOUBLE PRECISION,
        ${longitud}::DOUBLE PRECISION,
        ${ubicacionId}::BIGINT
      ) as validar_ubicacion_en_radio
    `;
    return resultado[0]?.validar_ubicacion_en_radio || false;
  } catch (error) {
    console.error('? Error validando ubicaci?n con PostGIS:', error);
    return false;
  }
};
*/

/**
 * Encontrar la ubicaci?n permitida m?s cercana
 * Usa: ST_Distance() de PostGIS + ?ndice GiST para b?squeda r?pida
 */
const encontrarUbicacionCercana = async (
  latitud: number,
  longitud: number
): Promise<{
  id: bigint;
  nombre: string;
  distancia_metros: number;
  dentro_radio: boolean;
} | null> => {
  try {
    const resultado = await prisma.$queryRaw<Array<{
      id: bigint;
      nombre: string;
      distancia_metros: number;
      dentro_radio: boolean;
    }>>`
      SELECT * FROM encontrar_ubicacion_cercana(
        ${latitud}::DOUBLE PRECISION,
        ${longitud}::DOUBLE PRECISION
      )
    `;
    return resultado[0] || null;
  } catch (error) {
    console.error('? Error encontrando ubicaci?n cercana:', error);
    return null;
  }
};

/**
 * Calcular distancia exacta entre dos puntos GPS
 * Usa: ST_Distance() de PostGIS (precisi?n geod?sica)
 * 
 * @deprecated - Reservada para uso futuro (an?lisis de distancias)
 */
/*
const calcularDistanciaPostGIS = async (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): Promise<number> => {
  try {
    const resultado = await prisma.$queryRaw<Array<{ calcular_distancia: number }>>`
      SELECT calcular_distancia(
        ${lat1}::DOUBLE PRECISION,
        ${lng1}::DOUBLE PRECISION,
        ${lat2}::DOUBLE PRECISION,
        ${lng2}::DOUBLE PRECISION
      ) as calcular_distancia
    `;
    return resultado[0]?.calcular_distancia || 0;
  } catch (error) {
    console.error('? Error calculando distancia:', error);
    return 0;
  }
};
*/

/**
 * Registrar entrada de asistencia
 * ?? CON VALIDACI?N POSTGIS DE ALTA PRECISI?N
 */
export const registrarEntrada = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { latitud, longitud, deviceInfo } = req.body;
  const docenteId = req.usuario?.docenteId;

  if (!docenteId) {
    throw new ValidationError('Usuario no es un docente v?lido');
  }

  // 1. Verificar si ya registró entrada hoy
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const tomorrow = new Date(hoy);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const asistenciaExistente = await prisma.asistencias.findFirst({
    where: {
      docenteId,
      fecha: {
        gte: hoy,
        lt: tomorrow
      }
    }
  });

  if (asistenciaExistente) {
    throw new ConflictError('Ya se registr? la entrada para hoy');
  }

  // 2?? Validar ubicaci?n con PostGIS (alta precisi?n)
  const lat = parseFloat(latitud.toString());
  const lng = parseFloat(longitud.toString());

  const ubicacionCercana = await encontrarUbicacionCercana(lat, lng);

  if (!ubicacionCercana) {
    throw new ValidationError('No hay ubicaciones permitidas configuradas');
  }

  // 3?? Verificar si est? dentro del radio permitido
  if (!ubicacionCercana.dentro_radio) {
    const distanciaKm = (ubicacionCercana.distancia_metros / 1000).toFixed(2);
    throw new ValidationError(
      `Ubicaci?n fuera del ?rea permitida. ` +
      `Distancia a "${ubicacionCercana.nombre}": ${distanciaKm} km`
    );
  }

  // 4. Crear registro de asistencia
  const nuevaAsistencia = await prisma.asistencias.create({
    data: {
      docenteId,
      fecha: new Date(),
      horaEntrada: new Date(),
      latitudEntrada: lat,
      longitudEntrada: lng,
      ubicacionEntradaId: Number(ubicacionCercana.id),
      estado: 'presente',
      observaciones: deviceInfo ? 
        `${deviceInfo} | Ubicación: ${ubicacionCercana.nombre} (${Math.round(ubicacionCercana.distancia_metros)}m)` 
        : `Ubicación: ${ubicacionCercana.nombre} (${Math.round(ubicacionCercana.distancia_metros)}m)`
    }
  });

  const response = ResponseFormatter.created(
    {
      ...nuevaAsistencia,
      ubicacionInfo: {
        nombre: ubicacionCercana.nombre,
        distanciaMetros: Math.round(ubicacionCercana.distancia_metros)
      }
    },
    `Entrada registrada en ${ubicacionCercana.nombre}`
  );

  res.status(201).json(response);
});

/**
 * Registrar salida de asistencia
 * ?? CON VALIDACI?N POSTGIS DE ALTA PRECISI?N
 */
export const registrarSalida = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { latitud, longitud } = req.body;
  const docenteId = req.usuario?.docenteId;

  if (!docenteId) {
    throw new ValidationError('Usuario no es un docente v?lido');
  }

  // 1. Buscar asistencia de hoy sin salida
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const tomorrow = new Date(hoy);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const asistencia = await prisma.asistencias.findFirst({
    where: {
      docenteId,
      fecha: {
        gte: hoy,
        lt: tomorrow
      },
      horaSalida: null
    }
  });

  if (!asistencia) {
    throw new NotFoundError('Registro de entrada para hoy');
  }

  // 2?? Validar ubicaci?n de salida con PostGIS
  const lat = parseFloat(latitud.toString());
  const lng = parseFloat(longitud.toString());

  const ubicacionCercana = await encontrarUbicacionCercana(lat, lng);

  if (!ubicacionCercana) {
    throw new ValidationError('No hay ubicaciones permitidas configuradas');
  }

  // 3?? Verificar si est? dentro del radio permitido
  if (!ubicacionCercana.dentro_radio) {
    const distanciaKm = (ubicacionCercana.distancia_metros / 1000).toFixed(2);
    throw new ValidationError(
      `Ubicaci?n fuera del ?rea permitida. ` +
      `Distancia a "${ubicacionCercana.nombre}": ${distanciaKm} km`
    );
  }

  // 4. Actualizar con hora de salida
  const asistenciaActualizada = await prisma.asistencias.update({
    where: { id: asistencia.id },
    data: {
      horaSalida: new Date(),
      latitudSalida: lat,
      longitudSalida: lng,
      ubicacionSalidaId: Number(ubicacionCercana.id)
    }
  });

  const response = ResponseFormatter.updated(
    {
      ...asistenciaActualizada,
      ubicacionInfo: {
        nombre: ubicacionCercana.nombre,
        distanciaMetros: Math.round(ubicacionCercana.distancia_metros)
      }
    },
    `Salida registrada en ${ubicacionCercana.nombre}`
  );

  res.json(response);
});

/**
 * Obtener asistencias del d?a actual
 */
export const obtenerAsistenciasHoy = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const docenteId = req.usuario?.docenteId;
  const isAdmin = req.usuario?.rol === 'ADMIN' || req.usuario?.rol === 'admin';

  // Si no es docente ni admin, error
  if (!docenteId && !isAdmin) {
    throw new ValidationError('Usuario no tiene permisos para ver asistencias');
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const tomorrow = new Date(hoy);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let asistencias;

  if (isAdmin) {
    // Administradores ven todas las asistencias del d?a
    asistencias = await prisma.asistencias.findMany({
      where: {
        fecha: {
          gte: hoy,
          lt: tomorrow
        }
      },
      include: {
        docente: {
          select: {
            id: true,
            codigo_docente: true,
            usuarios: {
              select: {
                nombres: true,
                apellidos: true,
                email: true
              }
            },
            areas: {
              select: {
                nombre: true
              }
            }
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    });
  } else {
    // Docentes ven solo sus asistencias
    asistencias = await prisma.asistencias.findMany({
      where: {
        docenteId: docenteId!,
        fecha: {
          gte: hoy,
          lt: tomorrow
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    });
  }

  const response = ResponseFormatter.success(
    asistencias,
    'Asistencias obtenidas correctamente'
  );

  res.json(response);
});

/**
 * Generar reporte de asistencias
 */
export const generarReporte = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const docenteId = req.usuario?.docenteId;
  const { fecha_inicio, fecha_fin, page = 1, limit = 10 } = req.query;

  if (!docenteId) {
    throw new ValidationError('Usuario no es un docente v?lido');
  }

  const whereCondition: any = { docenteId };

  if (fecha_inicio || fecha_fin) {
    whereCondition.fecha = {};
    if (fecha_inicio) {
      whereCondition.fecha.gte = new Date(fecha_inicio as string);
    }
    if (fecha_fin) {
      whereCondition.fecha.lte = new Date(fecha_fin as string);
    }
  }

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [asistencias, total] = await Promise.all([
    prisma.asistencias.findMany({
      where: whereCondition,
      skip,
      take,
      orderBy: {
        fecha: 'desc'
      }
    }),
    prisma.asistencias.count({
      where: whereCondition
    })
  ]);

  const response = ResponseFormatter.paginated(
    asistencias,
    {
      page: Number(page),
      limit: Number(limit),
      total
    },
    'Reporte generado correctamente'
  );

  res.json(response);
});

/**
 * Validar ubicaci?n permitida
 * ?? CON POSTGIS - PRECISI?N DE ?5 METROS
 */
export const validarUbicacion = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { latitud, longitud } = req.body;

  // Validar que vengan las coordenadas
  if (!latitud || !longitud) {
    throw new ValidationError('Latitud y longitud son requeridas');
  }

  const lat = parseFloat(latitud);
  const lon = parseFloat(longitud);

  // Validar rango de coordenadas
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new ValidationError('Coordenadas fuera de rango v?lido');
  }

  // 1?? Obtener ubicaciones permitidas activas
  const ubicacionesPermitidas = await prisma.ubicaciones_permitidas.findMany({
    where: { activo: true }
  });

  if (ubicacionesPermitidas.length === 0) {
    const response = ResponseFormatter.success(
      { 
        valida: true, 
        mensaje: 'No hay restricciones de ubicaci?n configuradas',
        ubicacionCercana: null
      },
      'Sin restricciones'
    );
    res.json(response);
    return;
  }

  // 2?? Encontrar ubicaci?n m?s cercana con PostGIS
  const ubicacionCercana = await encontrarUbicacionCercana(lat, lon);

  if (!ubicacionCercana) {
    const response = ResponseFormatter.success(
      { 
        valida: false, 
        mensaje: 'No se pudo determinar la ubicaci?n cercana',
        ubicacionCercana: null
      },
      'Error de validaci?n'
    );
    res.json(response);
    return;
  }

  // 3?? Verificar si est? dentro del radio
  const dentroDeRadio = ubicacionCercana.dentro_radio;
  const distanciaMetros = Math.round(ubicacionCercana.distancia_metros);
  const distanciaKm = (ubicacionCercana.distancia_metros / 1000).toFixed(2);

  if (dentroDeRadio) {
    const response = ResponseFormatter.success(
      {
        valida: true,
        mensaje: `? Ubicaci?n v?lida - ${ubicacionCercana.nombre}`,
        distanciaMetros,
        distanciaKm: parseFloat(distanciaKm),
        ubicacionCercana: {
          id: Number(ubicacionCercana.id),
          nombre: ubicacionCercana.nombre
        }
      },
      'Ubicaci?n validada con PostGIS'
    );
    res.json(response);
  } else {
    const response = ResponseFormatter.success(
      {
        valida: false,
        mensaje: `? Fuera del ?rea permitida (${distanciaKm} km de "${ubicacionCercana.nombre}")`,
        distanciaMetros,
        distanciaKm: parseFloat(distanciaKm),
        ubicacionCercana: {
          id: Number(ubicacionCercana.id),
          nombre: ubicacionCercana.nombre
        }
      },
      'Ubicaci?n fuera de rango'
    );
    res.json(response);
  }
});

/**
 * Obtener estad?sticas del docente logueado
 */
export const getEstadisticasDocente = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const docenteId = req.usuario?.docenteId;

  if (!docenteId) {
    throw new ValidationError('Usuario no es un docente v?lido');
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

  // Calcular d?as laborales del mes (excluyendo s?bados y domingos)
  let totalDiasLaborales = 0;
  const fechaActual = new Date(primerDiaMes);
  
  while (fechaActual <= ultimoDiaMes && fechaActual <= now) {
    const dia_semana = fechaActual.getDay();
    if (dia_semana !== 0 && dia_semana !== 6) { // No domingo (0) ni s?bado (6)
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
    asistenciasEsteMes,
    totalDiasLaborales,
    puntualidad,
    horasLaboradas: Math.round(horasLaboradas)
  };

  const response = ResponseFormatter.success(
    estadisticas,
    'Estad?sticas obtenidas exitosamente'
  );

  res.status(200).json(response);
});

/**
 * Obtener todas las asistencias del docente logueado
 */
export const obtenerMisAsistencias = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const docenteId = req.usuario?.docenteId;

  if (!docenteId) {
    throw new ValidationError('Usuario no es un docente v?lido');
  }

  const asistencias = await prisma.asistencias.findMany({
    where: {
      docenteId
    },
    select: {
      id: true,
      fecha: true,
      horaEntrada: true,
      horaSalida: true,
      estado: true,
      ubicacionEntradaId: true,
      ubicacionSalidaId: true,
      observaciones: true,
      tardanzaMinutos: true,
      horasTrabajadas: true,
      justificaciones: {
        select: {
          id: true,
          estado: true,
          motivo: true,
          tipo: true
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



import { Request, Response } from 'express';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import prisma from '../utils/database';
import { asyncHandler } from '../middleware/error-handler';
import { ResponseFormatter } from '../utils/response-formatter';
import { NotFoundError, ValidationError, ConflictError } from '../utils/app-error';

export const obtenerEstadisticasAdmin = asyncHandler(async (_req: Request, res: Response) => {
  const hoy = new Date();
  const inicioHoy = startOfDay(hoy);
  const finHoy = endOfDay(hoy);

    // Contar todos los usuarios del sistema
    const totalUsuarios = await prisma.usuarios.count({
      where: {
        activo: true
      }
    });

    // Contar docentes totales
    const totalDocentes = await prisma.docentes.count();

    // Contar presentes hoy (obtener IDs únicos de docentes)
    const asistenciasConDocentes = await prisma.asistencias.findMany({
      where: {
        fecha: {
          gte: inicioHoy,
          lte: finHoy
        },
        horaEntrada: { not: null }
      },
      select: { docenteId: true }
    });

    // Contar docentes únicos presentes
    const docentesPresentes = new Set(asistenciasConDocentes.map(a => a.docenteId)).size;

    // Contar total de asistencias de hoy
    const totalAsistenciasHoy = await prisma.asistencias.count({
      where: {
        fecha: {
          gte: inicioHoy,
          lte: finHoy
        }
      }
    });

    // Calcular puntualidad promedio (llegadas antes de las 8:15 AM)
    const asistenciasConHora = await prisma.asistencias.findMany({
      where: {
        fecha: {
          gte: inicioHoy,
          lte: finHoy
        },
        horaEntrada: { not: null }
      },
      select: { horaEntrada: true }
    });

    let puntuales = 0;
    asistenciasConHora.forEach(asistencia => {
      if (asistencia.horaEntrada) {
        const hora = new Date(asistencia.horaEntrada);
        const limite = new Date(asistencia.horaEntrada);
        limite.setHours(8, 15, 0, 0); // 8:15 AM
        
        if (hora <= limite) {
          puntuales++;
        }
      }
    });

    const puntualidadPromedio = asistenciasConHora.length > 0 
      ? Math.round((puntuales / asistenciasConHora.length) * 100)
    : 0;

  // Calcular tendencia semanal
  const asistenciasSemanaAnterior = await prisma.asistencias.count({
    where: {
      fecha: {
        gte: subDays(inicioHoy, 7),
        lt: inicioHoy
      }
    }
  });

  const tendenciaSemanal = asistenciasSemanaAnterior > 0 
    ? Math.round(((totalAsistenciasHoy - asistenciasSemanaAnterior) / asistenciasSemanaAnterior) * 100)
    : 0;

  // Contar alertas (ausentes sin justificación)
  const alertasActivas = totalDocentes - docentesPresentes;

  // Contar ubicaciones GPS
  const totalUbicaciones = await prisma.ubicaciones_permitidas.count();
  const ubicacionesActivas = await prisma.ubicaciones_permitidas.count({
    where: { activo: true }
  });

  // Contar horarios
  const totalHorarios = await prisma.horarios_base.count();
  const horariosActivos = await prisma.horarios_base.count({
    where: { activo: true }
  });

  // Contar áreas académicas
  const totalAreas = await prisma.areas.count();
  const areasActivas = await prisma.areas.count({
    where: { activo: true }
  });

  const response = ResponseFormatter.success({
    totalUsuarios,
    docentesPresentes,
    totalDocentes,
    puntualidadPromedio,
    alertasActivas,
    totalAsistencias: totalAsistenciasHoy,
    tendenciaSemanal,
    totalUbicaciones,
    ubicacionesActivas,
    totalHorarios,
    horariosActivos,
    totalAreas,
    areasActivas,
    ultimaActualizacion: new Date()
  }, 'Estadísticas obtenidas correctamente');

  res.json(response);
});export const obtenerEstadoDocentes = async (_req: Request, res: Response) => {
  try {
    const hoy = new Date();
    const inicioHoy = startOfDay(hoy);
    const finHoy = endOfDay(hoy);

    // Obtener todos los docentes con sus usuarios y asistencias de hoy
    const docentes = await prisma.docentes.findMany({
      include: {
        usuarios: {
          select: {
            nombres: true,
            apellidos: true,
            email: true // Agregado para frontend
          }
        },
        areas: { select: { nombre: true } },
        asistencias: {
          where: {
            fecha: {
              gte: inicioHoy,
              lte: finHoy
            }
          },
          select: {
            horaEntrada: true,
            latitudEntrada: true,
            longitudEntrada: true
          },
          orderBy: { horaEntrada: 'desc' },
          take: 1
        }
      }
    });

    const docentesEstado = docentes.map(docente => {
      const asistenciaHoy = docente.asistencias[0];
      
      let estado: 'presente' | 'ausente' | 'tardanza' = 'ausente';
      let horaEntrada: string | undefined;
      let ubicacion: { latitud: number; longitud: number } | undefined;

      if (asistenciaHoy && asistenciaHoy.horaEntrada) {
        const hora = new Date(asistenciaHoy.horaEntrada);
        const limite = new Date(asistenciaHoy.horaEntrada);
        limite.setHours(8, 15, 0, 0); // 8:15 AM

        estado = hora <= limite ? 'presente' : 'tardanza';
        horaEntrada = format(hora, 'HH:mm:ss');
        
        if (asistenciaHoy.latitudEntrada && asistenciaHoy.longitudEntrada) {
          ubicacion = {
            latitud: Number(asistenciaHoy.latitudEntrada),
            longitud: Number(asistenciaHoy.longitudEntrada)
          };
        }
      }

      return {
        id: docente.id,
        nombre: `${docente.usuarios.nombres} ${docente.usuarios.apellidos}`, // Agregado: frontend lo requiere
        nombres: docente.usuarios.nombres,
        apellidos: docente.usuarios.apellidos,
        email: docente.usuarios.email, // Agregado: frontend lo requiere
        area: docente.areas?.nombre || 'Sin área',
        estado,
        horaEntrada,
        ubicacion
      };
    });

    res.json({
      success: true,
      data: docentesEstado
    });

  } catch (error) {
    console.error('Error obteniendo estado docentes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

export const exportarReporte = asyncHandler(async (req: Request, res: Response) => {
  const { tipo, filtros } = req.body;
  
  // Validación
  if (!tipo) {
    throw new ValidationError('El tipo de reporte es requerido');
  }

  if (!['pdf', 'excel', 'xlsx'].includes(tipo.toLowerCase())) {
    throw new ValidationError('Tipo de reporte inválido. Use: pdf, excel o xlsx');
  }

  // Por ahora retornamos un mensaje de éxito
  // En una implementación completa, aquí se generarían los archivos PDF/Excel
  // usando librerías como: pdfkit, exceljs, xlsx, etc.
  
  const response = ResponseFormatter.success(
    {
      tipo,
      filtros: filtros || {},
      fecha_generacion: new Date(),
      archivo: `reporte_${tipo}_${Date.now()}.${tipo === 'pdf' ? 'pdf' : 'xlsx'}`,
      nota: 'Funcionalidad de generación de reportes en desarrollo'
    },
    `Reporte ${tipo.toUpperCase()} generado exitosamente`
  );

  res.json(response);
});

// Nuevo endpoint para obtener lista de asistencias
export const obtenerAsistencias = asyncHandler(async (req: Request, res: Response) => {
  const { fecha, estado, docente } = req.query;
  
  // Configurar fechas
  let fecha_inicio: Date;
  let fecha_fin: Date;
  
  if (fecha === 'hoy' || !fecha) {
    fecha_inicio = startOfDay(new Date());
    fecha_fin = endOfDay(new Date());
  } else if (fecha === 'ayer') {
    const ayer = subDays(new Date(), 1);
    fecha_inicio = startOfDay(ayer);
    fecha_fin = endOfDay(ayer);
  } else {
    // Si se proporciona una fecha específica
    const fechaObj = new Date(fecha as string);
    fecha_inicio = startOfDay(fechaObj);
    fecha_fin = endOfDay(fechaObj);
  }

  // Obtener asistencias con datos relacionados (sin ubicaciones por problemas de tipos)
  const asistencias = await prisma.asistencias.findMany({
    where: {
      fecha: {
        gte: fecha_inicio,
        lte: fecha_fin
      }
    },
    include: {
      docente: {
        include: {
          usuarios: {
            select: {
              nombres: true,
              apellidos: true
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
    orderBy: [
      { fecha: 'desc' },
      { horaEntrada: 'asc' }
    ]
  });

  // Interfaz para el resultado formateado
  interface AsistenciaFormateada {
    id: string;
    fecha: string;
    docente: {
      nombres: string;
      apellidos: string;
      codigo_docente: string | null;
      area: {
        nombre: string;
      };
    };
    horaEntrada?: string | null;
    horaSalida?: string | null;
    tardanzaMinutos?: number | null;
    estado: 'presente' | 'ausente' | 'tardanza' | 'justificado';
    ubicacion_entrada_id?: number | null;
    ubicacion_salida_id?: number | null;
    gps_valido_entrada?: boolean;
    gps_valido_salida?: boolean;
  }

  // Procesar y formatear los datos
  const asistenciasFormateadas: AsistenciaFormateada[] = asistencias.map(asistencia => {
    // Determinar estado basado en la lógica de negocio
    let estadoCalculado: 'presente' | 'ausente' | 'tardanza' | 'justificado' = 'ausente';
    let tardanzaMinutos = 0;

    if (asistencia.horaEntrada) {
      const horaEntrada = new Date(asistencia.horaEntrada);
      const horaLimite = new Date(asistencia.horaEntrada);
      horaLimite.setHours(8, 15, 0, 0); // 8:15 AM límite

      if (horaEntrada <= horaLimite) {
        estadoCalculado = 'presente';
      } else {
        estadoCalculado = 'tardanza';
        tardanzaMinutos = Math.floor((horaEntrada.getTime() - horaLimite.getTime()) / (1000 * 60));
      }
    }

    return {
      id: asistencia.id,
      fecha: format(asistencia.fecha, 'yyyy-MM-dd'),
      docente: {
        nombres: asistencia.docente.usuarios.nombres,
        apellidos: asistencia.docente.usuarios.apellidos,
        codigo_docente: asistencia.docente.codigo_docente,
        area: {
          nombre: asistencia.docente.areas?.nombre || 'Sin área'
        }
      },
      horaEntrada: asistencia.horaEntrada ? format(asistencia.horaEntrada, 'HH:mm:ss') : null,
      horaSalida: asistencia.horaSalida ? format(asistencia.horaSalida, 'HH:mm:ss') : null,
      tardanzaMinutos: tardanzaMinutos > 0 ? tardanzaMinutos : null,
      estado: estadoCalculado,
      ubicacion_entrada_id: asistencia.ubicacionEntradaId,
      ubicacion_salida_id: asistencia.ubicacionSalidaId,
      gps_valido_entrada: asistencia.gpsValidoEntrada || false,
      gps_valido_salida: asistencia.gpsValidoSalida || false
    };
  });

  // Filtrar por estado y docente si se especifica
  let asistenciasFiltradas = asistenciasFormateadas;
  
  if (estado && estado !== 'todos') {
    asistenciasFiltradas = asistenciasFiltradas.filter(a => a.estado === estado);
  }
  
  if (docente) {
    asistenciasFiltradas = asistenciasFiltradas.filter(a => 
      a.docente.nombres.toLowerCase().includes((docente as string).toLowerCase()) ||
      a.docente.apellidos.toLowerCase().includes((docente as string).toLowerCase()) ||
      (a.docente.codigo_docente || '').toLowerCase().includes((docente as string).toLowerCase())
    );
  }

  // Calcular estadísticas
  const estadisticas = {
    total: asistenciasFormateadas.length,
    presentes: asistenciasFormateadas.filter(a => a.estado === 'presente').length,
    ausentes: asistenciasFormateadas.filter(a => a.estado === 'ausente').length,
    tardanzas: asistenciasFormateadas.filter(a => a.estado === 'tardanza').length,
    justificados: asistenciasFormateadas.filter(a => a.estado === 'justificado').length,
    porcentajeAsistencia: asistenciasFormateadas.length > 0 
      ? Math.round(((asistenciasFormateadas.filter(a => a.estado === 'presente' || a.estado === 'tardanza').length) / asistenciasFormateadas.length) * 100)
      : 0
  };

  const response = ResponseFormatter.success(
    {
      asistencia: asistenciasFiltradas,
      estadisticas,
      filtros: {
        fecha: fecha || 'hoy',
        estado: estado || 'todos',
        docentes: docente || null
      },
      ultimaActualizacion: new Date()
    },
    'Asistencias obtenidas correctamente'
  );

  res.json(response);
});

// ==================== UBICACIONES GPS ====================

export const obtenerUbicaciones = asyncHandler(async (req: Request, res: Response) => {
  const { activo, busqueda } = req.query;

  // Construir filtros
  const where: any = {};
  
  if (activo && activo !== 'todos') {
    where.activo = activo === 'activas';
  }
  
  if (busqueda && typeof busqueda === 'string') {
    where.OR = [
      { nombre: { contains: busqueda, mode: 'insensitive' } },
      { descripcion: { contains: busqueda, mode: 'insensitive' } }
    ];
  }

  // Obtener ubicaciones (sin _count para evitar errores)
  const ubicaciones = await prisma.ubicaciones_permitidas.findMany({
    where,
    orderBy: { created_at: 'desc' }
  });

  // Calcular estadísticas generales
  const estadisticas = {
    total: ubicaciones.length,
    activas: ubicaciones.filter(u => u.activo).length,
    inactivas: ubicaciones.filter(u => !u.activo).length,
    radioPromedio: ubicaciones.length > 0 
      ? Math.round(ubicaciones.reduce((sum, u) => sum + (u.radio_metros || 100), 0) / ubicaciones.length)
      : 0
  };

  const response = ResponseFormatter.success(
    {
      ubicaciones,
      estadisticas,
      filtros: {
        activo: activo || 'todos',
        busqueda: busqueda || ''
      },
      ultimaActualizacion: new Date()
    },
    'Ubicaciones obtenidas exitosamente'
  );

  res.json(response);
});

export const crearUbicacion = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { nombre, descripcion, latitud, longitud, radio_metros, activo } = req.body;

  // Validaciones
  if (!nombre || !latitud || !longitud) {
    throw new ValidationError('Nombre, latitud y longitud son obligatorios');
  }

  if (isNaN(latitud) || isNaN(longitud)) {
    throw new ValidationError('Latitud y longitud deben ser números válidos');
  }

  if (latitud < -90 || latitud > 90) {
    throw new ValidationError('Latitud debe estar entre -90 y 90 grados');
  }

  if (longitud < -180 || longitud > 180) {
    throw new ValidationError('Longitud debe estar entre -180 y 180 grados');
  }

  const radioFinal = radio_metros && !isNaN(radio_metros) ? Math.max(10, Math.min(1000, radio_metros)) : 100;

  // Verificar si ya existe una ubicación con el mismo nombre
  const ubicacionExistente = await prisma.ubicaciones_permitidas.findFirst({
    where: { 
      nombre: { equals: nombre, mode: 'insensitive' }
    }
  });

  if (ubicacionExistente) {
    throw new ConflictError('Ya existe una ubicación con ese nombre');
  }

  // Crear nueva ubicación
  const nuevaUbicacion = await prisma.ubicaciones_permitidas.create({
    data: {
      nombre,
      descripcion: descripcion || null,
      latitud: parseFloat(latitud),
      longitud: parseFloat(longitud),
      radio_metros: radioFinal,
      activo: activo !== false // Por defecto true si no se especifica
    }
  });

  const response = ResponseFormatter.created(
    nuevaUbicacion,
    'Ubicación creada exitosamente'
  );

  res.status(201).json(response);
});

export const actualizarUbicacion = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { nombre, descripcion, latitud, longitud, radio_metros, activo } = req.body;

  if (!id || isNaN(parseInt(id))) {
    throw new ValidationError('ID de ubicación inválido');
  }

  // Verificar que la ubicación existe
  const ubicacionExistente = await prisma.ubicaciones_permitidas.findUnique({
    where: { id: parseInt(id) }
  });

  if (!ubicacionExistente) {
    throw new NotFoundError('Ubicación');
  }

  // Preparar datos para actualizar
  const datosActualizacion: any = {};

  if (nombre && nombre !== ubicacionExistente.nombre) {
    // Verificar que no exista otra ubicación con el mismo nombre
    const otraUbicacion = await prisma.ubicaciones_permitidas.findFirst({
      where: { 
        nombre: { equals: nombre, mode: 'insensitive' },
        id: { not: parseInt(id) }
      }
    });

    if (otraUbicacion) {
      throw new ConflictError('Ya existe otra ubicación con ese nombre');
    }

    datosActualizacion.nombre = nombre;
  }

  if (descripcion !== undefined) {
    datosActualizacion.descripcion = descripcion || null;
  }

  if (latitud !== undefined) {
    if (isNaN(latitud) || latitud < -90 || latitud > 90) {
      throw new ValidationError('Latitud debe ser un número entre -90 y 90 grados');
    }
    datosActualizacion.latitud = parseFloat(latitud);
  }

  if (longitud !== undefined) {
    if (isNaN(longitud) || longitud < -180 || longitud > 180) {
      throw new ValidationError('Longitud debe ser un número entre -180 y 180 grados');
    }
    datosActualizacion.longitud = parseFloat(longitud);
  }

  if (radio_metros !== undefined) {
    if (isNaN(radio_metros)) {
      throw new ValidationError('Radio debe ser un número válido');
    }
    datosActualizacion.radio_metros = Math.max(10, Math.min(1000, parseInt(radio_metros)));
  }

  if (activo !== undefined) {
    datosActualizacion.activo = Boolean(activo);
  }

  // Actualizar ubicación
  const ubicacionActualizada = await prisma.ubicaciones_permitidas.update({
    where: { id: parseInt(id) },
    data: datosActualizacion
  });

  const response = ResponseFormatter.updated(
    ubicacionActualizada,
    'Ubicación actualizada exitosamente'
  );

  res.json(response);
});

export const eliminarUbicacion = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    throw new ValidationError('ID de ubicación inválido');
  }

  // Verificar que la ubicación existe
  const ubicacionExistente = await prisma.ubicaciones_permitidas.findUnique({
    where: { id: parseInt(id) }
  });

  if (!ubicacionExistente) {
    throw new NotFoundError('Ubicación');
  }

  // Verificar si hay asistencias asociadas
  const asistenciasAsociadas = await prisma.asistencias.count({
    where: {
      OR: [
        { ubicacionEntradaId: parseInt(id) },
        { ubicacionSalidaId: parseInt(id) }
      ]
    }
  });

  if (asistenciasAsociadas > 0) {
    // En lugar de eliminar, desactivar la ubicación
    const ubicacionDesactivada = await prisma.ubicaciones_permitidas.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });

    const response = ResponseFormatter.updated(
      ubicacionDesactivada,
      `Ubicación desactivada (tiene ${asistenciasAsociadas} asistencia(s) asociada(s))`
    );

    return res.json(response);
  }

  // Eliminar ubicación
  await prisma.ubicaciones_permitidas.delete({
    where: { id: parseInt(id) }
  });

  const response = ResponseFormatter.deleted(
    'Ubicación eliminada exitosamente'
  );

  res.json(response);
});

export const obtenerUbicacionPorId = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    throw new ValidationError('ID de ubicación inválido');
  }

  const ubicacion = await prisma.ubicaciones_permitidas.findUnique({
    where: { id: parseInt(id) }
  });

  if (!ubicacion) {
    throw new NotFoundError('Ubicación');
  }

  const response = ResponseFormatter.success(
    ubicacion,
    'Ubicación obtenida exitosamente'
  );

  res.json(response);
});

// ============================================
// FUNCIONES DE GESTIÓN DE HORARIOS
// ============================================

export const obtenerHorarios = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { 
    docenteId, 
    area_id, 
    dia_semana, 
    activo = true,
    page = 1, 
    limit = 50 
  } = req.query;

  // Construir filtros
  const filtros: any = {};
  
  if (docenteId) filtros.docenteId = docenteId as string;
  if (area_id) filtros.area_id = parseInt(area_id as string);
  
  if (dia_semana !== undefined) {
    const diaSemanaNum = parseInt(dia_semana as string);
    if (diaSemanaNum < 0 || diaSemanaNum > 6) {
      throw new ValidationError('El día de la semana debe estar entre 0 (Domingo) y 6 (Sábado)');
    }
    filtros.dia_semana = diaSemanaNum;
  }
  
  if (activo !== undefined) filtros.activo = activo === 'true';

  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  // Obtener horarios con relaciones
  const [horarios, total] = await Promise.all([
    prisma.horarios_base.findMany({
      where: filtros,
      include: {
        docentes: {
          select: {
            id: true,
            codigo_docente: true,
            usuarios: {
              select: {
                nombres: true,
                apellidos: true,
                email: true,
                telefono: true
              }
            }
          }
        },
        areas: {
          select: {
            id: true,
            nombre: true,
            descripcion: true
          }
        },
        _count: {
          select: {
            horas_trabajadas: true
          }
        }
      },
      orderBy: [
        { dia_semana: 'asc' },
        { hora_inicio: 'asc' }
      ],
      skip: offset,
      take: parseInt(limit as string)
    }),
    prisma.horarios_base.count({ where: filtros })
  ]);

  // Calcular estadísticas
  const estadisticas = await prisma.horarios_base.aggregate({
    where: filtros,
    _count: {
      id: true
    },
    _sum: {
      horas_semana: true
    },
    _avg: {
      horas_semana: true
    }
  });

  const horariosActivos = await prisma.horarios_base.count({
    where: { ...filtros, activo: true }
  });

  const horariosPorDia = await prisma.horarios_base.groupBy({
    by: ['dia_semana'],
    where: filtros,
    _count: {
      id: true
    },
    orderBy: {
      dia_semana: 'asc'
    }
  });

  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const response = ResponseFormatter.success(
    {
      horarios,
      estadisticas: {
        total: estadisticas._count.id || 0,
        activos: horariosActivos,
        inactivos: (estadisticas._count.id || 0) - horariosActivos,
        totalHorasSemana: Number(estadisticas._sum.horas_semana) || 0,
        promedioHorasSemana: Number(estadisticas._avg.horas_semana) || 0,
        distribuciones: horariosPorDia.map(item => ({
          dia: diasSemana[item.dia_semana],
          cantidad: item._count.id
        }))
      }
    },
    'Horarios obtenidos exitosamente',
    {
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    }
  );

  res.json(response);
});

export const crearHorario = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { 
    docenteId, 
    area_id, 
    dia_semana, 
    hora_inicio, 
    hora_fin, 
    tipo_clase, 
    horas_semana,
    activo = true,
    fecha_vigencia,
    fecha_fin
  } = req.body;

  // Validaciones básicas
  if (!docenteId || !area_id || dia_semana === undefined || !hora_inicio || !hora_fin) {
    throw new ValidationError('Los campos docenteId, area_id, dia_semana, hora_inicio y hora_fin son requeridos');
  }

  // Validar día de la semana (0-6)
  if (dia_semana < 0 || dia_semana > 6) {
    throw new ValidationError('El día de la semana debe estar entre 0 (Domingo) y 6 (Sábado)');
  }

  // Verificar que el docente existe
  const docente = await prisma.docentes.findUnique({
    where: { id: docenteId }
  });

  if (!docente) {
    throw new NotFoundError('Docente');
  }

  // Verificar que el área existe
  const area = await prisma.areas.findUnique({
    where: { id: parseInt(area_id) }
  });

  if (!area) {
    throw new NotFoundError('Área');
  }

  // Crear el horario
  const nuevoHorario = await prisma.horarios_base.create({
    data: {
      docente_id: docenteId,
      area_id: parseInt(area_id),
      dia_semana: parseInt(dia_semana),
      hora_inicio: new Date(`1970-01-01T${hora_inicio}`),
      hora_fin: new Date(`1970-01-01T${hora_fin}`),
      tipo_clase,
      horas_semana: parseFloat(horas_semana) || 0,
      activo,
      fecha_vigencia: fecha_vigencia ? new Date(fecha_vigencia) : null,
      fecha_fin: fecha_fin ? new Date(fecha_fin) : null
    },
    include: {
      docentes: {
        select: {
          id: true,
          codigo_docente: true,
          usuarios: {
            select: {
              nombres: true,
              apellidos: true,
              email: true
            }
          }
        }
      },
      areas: {
        select: {
          id: true,
          nombre: true,
          descripcion: true
        }
      }
    }
  });

  const response = ResponseFormatter.created(
    nuevoHorario,
    'Horario creado exitosamente'
  );

  res.status(201).json(response);
});

export const eliminarHorario = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    throw new ValidationError('ID del horario inválido');
  }

  // Verificar si el horario existe
  const horarioExistente = await prisma.horarios_base.findUnique({
    where: { id: parseInt(id) },
    include: {
      _count: {
        select: {
          horas_trabajadas: true
        }
      }
    }
  });

  if (!horarioExistente) {
    throw new NotFoundError('Horario');
  }

  // Verificar si tiene horas trabajadas registradas
  if (horarioExistente._count.horas_trabajadas > 0) {
    // Si tiene registros, mejor desactivar en vez de eliminar
    const horarioDesactivado = await prisma.horarios_base.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });

    const response = ResponseFormatter.updated(
      horarioDesactivado,
      `Horario desactivado (tiene ${horarioExistente._count.horas_trabajadas} horas trabajadas registradas)`
    );

    return res.json(response);
  }

  // Si no tiene registros, eliminar completamente
  await prisma.horarios_base.delete({
    where: { id: parseInt(id) }
  });

  const response = ResponseFormatter.deleted('Horario eliminado exitosamente');
  res.json(response);
});

// ============================================
// FUNCIONES PARA GRÁFICOS DEL DASHBOARD
// ============================================

/**
 * Obtener datos de asistencias de la última semana para gráfico de barras
 */
export const obtenerAsistenciasSemana = asyncHandler(async (_req: Request, res: Response): Promise<any> => {
  const hoy = new Date();
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const asistenciasSemana = [];

  // Obtener datos de los últimos 7 días
  for (let i = 6; i >= 0; i--) {
    const fecha = new Date(hoy);
    fecha.setDate(fecha.getDate() - i);
    
    const inicioDia = startOfDay(fecha);
    const finDia = endOfDay(fecha);

    // Contar asistencias del día
    const [presentes, ausentes, tardanzas] = await Promise.all([
      // Presentes (llegaron antes de las 8:15)
      prisma.asistencias.count({
        where: {
          fecha: { gte: inicioDia, lte: finDia },
          horaEntrada: { not: null },
          tardanzaMinutos: 0
        }
      }),
      // Ausentes (sin hora de entrada)
      prisma.asistencias.count({
        where: {
          fecha: { gte: inicioDia, lte: finDia },
          horaEntrada: null
        }
      }),
      // Tardanzas (con tardanza > 0)
      prisma.asistencias.count({
        where: {
          fecha: { gte: inicioDia, lte: finDia },
          tardanzaMinutos: { gt: 0 }
        }
      })
    ]);

    asistenciasSemana.push({
      name: diasSemana[fecha.getDay()],
      presente: presentes + tardanzas, // Total que llegaron
      ausente: ausentes,
      tardanza: tardanzas
    });
  }

  const response = ResponseFormatter.success(
    asistenciasSemana,
    'Asistencias semanales obtenidas exitosamente'
  );

  res.json(response);
});

/**
 * Obtener distribución de puntualidad para gráfico circular
 */
export const obtenerDistribucionPuntualidad = asyncHandler(async (_req: Request, res: Response): Promise<any> => {
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const finMes = endOfDay(hoy);

  // Contar por tipo de asistencia en el mes actual
  const [puntuales, tardanzas, ausentes, justificados] = await Promise.all([
    // Puntuales (sin tardanza)
    prisma.asistencias.count({
      where: {
        fecha: { gte: inicioMes, lte: finMes },
        horaEntrada: { not: null },
        tardanzaMinutos: 0
      }
    }),
    // Tardanzas
    prisma.asistencias.count({
      where: {
        fecha: { gte: inicioMes, lte: finMes },
        tardanzaMinutos: { gt: 0 }
      }
    }),
    // Ausentes
    prisma.asistencias.count({
      where: {
        fecha: { gte: inicioMes, lte: finMes },
        horaEntrada: null,
        estado: 'ausente'
      }
    }),
    // Justificados
    prisma.asistencias.count({
      where: {
        fecha: { gte: inicioMes, lte: finMes },
        estado: 'justificado'
      }
    })
  ]);

  const total = puntuales + tardanzas + ausentes + justificados;

  // Calcular porcentajes
  const distribucion = [
    { 
      name: 'Puntual', 
      value: total > 0 ? Math.round((puntuales / total) * 100) : 0,
      count: puntuales,
      color: '#10B981' 
    },
    { 
      name: 'Tardanza', 
      value: total > 0 ? Math.round((tardanzas / total) * 100) : 0,
      count: tardanzas,
      color: '#F59E0B' 
    },
    { 
      name: 'Ausente', 
      value: total > 0 ? Math.round((ausentes / total) * 100) : 0,
      count: ausentes,
      color: '#EF4444' 
    },
    { 
      name: 'Justificado', 
      value: total > 0 ? Math.round((justificados / total) * 100) : 0,
      count: justificados,
      color: '#6366F1' 
    }
  ].filter(item => item.value > 0); // Solo mostrar los que tienen datos

  const response = ResponseFormatter.success(
    {
      distribucion,
      total,
      periodo: {
        inicio: inicioMes,
        fin: finMes
      }
    },
    'Distribución de puntualidad obtenida exitosamente'
  );

  res.json(response);
});


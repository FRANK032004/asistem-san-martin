import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Interface para datos de ubicación GPS
export interface DatosUbicacion {
  nombre: string;
  descripcion?: string;
  latitud: number;
  longitud: number;
  radio_metros: number;
  activo?: boolean;
}

// Interface para filtros de ubicaciones
export interface FiltrosUbicacion {
  activo?: boolean;
  busqueda?: string;
}

// Interface para estadísticas de ubicaciones
export interface EstadisticasUbicacion {
  total: number;
  activas: number;
  inactivas: number;
  promedioRadius: number;
}

/**
 * Obtener todas las ubicaciones GPS con estadísticas
 */
export const obtenerUbicaciones = async (req: Request, res: Response) => {
  try {
    const { activo, busqueda } = req.query;
    
    // Construir filtros
    const whereClause: any = {};
    
    if (activo !== undefined) {
      whereClause.activo = activo === 'true';
    }
    
    if (busqueda) {
      whereClause.OR = [
        { nombre: { contains: busqueda as string, mode: 'insensitive' } },
        { descripcion: { contains: busqueda as string, mode: 'insensitive' } }
      ];
    }

    // Obtener ubicaciones
    const ubicaciones = await prisma.ubicaciones_permitidas.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' }
    });

    // Calcular estadísticas
    const totalUbicaciones = ubicaciones.length;
    const ubicacionesActivas = ubicaciones.filter((u: any) => u.activo).length;
    const ubicacionesInactivas = totalUbicaciones - ubicacionesActivas;
    const promedioRadius = totalUbicaciones > 0 
      ? ubicaciones.reduce((sum: number, u: any) => sum + u.radio_metros, 0) / totalUbicaciones 
      : 0;

    const estadisticas: EstadisticasUbicacion = {
      total: totalUbicaciones,
      activas: ubicacionesActivas,
      inactivas: ubicacionesInactivas,
      promedioRadius: Math.round(promedioRadius)
    };

    return res.status(200).json({
      success: true,
      message: 'Ubicaciones obtenidas correctamente',
      data: {
        ubicaciones,
        estadisticas
      }
    });

  } catch (error) {
    console.error('Error obteniendo ubicaciones:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * Crear nueva ubicación GPS
 * 🎯 El trigger de PostGIS actualizará automáticamente punto_geo
 */
export const crearUbicacion = async (req: Request, res: Response) => {
  try {
    const { nombre, descripcion, latitud, longitud, radio_metros, activo = true }: DatosUbicacion = req.body;

    // Validaciones
    if (!nombre || nombre.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }

    if (latitud === undefined || longitud === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Latitud y longitud son requeridas'
      });
    }

    if (radio_metros === undefined || radio_metros <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Radio debe ser mayor a 0'
      });
    }

    // Validar rango de coordenadas
    if (latitud < -90 || latitud > 90) {
      return res.status(400).json({
        success: false,
        message: 'Latitud debe estar entre -90 y 90'
      });
    }

    if (longitud < -180 || longitud > 180) {
      return res.status(400).json({
        success: false,
        message: 'Longitud debe estar entre -180 y 180'
      });
    }

    // Verificar si ya existe una ubicación con el mismo nombre
    const ubicacionExistente = await prisma.ubicaciones_permitidas.findFirst({
      where: { nombre: { equals: nombre.trim(), mode: 'insensitive' } }
    });

    if (ubicacionExistente) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una ubicación con ese nombre'
      });
    }

    // Crear la ubicación (trigger actualiza punto_geo automáticamente)
    const nuevaUbicacion = await prisma.ubicaciones_permitidas.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        latitud: parseFloat(latitud.toString()),
        longitud: parseFloat(longitud.toString()),
        radio_metros: parseInt(radio_metros.toString()),
        activo: Boolean(activo)
      }
    });

    console.log('✅ Ubicación creada - PostGIS actualizó punto_geo automáticamente');

    return res.status(201).json({
      success: true,
      message: 'Ubicación GPS creada correctamente con PostGIS',
      data: { ubicacion: nuevaUbicacion }
    });

  } catch (error) {
    console.error('Error creando ubicación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * Actualizar ubicación GPS existente
 * 🎯 El trigger de PostGIS actualizará automáticamente punto_geo
 */
export const actualizarUbicacion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, latitud, longitud, radio_metros, activo }: DatosUbicacion = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de ubicación inválido'
      });
    }

    // Verificar que la ubicación existe
    const ubicacionExistente = await prisma.ubicaciones_permitidas.findUnique({
      where: { id: parseInt(id) }
    });

    if (!ubicacionExistente) {
      return res.status(404).json({
        success: false,
        message: 'Ubicación no encontrada'
      });
    }

    // Preparar datos para actualización
    const datosActualizacion: any = {
      updated_at: new Date()
    };

    if (nombre !== undefined) datosActualizacion.nombre = nombre.trim();
    if (descripcion !== undefined) datosActualizacion.descripcion = descripcion?.trim() || null;
    if (latitud !== undefined) datosActualizacion.latitud = parseFloat(latitud.toString());
    if (longitud !== undefined) datosActualizacion.longitud = parseFloat(longitud.toString());
    if (radio_metros !== undefined) datosActualizacion.radio_metros = parseInt(radio_metros.toString());
    if (activo !== undefined) datosActualizacion.activo = Boolean(activo);

    // Actualizar la ubicación (trigger actualiza punto_geo automáticamente)
    const ubicacionActualizada = await prisma.ubicaciones_permitidas.update({
      where: { id: parseInt(id) },
      data: datosActualizacion
    });

    console.log('✅ Ubicación actualizada - PostGIS actualizó punto_geo automáticamente');

    return res.status(200).json({
      success: true,
      message: 'Ubicación actualizada correctamente con PostGIS',
      data: { ubicacion: ubicacionActualizada }
    });

  } catch (error) {
    console.error('Error actualizando ubicación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * Eliminar ubicación GPS
 */
export const eliminarUbicacion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de ubicación inválido'
      });
    }

    // Verificar que la ubicación existe
    const ubicacionExistente = await prisma.ubicaciones_permitidas.findUnique({
      where: { id: parseInt(id) }
    });

    if (!ubicacionExistente) {
      return res.status(404).json({
        success: false,
        message: 'Ubicación no encontrada'
      });
    }

    // Verificar si la ubicación está siendo usada en asistencias
    const asistenciasConUbicacion = await prisma.asistencias.findFirst({
      where: { 
        OR: [
          { ubicacionEntradaId: parseInt(id) },
          { ubicacionSalidaId: parseInt(id) }
        ]
      }
    });

    if (asistenciasConUbicacion) {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar la ubicación porque tiene asistencias registradas'
      });
    }

    // Eliminar la ubicación
    await prisma.ubicaciones_permitidas.delete({
      where: { id: parseInt(id) }
    });

    return res.status(200).json({
      success: true,
      message: 'Ubicación eliminada correctamente'
    });

  } catch (error) {
    console.error('Error eliminando ubicación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * Obtener ubicación GPS por ID
 */
export const obtenerUbicacionPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de ubicación inválido'
      });
    }

    const ubicacion = await prisma.ubicaciones_permitidas.findUnique({
      where: { id: parseInt(id) }
    });

    if (!ubicacion) {
      return res.status(404).json({
        success: false,
        message: 'Ubicación no encontrada'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Ubicación obtenida correctamente',
      data: { ubicacion }
    });

  } catch (error) {
    console.error('Error obteniendo ubicación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

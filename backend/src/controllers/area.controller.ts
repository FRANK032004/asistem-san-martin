import { Request, Response } from 'express';
import prisma from '../utils/database';

// Interface para datos de área
export interface DatosArea {
  nombre: string;
  descripcion?: string;
  codigo?: string;
  color_hex?: string;
  coordinador_id?: string;
  activo?: boolean;
}

// Interface para filtros de áreas
export interface FiltrosAreas {
  activo?: boolean;
  coordinador_id?: string;
  busqueda?: string;
}

// Interface para estadísticas de áreas
export interface EstadisticasAreas {
  total: number;
  activas: number;
  inactivas: number;
  conusuarios: number;
  sinusuarios: number;
  conCoordinador: number;
  sinCoordinador: number;
  totalDocentes: number;
  totalhorarios_base: number;
  distribucion: {
    area_id: number;
    areaNombre: string;
    totalDocentes: number;
    totalhorarios_base: number;
  }[];
}

/**
 * Obtener todas las áreas con estadísticas
 */
export const obtenerAreas = async (req: Request, res: Response) => {
  try {
    const { activo, coordinador_id, busqueda } = req.query;
    
    // Construir filtros
    const whereClause: any = {};
    
    if (activo !== undefined) {
      whereClause.activo = activo === 'true';
    }
    
    if (coordinador_id) {
      whereClause.coordinador_id = coordinador_id as string;
    }
    
    if (busqueda) {
      whereClause.OR = [
        { nombre: { contains: busqueda as string, mode: 'insensitive' } },
        { descripcion: { contains: busqueda as string, mode: 'insensitive' } },
        { codigo: { contains: busqueda as string, mode: 'insensitive' } }
      ];
    }

    // Obtener áreas con relaciones
    const areas = await prisma.areas.findMany({
      where: whereClause,
      include: {
        usuarios: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            email: true,
            telefono: true
          }
        },
        _count: {
          select: {
            docentes: true,
            horarios_base: true
          }
        }
      },
      orderBy: [
        { activo: 'desc' },
        { nombre: 'asc' }
      ]
    });

    // Calcular estadísticas
    const estadisticas = await calcularEstadisticasAreas();

    res.json({
      success: true,
      message: 'Áreas obtenidas correctamente',
      data: {
        areas,
        estadisticas
      }
    });
  } catch (error: any) {
    console.error('Error obteniendo áreas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener áreas',
      error: error.message
    });
  }
};

/**
 * Obtener un área por ID
 */
export const obtenerAreaPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID de área no proporcionado'
      });
      return;
    }

    const area = await prisma.areas.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuarios: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            email: true,
            telefono: true,
            dni: true
          }
        },
        docentes: {
          include: {
            usuarios: {
              select: {
                nombres: true,
                apellidos: true,
                email: true
              }
            }
          }
        },
        horarios_base: {
          where: { activo: true },
          include: {
            docentes: {
              include: {
                usuarios: {
                  select: {
                    nombres: true,
                    apellidos: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            docentes: true,
            horarios_base: true
          }
        }
      }
    });

    if (!area) {
      res.status(404).json({
        success: false,
        message: 'Área no encontrada'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Área obtenida correctamente',
      data: area
    });
  } catch (error: any) {
    console.error('Error obteniendo área:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener área',
      error: error.message
    });
  }
};

/**
 * Crear nueva área
 */
export const crearArea = async (req: Request, res: Response) => {
  try {
    const datos: DatosArea = req.body;

    // Validar datos requeridos
    if (!datos.nombre) {
      res.status(400).json({
        success: false,
        message: 'El nombre del área es requerido'
      });
      return;
    }

    // Verificar si el código ya existe
    if (datos.codigo) {
      const areaExistente = await prisma.areas.findUnique({
        where: { codigo: datos.codigo }
      });

      if (areaExistente) {
        res.status(400).json({
          success: false,
          message: 'Ya existe un área con ese código'
        });
        return;
      }
    }

    // Verificar que el coordinador existe si se proporciona
    if (datos.coordinador_id) {
      const coordinador = await prisma.usuarios.findUnique({
        where: { id: datos.coordinador_id }
      });

      if (!coordinador) {
        res.status(404).json({
          success: false,
          message: 'Coordinador no encontrado'
        });
        return;
      }
    }

    // Crear área
    const area = await prisma.areas.create({
      data: {
        nombre: datos.nombre,
        ...(datos.descripcion && { descripcion: datos.descripcion }),
        ...(datos.codigo && { codigo: datos.codigo }),
        color_hex: datos.color_hex || '#3B82F6',
        ...(datos.coordinador_id && { coordinador_id: datos.coordinador_id }),
        activo: datos.activo !== undefined ? datos.activo : true
      },
      include: {
        usuarios: {
          select: {
            nombres: true,
            apellidos: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Área creada correctamente',
      data: area
    });
  } catch (error: any) {
    console.error('Error creando área:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear área',
      error: error.message
    });
  }
};

/**
 * Actualizar área
 */
export const actualizarArea = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const datos: DatosArea = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID de área no proporcionado'
      });
      return;
    }

    // Verificar que el área existe
    const areaExistente = await prisma.areas.findUnique({
      where: { id: parseInt(id) }
    });

    if (!areaExistente) {
      res.status(404).json({
        success: false,
        message: 'Área no encontrada'
      });
      return;
    }

    // Verificar código duplicado si se está cambiando
    if (datos.codigo && datos.codigo !== areaExistente.codigo) {
      const areaCodigo = await prisma.areas.findUnique({
        where: { codigo: datos.codigo }
      });

      if (areaCodigo) {
        res.status(400).json({
          success: false,
          message: 'Ya existe un área con ese código'
        });
        return;
      }
    }

    // Verificar que el coordinador existe si se proporciona
    if (datos.coordinador_id) {
      const coordinador = await prisma.usuarios.findUnique({
        where: { id: datos.coordinador_id }
      });

      if (!coordinador) {
        res.status(404).json({
          success: false,
          message: 'Coordinador no encontrado'
        });
        return;
      }
    }

    // Actualizar área
    const dataToUpdate: any = {};
    if (datos.nombre !== undefined) dataToUpdate.nombre = datos.nombre;
    if (datos.descripcion !== undefined) dataToUpdate.descripcion = datos.descripcion;
    if (datos.codigo !== undefined) dataToUpdate.codigo = datos.codigo;
    if (datos.color_hex !== undefined) dataToUpdate.color_hex = datos.color_hex;
    if (datos.coordinador_id !== undefined) dataToUpdate.coordinador_id = datos.coordinador_id;
    if (datos.activo !== undefined) dataToUpdate.activo = datos.activo;

    const area = await prisma.areas.update({
      where: { id: parseInt(id) },
      data: dataToUpdate,
      include: {
        usuarios: {
          select: {
            nombres: true,
            apellidos: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Área actualizada correctamente',
      data: area
    });
  } catch (error: any) {
    console.error('Error actualizando área:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar área',
      error: error.message
    });
  }
};

/**
 * Eliminar área
 */
export const eliminarArea = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID de área no proporcionado'
      });
      return;
    }

    // Verificar que el área existe
    const area = await prisma.areas.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            docentes: true,
            horarios_base: true
          }
        }
      }
    });

    if (!area) {
      res.status(404).json({
        success: false,
        message: 'Área no encontrada'
      });
      return;
    }

    // Verificar si tiene docentes o horarios asociados
    if (area._count.docentes > 0 || area._count.horarios_base > 0) {
      res.status(400).json({
        success: false,
        message: `No se puede eliminar el área porque tiene ${area._count.docentes} docentes y ${area._count.horarios_base} horarios asociados. Desactívala en su lugar.`,
        data: {
          docentes: area._count.docentes,
          horarios_base: area._count.horarios_base
        }
      });
      return;
    }

    // Eliminar área
    await prisma.areas.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Área eliminada correctamente'
    });
  } catch (error: any) {
    console.error('Error eliminando área:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar área',
      error: error.message
    });
  }
};

/**
 * Cambiar estado de área (activar/desactivar)
 */
export const cambiarEstadoArea = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID de área no proporcionado'
      });
      return;
    }

    if (activo === undefined) {
      res.status(400).json({
        success: false,
        message: 'El estado activo es requerido'
      });
      return;
    }

    const area = await prisma.areas.update({
      where: { id: parseInt(id) },
      data: { activo },
      include: {
        usuarios: {
          select: {
            nombres: true,
            apellidos: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: `Área ${activo ? 'activada' : 'desactivada'} correctamente`,
      data: area
    });
  } catch (error: any) {
    console.error('Error cambiando estado de área:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del área',
      error: error.message
    });
  }
};

/**
 * Calcular estadísticas de áreas
 */
async function calcularEstadisticasAreas(): Promise<EstadisticasAreas> {
  const areas = await prisma.areas.findMany({
    include: {
      _count: {
        select: {
          docentes: true,
          horarios_base: true
        }
      }
    }
  });

  const total = areas.length;
  const activas = areas.filter(a => a.activo).length;
  const inactivas = total - activas;
  const conCoordinador = areas.filter(a => a.coordinador_id !== null).length;
  const sinCoordinador = total - conCoordinador;
  const totalDocentes = areas.reduce((sum, a) => sum + a._count.docentes, 0);
  const totalHorarios = areas.reduce((sum, a) => sum + a._count.horarios_base, 0);

  const distribucion = areas.map(a => ({
    area_id: a.id,
    areaNombre: a.nombre,
    totalDocentes: a._count.docentes,
    totalhorarios_base: a._count.horarios_base
  }));

  return {
    total,
    activas,
    inactivas,
    conusuarios: conCoordinador,
    sinusuarios: sinCoordinador,
    conCoordinador,
    sinCoordinador,
    totalDocentes,
    totalhorarios_base: totalHorarios,
    distribucion
  };
}


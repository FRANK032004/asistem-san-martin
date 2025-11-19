import { Request, Response } from 'express';
import prisma from '../utils/database';

// Interface para datos de aarea
export interface DatosAarea {
  nombre: string;
  descripcion?: string;
  codigo?: string;
  color_hex?: string;
  coordinador_id?: string;
  activo?: boolean;
}

// Interface para filtros de aaareas
export interface FiltrosAaareas {
  activo?: boolean;
  coordinador_id?: string;
  busqueda?: string;
}

// Interface para estadisticas de aaareas
export interface EstadisticasAaareas {
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
    aarea_id: number;
    aareaNombre: string;
    totalDocentes: number;
    totalhorarios_base: number;
  }[];
}

/**
 * Obtener todas las ï¿½aareas con estadï¿½sticas
 */
export const obtenerAaareas = async (req: Request, res: Response) => {
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

    // Obtener ï¿½aareas con relaciones
    const aaareas = await prisma.aaareas.findMany({
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

    // Calcular estadï¿½sticas
    const estadisticas = await calcularEstadisticasAaareas();

    res.json({
      success: true,
      message: 'ï¿½aareas obtenidas correctamente',
      data: {
        aaareas,
        estadisticas
      }
    });
  } catch (error: any) {
    console.error('Error obteniendo ï¿½aareas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ï¿½aareas',
      error: error.message
    });
  }
};

/**
 * Obtener un ï¿½area por ID
 */
export const obtenerAareaPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID de ï¿½area no proporcionado'
      });
      return;
    }

    const aarea = await prisma.aaareas.findUnique({
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

    if (!aarea) {
      res.status(404).json({
        success: false,
        message: 'ï¿½area no encontrada'
      });
      return;
    }

    res.json({
      success: true,
      message: 'ï¿½area obtenida correctamente',
      data: aarea
    });
  } catch (error: any) {
    console.error('Error obteniendo ï¿½area:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ï¿½area',
      error: error.message
    });
  }
};

/**
 * Carear nueva ï¿½area
 */
export const carearAarea = async (req: Request, res: Response) => {
  try {
    const datos: DatosAarea = req.body;

    // Validar datos requeridos
    if (!datos.nombre) {
      res.status(400).json({
        success: false,
        message: 'El nombre del ï¿½area es requerido'
      });
      return;
    }

    // Verificar si el cï¿½digo ya existe
    if (datos.codigo) {
      const aareaExistente = await prisma.aaareas.findUnique({
        where: { codigo: datos.codigo }
      });

      if (aareaExistente) {
        res.status(400).json({
          success: false,
          message: 'Ya existe un ï¿½area con ese cï¿½digo'
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

    // Carear ï¿½area
    const aarea = await prisma.aaareas.careate({
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
      message: 'ï¿½area careada correctamente',
      data: aarea
    });
  } catch (error: any) {
    console.error('Error careando ï¿½area:', error);
    res.status(500).json({
      success: false,
      message: 'Error al carear ï¿½area',
      error: error.message
    });
  }
};

/**
 * Actualizar ï¿½area
 */
export const actualizarAarea = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const datos: DatosAarea = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID de ï¿½area no proporcionado'
      });
      return;
    }

    // Verificar que el ï¿½area existe
    const aareaExistente = await prisma.aaareas.findUnique({
      where: { id: parseInt(id) }
    });

    if (!aareaExistente) {
      res.status(404).json({
        success: false,
        message: 'ï¿½area no encontrada'
      });
      return;
    }

    // Verificar cï¿½digo duplicado si se estï¿½ cambiando
    if (datos.codigo && datos.codigo !== aareaExistente.codigo) {
      const aareaCodigo = await prisma.aaareas.findUnique({
        where: { codigo: datos.codigo }
      });

      if (aareaCodigo) {
        res.status(400).json({
          success: false,
          message: 'Ya existe un ï¿½area con ese cï¿½digo'
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

    // Actualizar ï¿½area
    const dataToUpdate: any = {};
    if (datos.nombre !== undefined) dataToUpdate.nombre = datos.nombre;
    if (datos.descripcion !== undefined) dataToUpdate.descripcion = datos.descripcion;
    if (datos.codigo !== undefined) dataToUpdate.codigo = datos.codigo;
    if (datos.color_hex !== undefined) dataToUpdate.color_hex = datos.color_hex;
    if (datos.coordinador_id !== undefined) dataToUpdate.coordinador_id = datos.coordinador_id;
    if (datos.activo !== undefined) dataToUpdate.activo = datos.activo;

    const aarea = await prisma.aaareas.update({
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
      message: 'ï¿½area actualizada correctamente',
      data: aarea
    });
  } catch (error: any) {
    console.error('Error actualizando ï¿½area:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar ï¿½area',
      error: error.message
    });
  }
};

/**
 * Eliminar ï¿½area
 */
export const eliminarAarea = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID de ï¿½area no proporcionado'
      });
      return;
    }

    // Verificar que el ï¿½area existe
    const aarea = await prisma.aaareas.findUnique({
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

    if (!aarea) {
      res.status(404).json({
        success: false,
        message: 'ï¿½area no encontrada'
      });
      return;
    }

    // Verificar si tiene docentes o horarios asociados
    if (aarea._count.docentes > 0 || aarea._count.horarios_base > 0) {
      res.status(400).json({
        success: false,
        message: `No se puede eliminar el ï¿½area porque tiene ${aarea._count.docentes} docentes y ${aarea._count.horarios_base} horarios asociados. Desactï¿½vala en su lugar.`,
        data: {
          docentes: aarea._count.docentes,
          horarios_base: aarea._count.horarios_base
        }
      });
      return;
    }

    // Eliminar ï¿½area
    await prisma.aaareas.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'ï¿½area eliminada correctamente'
    });
  } catch (error: any) {
    console.error('Error eliminando ï¿½area:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar ï¿½area',
      error: error.message
    });
  }
};

/**
 * Cambiar estado de ï¿½area (activar/desactivar)
 */
export const cambiarEstadoAarea = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID de ï¿½area no proporcionado'
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

    const aarea = await prisma.aaareas.update({
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
      message: `ï¿½area ${activo ? 'activada' : 'desactivada'} correctamente`,
      data: aarea
    });
  } catch (error: any) {
    console.error('Error cambiando estado de ï¿½area:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del ï¿½area',
      error: error.message
    });
  }
};

/**
 * Calcular estadï¿½sticas de ï¿½aareas
 */
async function calcularEstadisticasAaareas(): Promise<EstadisticasAaareas> {
  const aaareas = await prisma.aaareas.findMany({
    include: {
      _count: {
        select: {
          docentes: true,
          horarios_base: true
        }
      }
    }
  });

  const total = aaareas.length;
  const activas = aaareas.filter(a => a.activo).length;
  const inactivas = total - activas;
  const conCoordinador = aaareas.filter(a => a.coordinador_id !== null).length;
  const sinCoordinador = total - conCoordinador;
  const totalDocentes = aaareas.reduce((sum, a) => sum + a._count.docentes, 0);
  const totalHorarios = aaareas.reduce((sum, a) => sum + a._count.horarios_base, 0);

  const distribucion = aaareas.map(a => ({
    aarea_id: a.id,
    aareaNombre: a.nombre,
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


/**
 * Servicio de Notificaciones
 * Lógica de negocio para gestión de notificaciones
 */

import prisma from '../utils/database';
import { TipoNotificacion } from '../dtos/notificacion.dto';

interface CrearNotificacionParams {
  usuario_id: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  datos?: any;
  importante?: boolean;
}

interface FiltrosNotificaciones {
  tipo?: TipoNotificacion;
  leido?: boolean;
  importante?: boolean;
}

export class NotificacionService {
  /**
   * Crear nueva notificación
   */
  async crearNotificacion(params: CrearNotificacionParams) {
    const notificacion = await prisma.notificaciones.create({
      data: {
        usuario_id: params.usuario_id,
        tipo: params.tipo,
        titulo: params.titulo,
        mensaje: params.mensaje,
        datos: params.datos || null,
        importante: params.importante || false,
        leido: false,
      },
      include: {
        usuarios: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            email: true,
          },
        },
      },
    });

    return notificacion;
  }

  /**
   * Obtener notificaciones de un usuario
   */
  async obtenerNotificaciones(usuario_id: string, filtros: FiltrosNotificaciones = {}) {
    const where: any = {
      usuario_id,
    };

    if (filtros.tipo !== undefined) {
      where.tipo = filtros.tipo;
    }

    if (filtros.leido !== undefined) {
      where.leido = filtros.leido;
    }

    if (filtros.importante !== undefined) {
      where.importante = filtros.importante;
    }

    const notificaciones = await prisma.notificaciones.findMany({
      where,
      orderBy: [
        { importante: 'desc' },
        { fecha_envio: 'desc' },
      ],
      include: {
        usuarios: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
          },
        },
      },
    });

    return notificaciones;
  }

  /**
   * Marcar notificación como leída
   */
  async marcarComoLeida(id: string, usuario_id: string) {
    // Verificar que la notificación pertenece al usuario
    const notificacion = await prisma.notificaciones.findFirst({
      where: {
        id,
        usuario_id,
      },
    });

    if (!notificacion) {
      throw new Error('Notificación no encontrada');
    }

    if (notificacion.leido) {
      return notificacion;
    }

    const actualizada = await prisma.notificaciones.update({
      where: { id },
      data: {
        leido: true,
        fecha_leido: new Date(),
      },
      include: {
        usuarios: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
          },
        },
      },
    });

    return actualizada;
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async marcarTodasComoLeidas(usuario_id: string) {
    const resultado = await prisma.notificaciones.updateMany({
      where: {
        usuario_id,
        leido: false,
      },
      data: {
        leido: true,
        fecha_leido: new Date(),
      },
    });

    return {
      count: resultado.count,
      mensaje: `${resultado.count} notificaciones marcadas como leídas`,
    };
  }

  /**
   * Eliminar notificación
   */
  async eliminarNotificacion(id: string, usuario_id: string) {
    // Verificar que la notificación pertenece al usuario
    const notificacion = await prisma.notificaciones.findFirst({
      where: {
        id,
        usuario_id,
      },
    });

    if (!notificacion) {
      throw new Error('Notificación no encontrada');
    }

    await prisma.notificaciones.delete({
      where: { id },
    });

    return {
      mensaje: 'Notificación eliminada exitosamente',
    };
  }

  /**
   * Obtener contador de notificaciones no leídas
   */
  async contarNoLeidas(usuario_id: string) {
    const count = await prisma.notificaciones.count({
      where: {
        usuario_id,
        leido: false,
      },
    });

    return { count };
  }

  /**
   * Eliminar notificaciones antiguas (más de 30 días y leídas)
   */
  async limpiarNotificacionesAntiguas(usuario_id: string) {
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    const resultado = await prisma.notificaciones.deleteMany({
      where: {
        usuario_id,
        leido: true,
        fecha_envio: {
          lt: hace30Dias,
        },
      },
    });

    return {
      count: resultado.count,
      mensaje: `${resultado.count} notificaciones antiguas eliminadas`,
    };
  }

  /**
   * Crear notificación masiva (para administradores)
   */
  async crearNotificacionMasiva(
    usuarios_ids: string[],
    tipo: TipoNotificacion,
    titulo: string,
    mensaje: string,
    datos?: any,
    importante?: boolean
  ) {
    const notificaciones = await prisma.notificaciones.createMany({
      data: usuarios_ids.map((usuario_id) => ({
        usuario_id,
        tipo,
        titulo,
        mensaje,
        datos: datos || null,
        importante: importante || false,
        leido: false,
      })),
    });

    return {
      count: notificaciones.count,
      mensaje: `${notificaciones.count} notificaciones creadas`,
    };
  }
}

export default new NotificacionService();

import { Request, Response } from 'express';
import prisma from '../utils/database';

// ==================== OBTENER TODAS LAS CONFIGURACIONES ====================
export const obtenerConfiguraciones = async (_req: Request, res: Response): Promise<any> => {
  try {
    const configuraciones = await prisma.configuraciones_sistema.findMany({
      where: { activo: true },
      orderBy: [
        { categoria: 'asc' },
        { clave: 'asc' }
      ]
    });

    // Transformar a estructura agrupada por categoría
    const configAgrupadas: any = {
      general: {},
      asistencia: {},
      notificaciones: {},
      seguridad: {},
      sistema: {}
    };

    configuraciones.forEach((config: any) => {
      const categoria = config.categoria;
      const claveParts = config.clave.split('.');
      const clave = claveParts.length > 1 ? claveParts[1] : claveParts[0];
      let valor: any = config.valor;

      // Convertir según el tipo
      switch (config.tipo) {
        case 'number':
          valor = parseInt(valor || '0');
          break;
        case 'boolean':
          valor = valor === 'true';
          break;
        case 'array':
          valor = valor ? valor.split(',') : [];
          break;
        default:
          valor = valor || '';
      }

      if (configAgrupadas[categoria]) {
        // Convertir snake_case a camelCase
        const claveFormatted = clave.replace(/_([a-z])/g, (_match: string, letter: string) => letter.toUpperCase());
        configAgrupadas[categoria][claveFormatted] = valor;
      }
    });

    return res.json({
      success: true,
      data: configAgrupadas,
      message: 'Configuraciones obtenidas exitosamente'
    });
  } catch (error) {
    console.error('Error obteniendo configuraciones:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// ==================== ACTUALIZAR CONFIGURACIONES ====================
export const actualizarConfiguraciones = async (req: Request, res: Response): Promise<any> => {
  try {
    const configuraciones = req.body;

    // Actualizar cada configuración
    const promesas = [];

    for (const [categoria, configs] of Object.entries(configuraciones)) {
      for (const [clave, valor] of Object.entries(configs as any)) {
        // Convertir camelCase a snake_case
        const claveDb = clave.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        const claveCompleta = `${categoria}.${claveDb}`;

        // Convertir valor a string según tipo
        let valorString: string;
        if (typeof valor === 'boolean') {
          valorString = valor.toString();
        } else if (Array.isArray(valor)) {
          valorString = valor.join(',');
        } else {
          valorString = valor?.toString() || '';
        }

        // Actualizar en la BD
        const promesa = prisma.configuraciones_sistema.updateMany({
          where: { clave: claveCompleta },
          data: {
            valor: valorString,
            updated_at: new Date()
          }
        });

        promesas.push(promesa);
      }
    }

    await Promise.all(promesas);

    return res.json({
      success: true,
      message: 'Configuraciones actualizadas exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando configuraciones:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// ==================== OBTENER CONFIGURACIÓN POR CLAVE ====================
export const obtenerConfiguracionPorClave = async (req: Request, res: Response): Promise<any> => {
  try {
    const { clave } = req.params;

    if (!clave) {
      return res.status(400).json({
        success: false,
        message: 'Clave es requerida'
      });
    }

    const configuracion = await prisma.configuraciones_sistema.findUnique({
      where: { clave }
    });

    if (!configuracion) {
      return res.status(404).json({
        success: false,
        message: 'Configuración no encontrada'
      });
    }

    // Convertir valor según tipo
    let valor: any = configuracion.valor;
    switch (configuracion.tipo) {
      case 'number':
        valor = parseInt(valor || '0');
        break;
      case 'boolean':
        valor = valor === 'true';
        break;
      case 'array':
        valor = valor ? valor.split(',') : [];
        break;
    }

    return res.json({
      success: true,
      data: {
        clave: configuracion.clave,
        valor,
        tipo: configuracion.tipo,
        categoria: configuracion.categoria,
        descripcion: configuracion.descripcion
      }
    });
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// ==================== RESTAURAR CONFIGURACIONES POR DEFECTO ====================
export const restaurarConfiguracionesDefecto = async (_req: Request, res: Response): Promise<any> => {
  try {
    // Valores por defecto
    const configuracionesDefecto = [
      { clave: 'general.nombre_instituto', valor: 'Instituto San Martín' },
      { clave: 'general.direccion', valor: 'Av. Arequipa 1234, Lima, Perú' },
      { clave: 'general.telefono', valor: '+51 1 234-5678' },
      { clave: 'general.email', valor: 'contacto@sanmartin.edu.pe' },
      { clave: 'general.sitio_web', valor: 'https://www.sanmartin.edu.pe' },
      { clave: 'general.descripcion', valor: 'Institución educativa comprometida con la excelencia académica' },
      { clave: 'asistencia.radio_tolerancia_gps', valor: '100' },
      { clave: 'asistencia.tiempo_gracia_entrada', valor: '15' },
      { clave: 'asistencia.tiempo_gracia_salida', valor: '10' },
      { clave: 'asistencia.horas_trabajo_minimas', valor: '6' },
      { clave: 'asistencia.permitir_registro_offline', valor: 'true' },
      { clave: 'asistencia.validar_ubicacion_salida', valor: 'true' },
      { clave: 'notificaciones.email_notificaciones', valor: 'true' },
      { clave: 'notificaciones.notificar_tardanzas', valor: 'true' },
      { clave: 'notificaciones.notificar_ausencias', valor: 'true' },
      { clave: 'notificaciones.recordatorio_registro', valor: 'true' },
      { clave: 'notificaciones.horarios_notificacion', valor: '08:00,17:00' },
      { clave: 'seguridad.tiempo_expiracion_sesion', valor: '480' },
      { clave: 'seguridad.intentos_login_maximos', valor: '5' },
      { clave: 'seguridad.requiere_confirmacion_email', valor: 'false' },
      { clave: 'seguridad.forzar_cambio_password_inicial', valor: 'true' },
      { clave: 'seguridad.longitud_minima_password', valor: '8' },
      { clave: 'sistema.modo_mantenimiento', valor: 'false' },
      { clave: 'sistema.mensaje_mantenimiento', valor: 'El sistema está en mantenimiento. Intente más tarde.' },
      { clave: 'sistema.backup_automatico', valor: 'true' },
      { clave: 'sistema.frecuencia_backup', valor: 'diario' }
    ];

    // Actualizar cada configuración
    for (const config of configuracionesDefecto) {
      await prisma.configuraciones_sistema.updateMany({
        where: { clave: config.clave },
        data: {
          valor: config.valor,
          updated_at: new Date()
        }
      });
    }

    return res.json({
      success: true,
      message: 'Configuraciones restauradas a valores por defecto'
    });
  } catch (error) {
    console.error('Error restaurando configuraciones:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};


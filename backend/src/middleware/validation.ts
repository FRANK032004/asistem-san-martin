import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
// import { ValidationError } from '../utils/app-error'; // Removido temporalmente
import { ResponseFormatter } from '../utils/response-formatter';

/**
 * Esquemas de Validación Centralizados
 * Define reglas de validación consistentes para todo el sistema
 */

// Validaciones base reutilizables
const commonValidations = {
  // UUID válido
  uuid: Joi.string().uuid().required().messages({
    'string.uuid': 'Debe ser un UUID válido',
    'any.required': 'El ID es requerido'
  }),

  // DNI peruano válido
  dni: Joi.string().pattern(/^[0-9]{8}$/).required().messages({
    'string.pattern.base': 'DNI debe tener exactamente 8 dígitos',
    'any.required': 'DNI es requerido'
  }),

  // Email válido
  email: Joi.string().email().max(150).required().messages({
    'string.email': 'Email debe tener formato válido',
    'string.max': 'Email no puede exceder 150 caracteres',
    'any.required': 'Email es requerido'
  }),

  // Contraseña segura
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required().messages({
    'string.min': 'Contraseña debe tener al menos 8 caracteres',
    'string.pattern.base': 'Contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial',
    'any.required': 'Contraseña es requerida'
  }),

  // Nombres y apellidos
  nombre: Joi.string().min(2).max(100).pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).required().messages({
    'string.min': 'Nombre debe tener al menos 2 caracteres',
    'string.max': 'Nombre no puede exceder 100 caracteres',
    'string.pattern.base': 'Nombre solo puede contener letras y espacios',
    'any.required': 'Nombre es requerido'
  }),

  // Hora en formato HH:MM
  hora: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
    'string.pattern.base': 'Hora debe tener formato HH:MM (24 horas)',
    'any.required': 'Hora es requerida'
  }),

  // Coordenadas GPS
  latitud: Joi.number().min(-90).max(90).required().messages({
    'number.min': 'Latitud debe estar entre -90 y 90',
    'number.max': 'Latitud debe estar entre -90 y 90',
    'any.required': 'Latitud es requerida'
  }),

  longitud: Joi.number().min(-180).max(180).required().messages({
    'number.min': 'Longitud debe estar entre -180 y 180',
    'number.max': 'Longitud debe estar entre -180 y 180',
    'any.required': 'Longitud es requerida'
  }),

  // Día de la semana (1-7)
  dia_semana: Joi.number().integer().min(1).max(7).required().messages({
    'number.base': 'Día de la semana debe ser un número',
    'number.integer': 'Día de la semana debe ser un número entero',
    'number.min': 'Día de la semana debe estar entre 1 (Lunes) y 7 (Domingo)',
    'number.max': 'Día de la semana debe estar entre 1 (Lunes) y 7 (Domingo)',
    'any.required': 'Día de la semana es requerido'
  })
};

/**
 * Esquemas específicos por módulo
 */
export const validationSchemas = {
  // Autenticación
  login: Joi.object({
    email: commonValidations.email,
    password: Joi.string().required().messages({
      'any.required': 'Contraseña es requerida'
    })
  }),

  // Ubicaciones GPS
  createUbicacion: Joi.object({
    nombre: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Nombre debe tener al menos 2 caracteres',
      'string.max': 'Nombre no puede exceder 100 caracteres',
      'any.required': 'Nombre es requerido'
    }),
    descripcion: Joi.string().max(500).optional().messages({
      'string.max': 'Descripción no puede exceder 500 caracteres'
    }),
    latitud: commonValidations.latitud,
    longitud: commonValidations.longitud,
    radio: Joi.number().integer().min(10).max(1000).required().messages({
      'number.base': 'Radio debe ser un número',
      'number.integer': 'Radio debe ser un número entero',
      'number.min': 'Radio mínimo es 10 metros',
      'number.max': 'Radio máximo es 1000 metros',
      'any.required': 'Radio es requerido'
    }),
    activo: Joi.boolean().optional()
  }),

  // Horarios
  createHorario: Joi.object({
    docenteId: commonValidations.uuid,
    area_id: Joi.number().integer().positive().required().messages({
      'number.base': 'Área debe ser un número',
      'number.integer': 'Área debe ser un número entero',
      'number.positive': 'Área debe ser positivo',
      'any.required': 'Área es requerida'
    }),
    dia_semana: commonValidations.dia_semana,
    hora_inicio: commonValidations.hora,
    hora_fin: commonValidations.hora,
    tipo_clase: Joi.string().valid('TEORICA', 'PRACTICA', 'LABORATORIO', 'SEMINARIO', 'TALLER').optional().messages({
      'any.only': 'Tipo de clase debe ser: TEORICA, PRACTICA, LABORATORIO, SEMINARIO o TALLER'
    }),
    horas_semana: Joi.number().min(0).max(168).required().messages({
      'number.min': 'Horas semanales no puede ser negativo',
      'number.max': 'Horas semanales no puede exceder 168 (24h x 7 días)',
      'any.required': 'Horas semanales es requerido'
    }),
    activo: Joi.boolean().optional()
  }).custom((value, helpers) => {
    // Validación personalizada: hora inicio < hora fin
    const inicio = new Date(`2000-01-01T${value.hora_inicio}:00`);
    const fin = new Date(`2000-01-01T${value.hora_fin}:00`);
    
    if (inicio >= fin) {
      return helpers.error('custom.horaInvalida');
    }
    
    return value;
  }).messages({
    'custom.horaInvalida': 'Hora de inicio debe ser menor que hora de fin'
  })
};

/**
 * Middleware de validación
 */
export const validate = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Mostrar todos los errores
      stripUnknown: true, // Remover campos no definidos en el schema
      convert: true // Convertir tipos automáticamente
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      const response = ResponseFormatter.validation(validationErrors);
      res.status(400).json(response);
      return;
    }

    // Reemplazar el objeto original con el valor validado y sanitizado
    req[property] = value;
    next();
  };
};

/**
 * Middleware de sanitización de entrada
 */
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  // Sanitizar strings en body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitizar query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  next();
};

/**
 * Función auxiliar para sanitizar objeto
 */
const sanitizeObject = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    
    return sanitized;
  }

  if (typeof obj === 'string') {
    // Remover scripts maliciosos básicos
    return obj
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  }

  return obj;
};

/**
 * Middleware para manejar errores de validación de express-validator
 */
export const handleValidationErrors = (_req: Request, _res: Response, next: NextFunction): void => {
  // Esta función puede estar vacía por ahora o implementar lógica personalizada
  // Se mantiene para compatibilidad con las rutas existentes
  next();
};

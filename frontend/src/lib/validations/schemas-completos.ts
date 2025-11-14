/**
 * SCHEMAS DE VALIDACIÓN COMPLETOS - SISTEMA DE ASISTENCIA SAN MARTÍN
 * 
 * Este archivo contiene todos los schemas Zod listos para implementar
 * en los formularios del sistema. Copiar y pegar según necesidad.
 * 
 * Fecha: 29/01/2025
 * Versión: 1.0
 */

import { z } from 'zod';

// ============================================================================
// SCHEMAS DE AUTENTICACIÓN
// ============================================================================

/**
 * Schema de Login
 * Usado en: frontend/src/app/login/page.tsx
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es obligatorio')
    .email('Ingrese un correo electrónico válido')
    .toLowerCase(),
  
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginForm = z.infer<typeof loginSchema>;

// ============================================================================
// SCHEMAS DE USUARIO
// ============================================================================

/**
 * Schema de Crear Usuario
 * Usado en: frontend/src/app/admin/usuarios/crear/page.tsx
 */
export const crearUsuarioSchema = z.object({
  nombres: z
    .string()
    .min(1, 'Los nombres son obligatorios')
    .min(2, 'Los nombres deben tener al menos 2 caracteres')
    .max(50, 'Los nombres no pueden exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Los nombres solo pueden contener letras')
    .transform((val) => val.trim().replace(/\s+/g, ' ')), // Normalizar espacios
  
  apellidos: z
    .string()
    .min(1, 'Los apellidos son obligatorios')
    .min(2, 'Los apellidos deben tener al menos 2 caracteres')
    .max(50, 'Los apellidos no pueden exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Los apellidos solo pueden contener letras')
    .transform((val) => val.trim().replace(/\s+/g, ' ')),
  
  email: z
    .string()
    .min(1, 'El email es obligatorio')
    .email('Ingrese un email válido')
    .endsWith('@sanmartin.edu.pe', 'Debe usar el dominio institucional @sanmartin.edu.pe')
    .toLowerCase()
    .transform((val) => val.trim()),
  
  dni: z
    .string()
    .min(1, 'El DNI es obligatorio')
    .length(8, 'El DNI debe tener exactamente 8 dígitos')
    .regex(/^\d{8}$/, 'El DNI solo puede contener números'),
  
  telefono: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === '' || /^9\d{8}$/.test(val),
      'El teléfono debe tener 9 dígitos y comenzar con 9'
    ),
  
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  
  confirmPassword: z
    .string()
    .min(1, 'Debe confirmar la contraseña'),
  
  rol: z.enum(['ADMIN', 'DOCENTE'], {
    message: 'Seleccione un rol válido',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export type CrearUsuarioForm = z.infer<typeof crearUsuarioSchema>;

/**
 * Schema de Editar Usuario
 * Usado en: frontend/src/app/admin/usuarios/[id]/editar/page.tsx
 */
export const editarUsuarioSchema = z.object({
  nombres: z
    .string()
    .min(2, 'Los nombres deben tener al menos 2 caracteres')
    .max(50, 'Los nombres no pueden exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Los nombres solo pueden contener letras')
    .transform((val) => val.trim().replace(/\s+/g, ' ')),
  
  apellidos: z
    .string()
    .min(2, 'Los apellidos deben tener al menos 2 caracteres')
    .max(50, 'Los apellidos no pueden exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Los apellidos solo pueden contener letras')
    .transform((val) => val.trim().replace(/\s+/g, ' ')),
  
  email: z
    .string()
    .email('Ingrese un email válido')
    .endsWith('@sanmartin.edu.pe', 'Debe usar el dominio institucional')
    .toLowerCase()
    .transform((val) => val.trim()),
  
  telefono: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === '' || /^9\d{8}$/.test(val),
      'El teléfono debe tener 9 dígitos y comenzar con 9'
    ),
  
  rol: z.enum(['ADMIN', 'DOCENTE']),
});

export type EditarUsuarioForm = z.infer<typeof editarUsuarioSchema>;

// ============================================================================
// SCHEMAS DE DOCENTE
// ============================================================================

/**
 * Schema de Crear Docente (MEJORADO)
 * Usado en: frontend/src/app/admin/docentes/crear/page.tsx
 */
export const crearDocenteSchema = z.object({
  // Información Personal
  nombres: z
    .string()
    .min(1, 'Los nombres son obligatorios')
    .min(2, 'Los nombres deben tener al menos 2 caracteres')
    .max(50, 'Los nombres no pueden exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Los nombres solo pueden contener letras')
    .transform((val) => val.trim().replace(/\s+/g, ' ')),
  
  apellidos: z
    .string()
    .min(1, 'Los apellidos son obligatorios')
    .min(2, 'Los apellidos deben tener al menos 2 caracteres')
    .max(50, 'Los apellidos no pueden exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Los apellidos solo pueden contener letras')
    .transform((val) => val.trim().replace(/\s+/g, ' ')),
  
  email: z
    .string()
    .min(1, 'El email es obligatorio')
    .email('Ingrese un email válido')
    .endsWith('@sanmartin.edu.pe', 'Debe usar el dominio institucional')
    .toLowerCase()
    .transform((val) => val.trim()),
  
  dni: z
    .string()
    .min(1, 'El DNI es obligatorio')
    .length(8, 'El DNI debe tener exactamente 8 dígitos')
    .regex(/^\d{8}$/, 'El DNI solo puede contener números'),
  
  telefono: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === '' || /^9\d{8}$/.test(val),
      'El teléfono debe tener 9 dígitos y comenzar con 9'
    ),
  
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  
  confirmPassword: z
    .string()
    .min(1, 'Debe confirmar la contraseña'),
  
  // Información Profesional
  codigoDocente: z
    .string()
    .min(1, 'El código docente es obligatorio')
    .min(3, 'El código debe tener al menos 3 caracteres')
    .max(20, 'El código no puede exceder 20 caracteres')
    .regex(/^[A-Z0-9]+$/, 'El código solo puede contener letras mayúsculas y números')
    .transform((val) => val.toUpperCase()),
  
  areaId: z
    .string()
    .min(1, 'Debe seleccionar un área')
    .uuid('Seleccione un área válida'),
  
  especialidad: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === '' || val.length >= 5,
      'La especialidad debe tener al menos 5 caracteres'
    ),
  
  observaciones: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === '' || val.length <= 500,
      'Las observaciones no pueden exceder 500 caracteres'
    ),
  
  estado: z.enum(['ACTIVO', 'INACTIVO', 'LICENCIA'], {
    message: 'Seleccione un estado válido',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export type CrearDocenteForm = z.infer<typeof crearDocenteSchema>;

/**
 * Schema de Editar Perfil Docente
 * Usado en: frontend/src/app/docente/perfil/page.tsx
 */
export const editarPerfilDocenteSchema = z.object({
  telefono: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === '' || /^9\d{8}$/.test(val),
      'El teléfono debe tener 9 dígitos y comenzar con 9'
    ),
  
  direccion: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === '' || val.length >= 10,
      'La dirección debe tener al menos 10 caracteres'
    )
    .refine(
      (val) => !val || val === '' || val.length <= 200,
      'La dirección no puede exceder 200 caracteres'
    ),
  
  contactoEmergencia: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === '' || val.length >= 5,
      'El nombre del contacto debe tener al menos 5 caracteres'
    )
    .refine(
      (val) => !val || val === '' || /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(val),
      'El contacto solo puede contener letras'
    ),
  
  telefonoEmergencia: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === '' || /^9\d{8}$/.test(val),
      'El teléfono de emergencia debe tener 9 dígitos y comenzar con 9'
    ),
});

export type EditarPerfilDocenteForm = z.infer<typeof editarPerfilDocenteSchema>;

// ============================================================================
// SCHEMAS DE JUSTIFICACIONES
// ============================================================================

/**
 * Schema de Crear Justificación
 * Usado en: frontend/src/app/docente/justificaciones/page.tsx
 * Actualizado para coincidir con backend FASE 1
 */
export const crearJustificacionSchema = z.object({
  fechaInicio: z
    .string()
    .min(1, 'La fecha de inicio es obligatoria')
    .refine((date) => {
      const selected = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selected <= today;
    }, 'La fecha de inicio no puede ser futura')
    .refine((date) => {
      const selected = new Date(date);
      const maxDaysAgo = new Date();
      maxDaysAgo.setDate(maxDaysAgo.getDate() - 30);
      maxDaysAgo.setHours(0, 0, 0, 0);
      return selected >= maxDaysAgo;
    }, 'Solo puede justificar ausencias de los últimos 30 días'),
  
  fechaFin: z
    .string()
    .min(1, 'La fecha de fin es obligatoria')
    .refine((date) => {
      const selected = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selected <= today;
    }, 'La fecha de fin no puede ser futura'),
  
  tipo: z.enum([
    'MEDICA',
    'PERSONAL',
    'FAMILIAR',
    'CAPACITACION',
    'OTRO',
  ], {
    message: 'Debe seleccionar un tipo válido',
  }),
  
  motivo: z
    .string()
    .min(1, 'El motivo es obligatorio')
    .min(20, 'El motivo debe tener al menos 20 caracteres para ser válido')
    .max(1000, 'El motivo no puede exceder 1000 caracteres')
    .refine(
      (val) => val.trim().split(/\s+/).length >= 5,
      'El motivo debe contener al menos 5 palabras'
    )
    .transform((val) => val.trim().replace(/\s+/g, ' ')),
  
  evidenciaUrl: z
    .string()
    .optional(),
  
  afectaPago: z
    .boolean()
    .optional(),
}).refine((data) => {
  const inicio = new Date(data.fechaInicio);
  const fin = new Date(data.fechaFin);
  return inicio <= fin;
}, {
  message: 'La fecha de fin debe ser posterior o igual a la fecha de inicio',
  path: ['fechaFin'],
}).refine((data) => {
  const inicio = new Date(data.fechaInicio);
  const fin = new Date(data.fechaFin);
  const diffDays = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 30;
}, {
  message: 'El rango de fechas no puede exceder 30 días',
  path: ['fechaFin'],
});

export type CrearJustificacionForm = z.infer<typeof crearJustificacionSchema>;

// ============================================================================
// SCHEMAS DE CONFIGURACIÓN
// ============================================================================

/**
 * Schema de Configuración General del Sistema
 * Usado en: frontend/src/app/admin/configuraciones/page.tsx
 */
export const configuracionGeneralSchema = z.object({
  nombreInstituto: z
    .string()
    .min(1, 'El nombre de la institución es obligatorio')
    .min(5, 'El nombre debe tener al menos 5 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .transform((val) => val.trim()),
  
  direccion: z
    .string()
    .min(1, 'La dirección es obligatoria')
    .min(10, 'La dirección debe tener al menos 10 caracteres')
    .max(200, 'La dirección no puede exceder 200 caracteres')
    .transform((val) => val.trim()),
  
  email: z
    .string()
    .min(1, 'El email es obligatorio')
    .email('Ingrese un email válido')
    .toLowerCase()
    .transform((val) => val.trim()),
  
  telefono: z
    .string()
    .min(1, 'El teléfono es obligatorio')
    .regex(/^9\d{8}$/, 'El teléfono debe tener 9 dígitos y comenzar con 9'),
  
  sitioWeb: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === '' || /^https?:\/\/.+\..+/.test(val),
      'Ingrese una URL válida (ej: https://www.instituto.edu.pe)'
    ),
  
  descripcion: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === '' || val.length >= 10,
      'La descripción debe tener al menos 10 caracteres'
    ),
  
  logoUrl: z.string().optional(),
});

export type ConfiguracionGeneralForm = z.infer<typeof configuracionGeneralSchema>;

/**
 * Schema de Configuración de Horarios
 */
export const configuracionHorariosSchema = z.object({
  horaEntrada: z
    .string()
    .min(1, 'La hora de entrada es obligatoria')
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido. Use HH:mm (ej: 08:00)'),
  
  horaSalida: z
    .string()
    .min(1, 'La hora de salida es obligatoria')
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido. Use HH:mm (ej: 17:00)'),
  
  toleranciaMinutos: z
    .number()
    .min(0, 'La tolerancia no puede ser negativa')
    .max(60, 'La tolerancia no puede exceder 60 minutos')
    .int('La tolerancia debe ser un número entero'),
  
  horasLaborales: z
    .number()
    .min(1, 'Las horas laborales deben ser al menos 1')
    .max(12, 'Las horas laborales no pueden exceder 12 horas')
    .int('Las horas laborales deben ser un número entero'),
}).refine((data) => {
  const [horaInicioH, horaInicioM] = data.horaEntrada.split(':').map(Number);
  const [horaFinH, horaFinM] = data.horaSalida.split(':').map(Number);
  const inicioMinutos = horaInicioH * 60 + horaInicioM;
  const finMinutos = horaFinH * 60 + horaFinM;
  return finMinutos > inicioMinutos;
}, {
  message: 'La hora de salida debe ser posterior a la hora de entrada',
  path: ['horaSalida'],
});

export type ConfiguracionHorariosForm = z.infer<typeof configuracionHorariosSchema>;

/**
 * Schema de Configuración GPS
 */
export const configuracionGPSSchema = z.object({
  latitud: z
    .number()
    .min(-90, 'La latitud debe estar entre -90 y 90')
    .max(90, 'La latitud debe estar entre -90 y 90'),
  
  longitud: z
    .number()
    .min(-180, 'La longitud debe estar entre -180 y 180')
    .max(180, 'La longitud debe estar entre -180 y 180'),
  
  radioGPS: z
    .number()
    .min(10, 'El radio debe ser al menos 10 metros')
    .max(1000, 'El radio no puede exceder 1000 metros')
    .int('El radio debe ser un número entero'),
  
  habilitarGPS: z.boolean(),
});

export type ConfiguracionGPSForm = z.infer<typeof configuracionGPSSchema>;

/**
 * Schema de Configuración de Asistencia
 * Usado en: frontend/src/app/admin/configuraciones/page.tsx
 */
export const configuracionAsistenciaSchema = z.object({
  radioToleranciaGPS: z
    .number()
    .min(10, 'El radio GPS debe ser al menos 10 metros')
    .max(1000, 'El radio GPS no puede exceder 1000 metros')
    .int('El radio GPS debe ser un número entero'),
  
  tiempoGraciaEntrada: z
    .number()
    .min(0, 'El tiempo de gracia no puede ser negativo')
    .max(60, 'El tiempo de gracia no puede exceder 60 minutos')
    .int('El tiempo de gracia debe ser un número entero'),
  
  tiempoGraciaSalida: z
    .number()
    .min(0, 'El tiempo de gracia no puede ser negativo')
    .max(60, 'El tiempo de gracia no puede exceder 60 minutos')
    .int('El tiempo de gracia debe ser un número entero'),
  
  horasTrabajoMinimas: z
    .number()
    .min(1, 'Las horas mínimas deben ser al menos 1')
    .max(12, 'Las horas mínimas no pueden exceder 12')
    .int('Las horas mínimas deben ser un número entero'),
  
  permitirRegistroOffline: z.boolean(),
  
  validarUbicacionSalida: z.boolean(),
});

export type ConfiguracionAsistenciaForm = z.infer<typeof configuracionAsistenciaSchema>;

// ============================================================================
// SCHEMAS DE REPORTES
// ============================================================================

/**
 * Schema de Filtros de Reportes
 * Usado en: frontend/src/app/admin/reportes/page.tsx
 */
export const filtrosReporteSchema = z.object({
  fechaInicio: z
    .string()
    .min(1, 'La fecha de inicio es obligatoria')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  
  fechaFin: z
    .string()
    .min(1, 'La fecha de fin es obligatoria')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  
  docenteId: z
    .string()
    .optional(),
  
  areaId: z
    .string()
    .optional(),
  
  estado: z
    .enum(['PRESENTE', 'AUSENTE', 'JUSTIFICADO', 'TARDANZA', 'TODOS'])
    .optional(),
}).refine((data) => {
  const inicio = new Date(data.fechaInicio);
  const fin = new Date(data.fechaFin);
  return fin >= inicio;
}, {
  message: 'La fecha de fin debe ser igual o posterior a la fecha de inicio',
  path: ['fechaFin'],
}).refine((data) => {
  const inicio = new Date(data.fechaInicio);
  const fin = new Date(data.fechaFin);
  const diferenciaDias = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24);
  return diferenciaDias <= 365;
}, {
  message: 'El rango de fechas no puede exceder 1 año (365 días)',
  path: ['fechaFin'],
});

export type FiltrosReporteForm = z.infer<typeof filtrosReporteSchema>;

// ============================================================================
// SCHEMAS DE ASISTENCIA
// ============================================================================

/**
 * Schema de Registro Manual de Asistencia
 * Usado en: frontend/src/app/admin/asistencias/page.tsx
 */
export const registroAsistenciaManualSchema = z.object({
  docenteId: z
    .string()
    .min(1, 'Debe seleccionar un docente')
    .uuid('Seleccione un docente válido'),
  
  fecha: z
    .string()
    .min(1, 'La fecha es obligatoria')
    .refine((date) => {
      const selected = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const maxDaysAgo = new Date();
      maxDaysAgo.setDate(maxDaysAgo.getDate() - 30);
      return selected <= today && selected >= maxDaysAgo;
    }, 'La fecha debe estar entre hoy y 30 días atrás'),
  
  horaEntrada: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)'),
  
  horaSalida: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === '' || /^([01]\d|2[0-3]):([0-5]\d)$/.test(val),
      'Formato de hora inválido (HH:mm)'
    ),
  
  observaciones: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === '' || val.length <= 200,
      'Las observaciones no pueden exceder 200 caracteres'
    ),
}).refine((data) => {
  if (data.horaSalida && data.horaSalida !== '') {
    const [entradaH, entradaM] = data.horaEntrada.split(':').map(Number);
    const [salidaH, salidaM] = data.horaSalida.split(':').map(Number);
    const entradaMinutos = entradaH * 60 + entradaM;
    const salidaMinutos = salidaH * 60 + salidaM;
    return salidaMinutos > entradaMinutos;
  }
  return true;
}, {
  message: 'La hora de salida debe ser posterior a la hora de entrada',
  path: ['horaSalida'],
});

export type RegistroAsistenciaManualForm = z.infer<typeof registroAsistenciaManualSchema>;

// ============================================================================
// UTILIDADES DE VALIDACIÓN
// ============================================================================

/**
 * Validador de DNI peruano (verifica dígito verificador)
 */
export const validarDNIPeru = (dni: string): boolean => {
  if (!/^\d{8}$/.test(dni)) return false;
  
  // Algoritmo de validación de DNI peruano
  const factores = [3, 2, 7, 6, 5, 4, 3, 2];
  const digitos = dni.split('').map(Number);
  const suma = digitos.slice(0, 7).reduce((acc, val, idx) => acc + val * factores[idx], 0);
  const resto = suma % 11;
  const digitoVerificador = resto === 0 ? 0 : 11 - resto;
  
  return digitoVerificador === digitos[7];
};

/**
 * Validador de email institucional
 */
export const validarEmailInstitucional = (email: string): boolean => {
  return /^[a-z0-9._%+-]+@sanmartin\.edu\.pe$/.test(email.toLowerCase());
};

/**
 * Validador de teléfono celular peruano
 */
export const validarTelefonoPeru = (telefono: string): boolean => {
  return /^9\d{8}$/.test(telefono);
};

/**
 * Validador de contraseña fuerte
 */
export const validarPasswordFuerte = (password: string): {
  valida: boolean;
  errores: string[];
} => {
  const errores: string[] = [];
  
  if (password.length < 8) {
    errores.push('Debe tener al menos 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errores.push('Debe contener al menos una mayúscula');
  }
  if (!/[a-z]/.test(password)) {
    errores.push('Debe contener al menos una minúscula');
  }
  if (!/[0-9]/.test(password)) {
    errores.push('Debe contener al menos un número');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errores.push('Se recomienda incluir un carácter especial');
  }
  
  return {
    valida: errores.length === 0,
    errores,
  };
};

/**
 * Normalizar texto (eliminar espacios extras, capitalizar)
 */
export const normalizarTexto = (texto: string): string => {
  return texto
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
    .join(' ');
};

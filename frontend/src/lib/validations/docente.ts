import { z } from 'zod';

// ========== ESQUEMAS DE VALIDACIÓN ENTERPRISE - DOCENTES ==========

// Validación para crear docente
export const crearDocenteSchema = z.object({
  // Datos del usuario
  nombres: z
    .string()
    .min(2, 'Los nombres deben tener al menos 2 caracteres')
    .max(50, 'Los nombres no pueden exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Los nombres solo pueden contener letras y espacios'),
  
  apellidos: z
    .string()
    .min(2, 'Los apellidos deben tener al menos 2 caracteres')
    .max(50, 'Los apellidos no pueden exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Los apellidos solo pueden contener letras y espacios'),
  
  email: z
    .string()
    .email('Debe ser un email válido')
    .endsWith('@sanmartin.edu.pe', 'El email debe terminar en @sanmartin.edu.pe'),
  
  dni: z
    .string()
    .length(8, 'El DNI debe tener exactamente 8 dígitos')
    .regex(/^\d{8}$/, 'El DNI solo debe contener números'),
  
  telefono: z
    .string()
    .length(9, 'El teléfono debe tener exactamente 9 dígitos')
    .regex(/^9\d{8}$/, 'El teléfono debe empezar con 9 y tener 9 dígitos')
    .optional()
    .or(z.literal('')),
  
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres'),
  
  confirmPassword: z
    .string()
    .min(8, 'Confirme la contraseña'),
  
  // Datos específicos del docente
  codigoDocente: z
    .string()
    .min(3, 'El código debe tener al menos 3 caracteres')
    .max(20, 'El código no puede exceder 20 caracteres')
    .regex(/^[A-Z0-9]+$/, 'El código solo puede contener letras mayúsculas y números'),
  
  areaId: z
    .string()
    .min(1, 'Debe seleccionar un área'),
  
  especialidad: z
    .string()
    .min(2, 'La especialidad debe tener al menos 2 caracteres')
    .max(100, 'La especialidad no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
  
  observaciones: z
    .string()
    .max(500, 'Las observaciones no pueden exceder 500 caracteres')
    .optional()
    .or(z.literal('')),
  
  estado: z.enum(['ACTIVO', 'INACTIVO', 'LICENCIA'])
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

// Validación para editar docente
export const editarDocenteSchema = z.object({
  // Datos del usuario (todos opcionales para edición)
  nombres: z
    .string()
    .min(2, 'Los nombres deben tener al menos 2 caracteres')
    .max(50, 'Los nombres no pueden exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Los nombres solo pueden contener letras y espacios')
    .optional(),
  
  apellidos: z
    .string()
    .min(2, 'Los apellidos deben tener al menos 2 caracteres')
    .max(50, 'Los apellidos no pueden exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Los apellidos solo pueden contener letras y espacios')
    .optional(),
  
  email: z
    .string()
    .email('Debe ser un email válido')
    .endsWith('@sanmartin.edu.pe', 'El email debe terminar en @sanmartin.edu.pe')
    .optional(),
  
  dni: z
    .string()
    .length(8, 'El DNI debe tener exactamente 8 dígitos')
    .regex(/^\d{8}$/, 'El DNI solo debe contener números')
    .optional(),
  
  telefono: z
    .string()
    .length(9, 'El teléfono debe tener exactamente 9 dígitos')
    .regex(/^9\d{8}$/, 'El teléfono debe empezar con 9 y tener 9 dígitos')
    .optional()
    .or(z.literal('')),
  
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
  
  confirmPassword: z
    .string()
    .optional()
    .or(z.literal('')),
  
  // Datos específicos del docente
  codigoDocente: z
    .string()
    .min(3, 'El código debe tener al menos 3 caracteres')
    .max(20, 'El código no puede exceder 20 caracteres')
    .regex(/^[A-Z0-9]+$/, 'El código solo puede contener letras mayúsculas y números')
    .optional(),
  
  areaId: z
    .string()
    .min(1, 'Debe seleccionar un área')
    .optional(),
  
  especialidad: z
    .string()
    .min(2, 'La especialidad debe tener al menos 2 caracteres')
    .max(100, 'La especialidad no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
  
  observaciones: z
    .string()
    .max(500, 'Las observaciones no pueden exceder 500 caracteres')
    .optional()
    .or(z.literal('')),
  
  estado: z.enum(['ACTIVO', 'INACTIVO', 'LICENCIA']).optional(),
  
  activo: z.boolean().optional()
}).refine((data) => {
  // Solo validar contraseñas si se está intentando cambiar
  if (data.password || data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

// Validación para filtros de búsqueda
export const filtrosDocenteSchema = z.object({
  search: z.string().optional(),
  areaId: z.string().optional(),
  estado: z.enum(['ACTIVO', 'INACTIVO', 'LICENCIA']).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional()
});

// Tipos TypeScript inferidos de los esquemas
export type CrearDocenteForm = z.infer<typeof crearDocenteSchema>;
export type EditarDocenteForm = z.infer<typeof editarDocenteSchema>;
export type FiltrosDocenteForm = z.infer<typeof filtrosDocenteSchema>;

// Esquemas para validaciones específicas
export const codigoDocenteSchema = z
  .string()
  .min(3, 'El código debe tener al menos 3 caracteres')
  .max(20, 'El código no puede exceder 20 caracteres')
  .regex(/^[A-Z0-9]+$/, 'El código solo puede contener letras mayúsculas y números');

export const estadoDocenteSchema = z.enum(['ACTIVO', 'INACTIVO', 'LICENCIA']);

// Validaciones para campos individuales (útil para validación en tiempo real)
export const validaciones = {
  nombres: (value: string) => crearDocenteSchema.shape.nombres.safeParse(value),
  apellidos: (value: string) => crearDocenteSchema.shape.apellidos.safeParse(value),
  email: (value: string) => crearDocenteSchema.shape.email.safeParse(value),
  dni: (value: string) => crearDocenteSchema.shape.dni.safeParse(value),
  telefono: (value: string) => crearDocenteSchema.shape.telefono.safeParse(value),
  password: (value: string) => crearDocenteSchema.shape.password.safeParse(value),
  codigoDocente: (value: string) => crearDocenteSchema.shape.codigoDocente.safeParse(value),
  areaId: (value: string) => crearDocenteSchema.shape.areaId.safeParse(value),
  especialidad: (value: string) => crearDocenteSchema.shape.especialidad.safeParse(value),
  observaciones: (value: string) => crearDocenteSchema.shape.observaciones.safeParse(value)
};
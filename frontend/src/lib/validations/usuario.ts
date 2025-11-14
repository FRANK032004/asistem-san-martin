import { z } from 'zod';

// Esquema base para usuario
export const usuarioSchema = z.object({
  nombres: z
    .string()
    .min(2, 'Los nombres deben tener al menos 2 caracteres')
    .max(50, 'Los nombres no pueden exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo se permiten letras y espacios'),
  
  apellidos: z
    .string()
    .min(2, 'Los apellidos deben tener al menos 2 caracteres')
    .max(50, 'Los apellidos no pueden exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo se permiten letras y espacios'),
  
  email: z
    .string()
    .email('Formato de email inválido')
    .endsWith('@sanmartin.edu.pe', 'Debe usar el dominio institucional @sanmartin.edu.pe'),
  
  dni: z
    .string()
    .length(8, 'El DNI debe tener exactamente 8 dígitos')
    .regex(/^\d{8}$/, 'El DNI solo debe contener números'),
  
  telefono: z
    .string()
    .optional()
    .refine((val) => !val || /^9\d{8}$/.test(val), {
      message: 'El teléfono debe tener 9 dígitos y empezar con 9'
    }),
  
  rol: z.enum(['ADMIN', 'DOCENTE'], {
    message: 'Seleccione un rol válido'
  })
});

// Esquema para crear usuario (incluye contraseñas)
export const crearUsuarioSchema = usuarioSchema.extend({
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(50, 'La contraseña no puede exceder 50 caracteres'),
  
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

// Esquema para editar usuario (sin contraseñas obligatorias)
export const editarUsuarioSchema = usuarioSchema.extend({
  activo: z.boolean(),
  
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 8, {
      message: 'La contraseña debe tener al menos 8 caracteres'
    }),
  
  confirmPassword: z.string().optional()
}).refine((data) => {
  if (data.password || data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

// Tipos TypeScript derivados de los esquemas
export type CrearUsuarioForm = z.infer<typeof crearUsuarioSchema>;
export type EditarUsuarioForm = z.infer<typeof editarUsuarioSchema>;
export type UsuarioForm = z.infer<typeof usuarioSchema>;

// Esquema para filtros de búsqueda
export const filtrosUsuarioSchema = z.object({
  search: z.string().optional(),
  rol: z.enum(['', 'ADMIN', 'DOCENTE']).optional(),
  estado: z.enum(['', 'ACTIVO', 'INACTIVO']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(5).max(100).default(10)
});

export type FiltrosUsuario = z.infer<typeof filtrosUsuarioSchema>;
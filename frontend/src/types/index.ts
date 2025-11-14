// Tipos para el sistema de asistencias

import type { Usuario } from '@/services/usuario-api.service';

// Tipos de roles
export interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
}

// Tipos de autenticación
export interface AuthUser {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  rol: Rol;
  activo: boolean;
  token?: string;
  docente?: {
    id: string;
    codigoDocente: string;
    area?: {
      id: number;
      nombre: string;
    };
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

// Tipos de la base de datos
// NOTA: Definición de Usuario movida a /services/usuario-api.service.ts para evitar duplicación
// export interface Usuario {
//   id: string;
//   dni: string;
//   nombres: string;
//   apellidos: string;
//   email: string;
//   telefono?: string;
//   rolId: number;
//   activo: boolean;
//   ultimoAcceso?: Date;
// }

export interface Docente {
  id: string;
  usuarioId: string;
  areaId?: number;
  codigoDocente?: string;
  fechaIngreso?: Date;
  horarioEntrada: Date;
  horarioSalida: Date;
  sueldo?: number;
  observaciones?: string;
  usuario: Usuario;
  area?: Area;
}

export interface Area {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface Asistencia {
  id: string;
  docenteId: string;
  fecha: Date;
  horaEntrada?: Date;
  horaSalida?: Date;
  latitudEntrada?: number;
  longitudEntrada?: number;
  latitudSalida?: number;
  longitudSalida?: number;
  ubicacionEntradaId?: number;
  ubicacionSalidaId?: number;
  estado: string;
  observaciones?: string;
  docente: Docente;
}

export interface UbicacionPermitida {
  id: number;
  nombre: string;
  descripcion?: string;
  latitud: number;
  longitud: number;
  radioMetros: number;
  activo: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

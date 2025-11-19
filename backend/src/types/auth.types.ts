import { Request } from 'express';

export interface Usuario {
  id: string; // UUID
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string | null;
  rol: 'admin' | 'docente' | 'supervisor';
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

export type AuthRequest = Request &  {
  usuario?: {
    id: string;
    email: string;
    rol: string;
    rol_id: number;
    isDocente: boolean;
    docenteId?: string;
  };
}

export interface JWTPayload {
  userId: string; // UUID
  email: string;
  rol: string;
  rol_id: number;
  isDocente: boolean;
  docenteId?: string; // Opcional
  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string | null;
  activo: boolean;
  roles: {
    id: number;
    nombre: string;
    descripcion?: string | null;
  };
  docente?: {
    id: string;
    codigo_docente: string | null;
    areas?: {
      id: number;
      nombre: string;
    } | undefined;
  } | undefined;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    usuarios: UserResponse;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
  timestamp?: string;
}

// ========================================
// TIPOS PARA AUTENTICACIÓN
// ========================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  dni: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  password: string;
  rol_id: number;
  area_id?: number;
  codigo_docente?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: UserResponse;
    token: string;
    refreshToken?: string;
  };
}

export interface UserResponse {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  rol: {
    id: number;
    nombre: string;
    descripcion?: string;
  };
  activo: boolean;
  ultimo_acceso?: string;
  docente?: {
    id: string;
    codigo_docente?: string;
    area?: {
      id: number;
      nombre: string;
    };
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  rol: string;
  rol_id: number;
  isDocente: boolean;
  docenteId?: string;
  iat?: number;
  exp?: number;
}

// ========================================
// TIPOS PARA ASISTENCIAS
// ========================================

export interface RegistrarAsistenciaRequest {
  tipo: 'entrada' | 'salida';
  latitud: number;
  longitud: number;
  deviceInfo?: string;
}

export interface AsistenciaResponse {
  id: string;
  fecha: string;
  horaEntrada?: string;
  horaSalida?: string;
  estado: string;
  observaciones?: string;
  ubicacion_entrada?: {
    nombre: string;
    latitud: number;
    longitud: number;
  };
  ubicacion_salida?: {
    nombre: string;
    latitud: number;
    longitud: number;
  };
}

// ========================================
// TIPOS PARA RESPONSES API
// ========================================

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}

// ========================================
// TIPOS PARA MIDDLEWARE
// ========================================

export interface AuthenticatedRequest extends Request {
  user: JWTPayload;
}

// ========================================
// TIPOS PARA REPORTES
// ========================================

export interface ReporteRequest {
  tipo: 'asistencia_mensual' | 'asistencia_docente' | 'asistencia_general';
  fecha_inicio: string;
  fecha_fin: string;
  docenteId?: string;
  area_id?: number;
  formato: 'pdf' | 'excel';
}

// ========================================
// TIPOS PARA CONFIGURACIONES
// ========================================

export interface ConfiguracionSistema {
  tolerancia_entrada_minutos: number;
  tolerancia_salida_minutos: number;
  radioGpsMetros: number;
  horarioEntradaGeneral: string;
  horarioSalidaGeneral: string;
  nombreInstituto: string;
  emailAdmin: string;
}

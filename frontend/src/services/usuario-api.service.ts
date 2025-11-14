import api from '@/lib/api';

// Tipos para Usuario (según respuesta del backend)
export interface Usuario {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  email: string;
  telefono?: string;
  roles: {
    nombre: string;
  };
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
  docente?: {
    id: string;
    codigoDocente: string;
    area?: {
      id: number;
      nombre: string;
    };
  };
}

// Tipos para filtros
export interface FiltrosUsuario {
  search?: string;
  rol?: 'ADMIN' | 'DOCENTE';
  activo?: boolean;
}

// Tipos para crear/actualizar usuario
export interface CrearUsuarioDto {
  nombres: string;
  apellidos: string;
  dni: string;
  email: string;
  telefono?: string;
  password: string;
  rol: 'ADMIN' | 'DOCENTE';
}

export interface ActualizarUsuarioDto {
  nombres?: string;
  apellidos?: string;
  dni?: string;
  email?: string;
  telefono?: string;
  rol?: 'ADMIN' | 'DOCENTE';
  activo?: boolean;
  password?: string;
  updatedAt?: string; // 🔒 Para versionado optimista
}

class UsuarioApiService {
  // Obtener todos los usuarios
  async obtenerUsuarios(filtros?: FiltrosUsuario): Promise<Usuario[]> {
    try {
      const params = new URLSearchParams();
      if (filtros?.search) params.append('search', filtros.search);
      if (filtros?.rol) params.append('rol', filtros.rol);
      if (filtros?.activo !== undefined) params.append('activo', filtros.activo.toString());

      const response = await api.get(`/admin/usuarios?${params.toString()}`);
      
      // El backend devuelve { usuarios: [...], pagination: {...} }
      // Extraemos solo el array de usuarios
      if (response.data && Array.isArray(response.data.usuarios)) {
        return response.data.usuarios;
      } else {
        console.error('Formato de respuesta inesperado:', response.data);
        return [];
      }
    } catch (error: any) {
      console.error('Error al obtener usuarios:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener usuarios');
    }
  }

  // Obtener usuario por ID
  async obtenerUsuarioPorId(id: string): Promise<Usuario> {
    try {
      const response = await api.get(`/admin/usuarios/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener usuario:', error);
      throw new Error(error.response?.data?.message || 'Usuario no encontrado');
    }
  }

  // Crear usuario
  async crearUsuario(userData: CrearUsuarioDto): Promise<Usuario> {
    try {
      const response = await api.post('/admin/usuarios', userData);
      return response.data;
    } catch (error: any) {
      console.error('Error al crear usuario:', error);
      
      // Extraer mensaje y código de estado del backend
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error al crear usuario';
      const statusCode = error.response?.status;
      
      // Crear un error personalizado con información completa
      const customError: any = new Error(errorMessage);
      customError.statusCode = statusCode;
      customError.status = statusCode;
      customError.isValidationError = statusCode === 400 || statusCode === 403;
      customError.isConflict = statusCode === 409;
      
      throw customError;
    }
  }

  // Actualizar usuario
  async actualizarUsuario(id: string, userData: ActualizarUsuarioDto): Promise<Usuario> {
    try {
      const response = await api.put(`/admin/usuarios/${id}`, userData);
      return response.data;
    } catch (error: any) {
      console.error('Error al actualizar usuario:', error);
      
      // Extraer mensaje, código de estado y código de error del backend
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error al actualizar usuario';
      const statusCode = error.response?.status;
      const errorCode = error.response?.data?.code; // 🔒 Para VERSION_CONFLICT
      
      // Crear un error personalizado con información completa
      const customError: any = new Error(errorMessage);
      customError.statusCode = statusCode;
      customError.status = statusCode;
      customError.code = errorCode; // 🔒 Propagar código de error
      customError.isValidationError = statusCode === 403;
      customError.isConflict = statusCode === 409;
      
      throw customError;
    }
  }

  // Eliminar usuario
  async eliminarUsuario(id: string): Promise<void> {
    try {
      await api.delete(`/admin/usuarios/${id}`);
    } catch (error: any) {
      // Extraer el mensaje de error correctamente del backend
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error al eliminar usuario';
      const statusCode = error.response?.status;
      
      // Crear un error personalizado con información del tipo
      const customError: any = new Error(errorMessage);
      customError.statusCode = statusCode;
      customError.isValidationError = statusCode === 403;
      
      // Solo loguear errores del servidor (500, 404, etc.), no validaciones (403)
      if (statusCode !== 403 && statusCode !== 400) {
        console.error('Error al eliminar usuario:', error);
      }
      
      throw customError;
    }
  }

  // Cambiar estado del usuario (activo/inactivo)
  async cambiarEstadoUsuario(id: string, activo: boolean): Promise<Usuario> {
    try {
      const response = await api.put(`/admin/usuarios/${id}/toggle-status`, { activo });
      return response.data;
    } catch (error: any) {
      // Extraer el mensaje de error correctamente del backend
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error al cambiar estado del usuario';
      const statusCode = error.response?.status;
      
      // Crear un error personalizado con información del tipo
      const customError: any = new Error(errorMessage);
      customError.statusCode = statusCode;
      customError.isValidationError = statusCode === 403;
      
      // Solo loguear errores del servidor (500, 404, etc.), no validaciones (403)
      if (statusCode !== 403 && statusCode !== 400) {
        console.error('Error al cambiar estado del usuario:', error);
      }
      
      throw customError;
    }
  }

  // Validar disponibilidad de email
  async validarEmail(email: string, excludeId?: string): Promise<boolean> {
    try {
      const params = new URLSearchParams();
      params.append('email', email);
      if (excludeId) params.append('excludeId', excludeId);
      
      const response = await api.get(`/admin/usuarios/validate-email?${params.toString()}`);
      return response.data.available;
    } catch (error: any) {
      console.error('Error al validar email:', error);
      return false;
    }
  }

  // Validar disponibilidad de DNI
  async validarDni(dni: string, excludeId?: string): Promise<boolean> {
    try {
      const params = new URLSearchParams();
      params.append('dni', dni);
      if (excludeId) params.append('excludeId', excludeId);
      
      const response = await api.get(`/admin/usuarios/validate-dni?${params.toString()}`);
      return response.data.available;
    } catch (error: any) {
      console.error('Error al validar DNI:', error);
      return false;
    }
  }
}

export const usuarioService = new UsuarioApiService();
export default usuarioService;
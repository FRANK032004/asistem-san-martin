import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import { AuthUser, LoginCredentials } from '@/types';
import { Usuario } from '@/services/usuario-api.service';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateProfile: (userData: Partial<Usuario>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true });
          
          const response = await api.post('/auth/login', credentials);
          
          if (response.data.success) {
            // ✅ Backend ahora devuelve "usuario" (singular)
            const { usuario, accessToken } = response.data.data;
            
            // ✅ Guardar accessToken en localStorage
            localStorage.setItem('accessToken', accessToken);
            
            // ✅ Mapear roles (plural del backend) a rol (singular del frontend)
            const mappedUser = {
              ...usuario,
              rol: usuario.roles || usuario.rol // Mapear roles → rol para compatibilidad
            };
            
            // Actualizar estado
            set({ 
              user: { 
                ...mappedUser,
                rol: typeof mappedUser.rol === 'string' 
                  ? { id: mappedUser.rol === 'ADMIN' ? 1 : 2, nombre: mappedUser.rol, descripcion: mappedUser.rol }
                  : mappedUser.rol
              }, 
              isAuthenticated: true,
              isLoading: false 
            });
            
            console.log('✅ Login exitoso', mappedUser);
            return true;
          }
          
          set({ isLoading: false });
          return false;
        } catch (error: any) {
          set({ isLoading: false });
          
          // Debug: Ver estructura completa del error
          console.log('🔍 [auth.ts] Error response data:', error.response?.data);
          
          // Extraer mensaje de error correctamente según ResponseFormatter del backend
          let errorMessage = 'Error al iniciar sesión';
          
          // Backend devuelve: { success: false, error: { code, message, details }, meta }
          if (error.response?.data?.error?.message) {
            errorMessage = String(error.response.data.error.message);
          } else if (error.response?.data?.message) {
            errorMessage = String(error.response.data.message);
          } else if (error.message) {
            errorMessage = String(error.message);
          }
          
          console.log('✅ [auth.ts] Mensaje extraído:', errorMessage);
          
          // Lanzar solo el mensaje
          throw new Error(errorMessage);
        }
      },

      logout: () => {
        try {
          // Remover access token de localStorage
          localStorage.removeItem('accessToken');
          console.log('🗑️ Access token eliminado');
          
          // Limpiar estado primero para evitar errores visuales
          set({ 
            user: null, 
            isAuthenticated: false 
          });
          
          // El refreshToken en httpOnly cookie se eliminará desde el backend
          // Llamar a endpoint de logout para limpiar cookies (sin bloquear el logout)
          api.post('/auth/logout').catch(() => {
            // Silenciar error ya que el logout local ya se hizo
          });
          
          // Redirect a login con timeout para evitar errores de renderizado
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        } catch (error) {
          // En caso de cualquier error, forzar redirect
          window.location.href = '/login';
        }
      },

      checkAuth: async () => {
        try {
          const token = localStorage.getItem('accessToken');
          
          if (!token) {
            set({ user: null, isAuthenticated: false });
            return;
          }

          const response = await api.get('/auth/me');
          
          if (response.data.success) {
            const user = response.data.data;
            
            // ✅ Mapear roles (plural del backend) a rol (singular del frontend)
            const mappedUser = {
              ...user,
              rol: user.roles || user.rol // Mapear roles → rol para compatibilidad
            };
            
            set({ 
              user: { 
                ...mappedUser,
                // Convertir rol string a objeto Rol
                rol: typeof mappedUser.rol === 'string' 
                  ? { id: mappedUser.rol === 'ADMIN' ? 1 : 2, nombre: mappedUser.rol, descripcion: mappedUser.rol }
                  : mappedUser.rol
              }, 
              isAuthenticated: true 
            });
          } else {
            // Token inválido
            localStorage.removeItem('accessToken');
            set({ user: null, isAuthenticated: false });
          }
        } catch (error) {
          console.error('Error verificando autenticación:', error);
          localStorage.removeItem('accessToken');
          set({ user: null, isAuthenticated: false });
        }
      },

      updateProfile: (userData: Partial<Usuario>) => {
        const currentUser = get().user;
        if (currentUser && userData) {
          set({
            user: {
              ...currentUser,
              ...userData,
              // Mantener el rol actual - no actualizar desde userData para evitar conflictos de tipos
              rol: currentUser.rol
            }
          });
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

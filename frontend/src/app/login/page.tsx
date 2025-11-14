'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, MapPin, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { loginSchema, type LoginForm } from '@/lib/validations/schemas-completos';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const success = await login(data);

      if (success) {
        const currentUser = useAuthStore.getState().user;
        
        toast.success('Inicio de sesión exitoso', {
          description: `Bienvenido ${currentUser?.nombres || 'al sistema'}`,
          duration: 3000,
        });

        // Redirigir según el rol del usuario
        if (currentUser?.rol?.nombre === 'DOCENTE') {
          router.push('/docente');
        } else {
          router.push('/dashboard');
        }
      } else {
        setIsLoading(false);
        toast.error('Credenciales incorrectas', {
          description: 'Por favor, verifica tu correo electrónico y contraseña',
          duration: 5000,
        });
      }
    } catch (error: any) {
      setIsLoading(false);
      
      // Debug: ver qué contiene el error
      console.log('🔍 Error completo:', error);
      console.log('🔍 error.message:', error.message);
      console.log('🔍 error.response:', error.response);
      
      // Extraer mensaje de error y convertir a string
      let errorMessage = 'Las credenciales ingresadas son incorrectas. Por favor, verifica tu correo y contraseña.';
      
      if (error.message && error.message !== 'Error al iniciar sesión') {
        errorMessage = String(error.message);
      } else if (error.response?.data?.message) {
        errorMessage = String(error.response.data.message);
      } else if (error.response?.data?.error) {
        errorMessage = String(error.response.data.error);
      }
      
      console.log('📝 Mensaje final:', errorMessage);
      
      // 🔒 Detectar PRIMERO si es error de intentos restantes (antes de verificar "bloqueada")
      if (errorMessage.includes('Le quedan') || errorMessage.includes('intento(s)')) {
        toast.warning('Credenciales incorrectas', {
          description: errorMessage,
          duration: 6000,
        });
      }
      // 🔒 Detectar si es cuenta YA bloqueada (debe incluir "Cuenta bloqueada" o "bloqueada temporalmente" al inicio)
      else if (errorMessage.startsWith('Cuenta bloqueada') || errorMessage.includes('bloqueada temporalmente por múltiples')) {
        toast.error('Cuenta bloqueada temporalmente', {
          description: errorMessage,
          duration: 8000,
        });
      } 
      // Error de cuenta desactivada
      else if (errorMessage.includes('desactivada')) {
        toast.error('Cuenta desactivada', {
          description: errorMessage,
          duration: 6000,
        });
      }
      // Credenciales inválidas (genérico)
      else if (errorMessage.includes('inválida') || errorMessage.includes('incorrecta')) {
        toast.error('Credenciales incorrectas', {
          description: 'Por favor, verifica tu correo electrónico y contraseña',
          duration: 5000,
        });
      }
      // Error genérico
      else {
        toast.error('Error al iniciar sesión', {
          description: errorMessage,
          duration: 5000,
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Overlay de carga profesional */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-6 max-w-sm mx-4">
            {/* Spinner profesional con múltiples círculos */}
            <div className="relative w-20 h-20">
              {/* Círculo exterior */}
              <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
              {/* Círculo medio girando */}
              <div className="absolute inset-2 border-4 border-blue-300 border-t-transparent rounded-full animate-spin" style={{ animationDuration: '1s' }} />
              {/* Círculo interior girando más rápido */}
              <div className="absolute inset-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" style={{ animationDuration: '0.6s' }} />
              {/* Punto central pulsante */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
              </div>
            </div>
            
            {/* Texto animado */}
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-gray-900 animate-pulse">
                Iniciando sesión
              </h3>
              <p className="text-sm text-gray-500">
                Verificando credenciales y configurando tu sesión...
              </p>
            </div>
            
            {/* Barra de progreso animada */}
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full animate-pulse" style={{ width: '70%' }} />
            </div>
          </div>
        </div>
      )}

      {/* Panel Izquierdo - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 ring-2 ring-white/20">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Sistema de Asistencia<br />Docente GPS
            </h1>
            <p className="text-blue-100 text-lg leading-relaxed">
              Control inteligente de asistencias con geolocalización en tiempo real
            </p>
          </div>
          
          <div className="space-y-4 mt-12">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Verificación GPS</h3>
                <p className="text-sm text-blue-100">Validación de ubicación en tiempo real</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Acceso Seguro</h3>
                <p className="text-sm text-blue-100">Autenticación con validaciones avanzadas</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Reportes Detallados</h3>
                <p className="text-sm text-blue-100">Análisis completo de asistencias</p>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-12">
            <p className="text-sm text-blue-200">
              © 2025 Instituto San Martín. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>

      {/* Panel Derecho - Formulario */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo móvil */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex w-14 h-14 bg-blue-600 rounded-2xl items-center justify-center mb-4">
              <MapPin className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Instituto San Martín</h2>
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Iniciar Sesión
              </CardTitle>
              <CardDescription className="text-base">
                Ingresa tus credenciales para acceder al sistema
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Correo Electrónico
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@institucion.edu.pe"
                    {...register('email')}
                    className={`h-11 ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                    aria-invalid={!!errors.email}
                    disabled={isSubmitting || isLoading}
                  />
                  {errors.email && (
                    <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{errors.email.message}</span>
                    </div>
                  )}
                </div>
                
                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...register('password')}
                      className={`h-11 pr-11 ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                      aria-invalid={!!errors.password}
                      disabled={isSubmitting || isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:text-gray-600"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{errors.password.message}</span>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-600/30 transition-all hover:shadow-xl hover:shadow-blue-600/40 disabled:opacity-90 disabled:cursor-not-allowed"
                  disabled={isSubmitting || isLoading}
                >
                  {(isSubmitting || isLoading) ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="relative w-5 h-5">
                        {/* Círculo exterior girando */}
                        <div className="absolute inset-0 border-2 border-white/30 rounded-full" />
                        {/* Círculo animado */}
                        <div className="absolute inset-0 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                      <span className="animate-pulse">Verificando credenciales...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 group">
                      <span>Iniciar Sesión</span>
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-600 mb-1">¿Problemas para acceder?</p>
                <p className="text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
                  Contactar al administrador del sistema
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center text-xs text-gray-500">
            <p>Sistema protegido con validaciones avanzadas y encriptación</p>
          </div>
        </div>
      </div>
    </div>
  );
}

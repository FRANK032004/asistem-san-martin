'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, User, Eye, EyeOff, Mail, Phone, CreditCard, Shield, Lock, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { editarUsuarioSchema, type EditarUsuarioForm } from '@/lib/validations/usuario';
import { usuarioService, type ActualizarUsuarioDto, type Usuario } from '@/services/usuario-api.service';
import { toast } from 'sonner';

// ============================================
// COMPONENTE PRINCIPAL: Editar Usuario
// ============================================
export default function EditarUsuarioPage() {
  const params = useParams();
  const router = useRouter();
  const usuarioId = params?.id as string;
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Formulario con React Hook Form + Zod
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset
  } = useForm<EditarUsuarioForm>({
    resolver: zodResolver(editarUsuarioSchema),
    defaultValues: {
      nombres: '',
      apellidos: '',
      email: '',
      dni: '',
      telefono: '',
      rol: 'DOCENTE',
      activo: true,
      password: '',
      confirmPassword: ''
    }
  });

  // Cargar usuario desde el backend
  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        setLoadingUser(true);
        setError(null);
        const data = await usuarioService.obtenerUsuarioPorId(usuarioId);
        setUsuario(data);
      } catch (err: any) {
        setError(err.message || 'Usuario no encontrado');
        console.error('Error al cargar usuario:', err);
        toast.error('Error al cargar usuario', {
          description: err.message || 'No se pudo cargar la información del usuario',
        });
      } finally {
        setLoadingUser(false);
      }
    };

    if (usuarioId) {
      cargarUsuario();
    }
  }, [usuarioId]);

  // Cargar datos del usuario en el formulario
  useEffect(() => {
    if (usuario) {
      reset({
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        email: usuario.email,
        dni: usuario.dni,
        telefono: usuario.telefono || '',
        rol: usuario.roles?.nombre as 'ADMIN' | 'DOCENTE',
        activo: usuario.activo,
        password: '',
        confirmPassword: ''
      });
    }
  }, [usuario, reset]);

  // Manejar envío del formulario
  const onSubmit = async (formData: EditarUsuarioForm) => {
    setLoading(true);
    try {
      const dataParaBackend: ActualizarUsuarioDto = {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        email: formData.email,
        dni: formData.dni,
        telefono: formData.telefono,
        rol: formData.rol,
        activo: formData.activo,
        ...(formData.password && { password: formData.password })
      };
      
      await usuarioService.actualizarUsuario(usuarioId, dataParaBackend);
      
      toast.success('Usuario actualizado correctamente', {
        description: `Los datos de ${formData.nombres} ${formData.apellidos} han sido actualizados.`,
        duration: 3000,
      });
      
      // Redirigir a la lista de usuarios
      router.push('/admin/usuarios');
    } catch (error: any) {
      console.error('Error al actualizar usuario:', error);
      toast.error('Error al actualizar usuario', {
        description: error.message || 'No se pudieron guardar los cambios. Inténtalo de nuevo.',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Estado de carga inicial
  if (loadingUser) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Cargando información</h3>
                  <p className="text-gray-600 mt-1">Obteniendo datos del usuario...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error o usuario no encontrado
  if (error || !usuario) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-red-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Usuario no encontrado</h2>
                  <p className="text-gray-600 mb-6">
                    {error || `No se pudo encontrar el usuario con ID: ${usuarioId}`}
                  </p>
                </div>
                <Link href="/admin/usuarios">
                  <Button className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Usuarios
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Link 
              href="/admin/usuarios" 
              className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a Usuarios
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <UserCircle className="h-8 w-8 text-blue-600" />
              Editar Usuario
            </h1>
            <p className="text-gray-600 mt-1">
              Modificar información de {usuario.nombres} {usuario.apellidos}
            </p>
          </div>

          {/* Estado actual del usuario */}
          <div className="flex items-center gap-2">
            <Badge 
              variant={usuario.activo ? "default" : "secondary"}
              className={usuario.activo ? "bg-green-500" : "bg-gray-500"}
            >
              {usuario.activo ? 'Activo' : 'Inactivo'}
            </Badge>
            <Badge 
              variant="outline"
              className={
                usuario.roles?.nombre === 'ADMIN' 
                  ? 'border-purple-500 text-purple-700 bg-purple-50' 
                  : 'border-blue-500 text-blue-700 bg-blue-50'
              }
            >
              {usuario.roles?.nombre === 'ADMIN' ? 'Administrador' : 'Docente'}
            </Badge>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Información Personal */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-linear-to-r from-blue-50 to-blue-100 border-b">
              <CardTitle className="text-xl flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Información Personal
              </CardTitle>
              <CardDescription>
                Datos personales y de identificación del usuario
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nombres" className="text-sm font-semibold text-gray-700">
                    Nombres *
                  </Label>
                  <Input
                    id="nombres"
                    {...register('nombres')}
                    placeholder="Ej: Carlos Alberto"
                    className={`transition-all ${errors.nombres ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                    disabled={isSubmitting}
                  />
                  {errors.nombres && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <span className="font-medium">⚠</span> {errors.nombres.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellidos" className="text-sm font-semibold text-gray-700">
                    Apellidos *
                  </Label>
                  <Input
                    id="apellidos"
                    {...register('apellidos')}
                    placeholder="Ej: Rodríguez Pérez"
                    className={`transition-all ${errors.apellidos ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                    disabled={isSubmitting}
                  />
                  {errors.apellidos && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <span className="font-medium">⚠</span> {errors.apellidos.message}
                    </p>
                  )}
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="dni" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    DNI *
                  </Label>
                  <Input
                    id="dni"
                    {...register('dni')}
                    placeholder="12345678"
                    maxLength={8}
                    className={`transition-all ${errors.dni ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                    disabled={isSubmitting}
                  />
                  {errors.dni && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <span className="font-medium">⚠</span> {errors.dni.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <Phone className="h-4 w-4 text-gray-500" />
                    Teléfono
                  </Label>
                  <Input
                    id="telefono"
                    {...register('telefono')}
                    placeholder="987654321"
                    maxLength={9}
                    className={`transition-all ${errors.telefono ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                    disabled={isSubmitting}
                  />
                  {errors.telefono && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <span className="font-medium">⚠</span> {errors.telefono.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Sistema */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-linear-to-r from-purple-50 to-purple-100 border-b">
              <CardTitle className="text-xl flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Información del Sistema
              </CardTitle>
              <CardDescription>
                Credenciales de acceso y permisos del usuario
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <Mail className="h-4 w-4 text-gray-500" />
                  Email institucional *
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="usuario@sanmartin.edu.pe"
                  className={`transition-all ${errors.email ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="font-medium">⚠</span> {errors.email.message}
                  </p>
                )}
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="rol" className="text-sm font-semibold text-gray-700">
                    Rol en el sistema *
                  </Label>
                  <fieldset disabled={isSubmitting}>
                    <Select 
                      value={watch('rol')} 
                      onValueChange={(value) => setValue('rol', value as 'ADMIN' | 'DOCENTE')}
                    >
                      <SelectTrigger className={`transition-all ${errors.rol ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DOCENTE">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            Docente
                          </div>
                        </SelectItem>
                        <SelectItem value="ADMIN">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            Administrador
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </fieldset>
                  {errors.rol && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <span className="font-medium">⚠</span> {errors.rol.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activo" className="text-sm font-semibold text-gray-700">
                    Estado de la cuenta *
                  </Label>
                  <fieldset disabled={isSubmitting}>
                    <Select 
                      value={watch('activo') ? 'true' : 'false'} 
                      onValueChange={(value) => setValue('activo', value === 'true')}
                    >
                      <SelectTrigger className="transition-all focus:border-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Activo
                          </div>
                        </SelectItem>
                        <SelectItem value="false">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                            Inactivo
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </fieldset>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cambiar Contraseña (Opcional) */}
          <Card className="shadow-lg border-0 border-l-4 border-l-orange-500">
            <CardHeader className="bg-linear-to-r from-orange-50 to-orange-100 border-b">
              <CardTitle className="text-xl flex items-center gap-2">
                <Lock className="h-5 w-5 text-orange-600" />
                Cambiar Contraseña (Opcional)
              </CardTitle>
              <CardDescription>
                Solo completa estos campos si deseas cambiar la contraseña del usuario
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Nueva Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="Mínimo 8 caracteres"
                    className={`transition-all pr-10 ${errors.password ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isSubmitting}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="font-medium">⚠</span> {errors.password.message}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Debe contener al menos 8 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                  Confirmar Nueva Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    placeholder="Repetir la nueva contraseña"
                    className={`transition-all pr-10 ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isSubmitting}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="font-medium">⚠</span> {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-800">
                  <strong>💡 Nota:</strong> Si dejas estos campos en blanco, la contraseña actual del usuario se mantendrá sin cambios.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-600">
                  Los campos marcados con * son obligatorios
                </p>
                <div className="flex gap-3 w-full sm:w-auto">
                  <Link href="/admin/usuarios" className="flex-1 sm:flex-none">
                    <Button 
                      type="button" 
                      variant="outline" 
                      disabled={isSubmitting}
                      className="w-full sm:w-auto"
                    >
                      Cancelar
                    </Button>
                  </Link>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || loading}
                    className="flex-1 sm:flex-none gap-2"
                  >
                    {(isSubmitting || loading) ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Guardar cambios
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}

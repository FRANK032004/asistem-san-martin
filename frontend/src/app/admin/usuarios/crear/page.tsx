'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, UserPlus, Eye, EyeOff, Save, AlertCircle } from 'lucide-react';
import { crearUsuarioSchema, type CrearUsuarioForm } from '@/lib/validations/usuario';
import { usuarioService } from '@/services/usuario-api.service';
import { toast } from 'sonner';

export default function CrearUsuarioPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CrearUsuarioForm>({
    resolver: zodResolver(crearUsuarioSchema),
    defaultValues: {
      nombres: '',
      apellidos: '',
      email: '',
      dni: '',
      telefono: '',
      password: '',
      confirmPassword: '',
      rol: 'DOCENTE',
    },
  });

  const onSubmit = async (data: CrearUsuarioForm) => {
    try {
      // Llamada real al backend
      await usuarioService.crearUsuario({
        nombres: data.nombres,
        apellidos: data.apellidos,
        email: data.email,
        dni: data.dni,
        telefono: data.telefono,
        password: data.password,
        rol: data.rol,
      });
      
      toast.success('Usuario creado exitosamente', {
        description: `${data.nombres} ${data.apellidos} ha sido agregado al sistema`,
        duration: 4000,
      });
      
      // Redirigir después de 1.5 segundos
      setTimeout(() => {
        router.push('/admin/usuarios');
      }, 1500);
      
    } catch (error: any) {
      console.error('Error al crear usuario:', error);
      
      // Manejo específico de errores
      if (error.isConflict || error.statusCode === 409) {
        // Conflicto: Email o DNI duplicado
        toast.error('Datos duplicados', {
          description: error.message || 'El email o DNI ya está registrado en el sistema.',
          duration: 6000,
        });
      } else if (error.isValidationError || error.statusCode === 400) {
        // Validación: Datos inválidos
        toast.error('Datos inválidos', {
          description: error.message || 'Por favor verifica la información ingresada.',
          duration: 5000,
        });
      } else {
        // Error genérico
        toast.error('Error al crear el usuario', {
          description: error.message || 'Intente nuevamente más tarde',
          duration: 5000,
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href="/admin/usuarios" 
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Gestión de Usuarios
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <UserPlus className="h-8 w-8 text-blue-600" />
            Crear Nuevo Usuario
          </h1>
          <p className="text-gray-600 mt-2">Complete la información para crear un nuevo usuario en el sistema</p>
        </div>

        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Información Personal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombres">Nombres *</Label>
                  <Input
                    id="nombres"
                    {...register('nombres')}
                    placeholder="Ej: Juan Carlos"
                    className={errors.nombres ? 'border-red-300 focus:border-red-500' : ''}
                  />
                  {errors.nombres && (
                    <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{errors.nombres.message}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellidos">Apellidos *</Label>
                  <Input
                    id="apellidos"
                    {...register('apellidos')}
                    placeholder="Ej: Pérez González"
                    className={errors.apellidos ? 'border-red-300 focus:border-red-500' : ''}
                  />
                  {errors.apellidos && (
                    <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{errors.apellidos.message}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Institucional *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="usuario@sanmartin.edu.pe"
                  className={errors.email ? 'border-red-300 focus:border-red-500' : ''}
                />
                {errors.email && (
                  <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errors.email.message}</span>
                  </div>
                )}
                <p className="text-xs text-gray-500">Debe usar el dominio institucional @sanmartin.edu.pe</p>
              </div>

              {/* DNI y Teléfono */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dni">DNI *</Label>
                  <Input
                    id="dni"
                    {...register('dni')}
                    placeholder="12345678"
                    maxLength={8}
                    className={errors.dni ? 'border-red-300 focus:border-red-500' : ''}
                  />
                  {errors.dni && (
                    <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{errors.dni.message}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono (opcional)</Label>
                  <Input
                    id="telefono"
                    {...register('telefono')}
                    placeholder="987654321"
                    maxLength={9}
                    className={errors.telefono ? 'border-red-300 focus:border-red-500' : ''}
                  />
                  {errors.telefono && (
                    <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{errors.telefono.message}</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">Debe tener 9 dígitos y comenzar con 9</p>
                </div>
              </div>

              {/* Rol */}
              <div className="space-y-2">
                <Label htmlFor="rol">Rol en el Sistema *</Label>
                <Select 
                  value={watch('rol')}
                  onValueChange={(value) => setValue('rol', value as 'ADMIN' | 'DOCENTE')}
                >
                  <SelectTrigger className={errors.rol ? 'border-red-300' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DOCENTE">Docente</SelectItem>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                {errors.rol && (
                  <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errors.rol.message}</span>
                  </div>
                )}
              </div>

              {/* Contraseñas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      {...register('password')}
                      placeholder="Mínimo 8 caracteres"
                      className={`pr-10 ${errors.password ? 'border-red-300 focus:border-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{errors.password.message}</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">Debe contener mayúscula, minúscula y número</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      {...register('confirmPassword')}
                      placeholder="Repetir contraseña"
                      className={`pr-10 ${errors.confirmPassword ? 'border-red-300 focus:border-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{errors.confirmPassword.message}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/admin/usuarios')}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creando usuario...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Crear Usuario
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, UserPlus, Eye, EyeOff, Save, Loader2, AlertCircle } from 'lucide-react';
import { crearDocenteSchema, type CrearDocenteForm } from '@/lib/validations/schemas-completos';
import { docenteService, type Area } from '@/services/docente-api.service';
import { toast } from 'sonner';

export default function CrearDocentePage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<CrearDocenteForm>({
    resolver: zodResolver(crearDocenteSchema),
    defaultValues: {
      nombres: '',
      apellidos: '',
      email: '',
      dni: '',
      telefono: '',
      password: '',
      confirmPassword: '',
      codigoDocente: '',
      areaId: '',
      especialidad: '',
      observaciones: '',
      estado: 'ACTIVO' as const
    }
  });

  // Cargar áreas al inicializar
  useEffect(() => {
    cargarAreas();
  }, []);

  const cargarAreas = async () => {
    try {
      setLoadingAreas(true);
      const areasData = await docenteService.obtenerAreas();
      setAreas(areasData);
    } catch (error: any) {
      console.error('Error al cargar áreas:', error);
      toast.error('Error al cargar las áreas', {
        description: 'Usando áreas de ejemplo',
        duration: 3000,
      });
      // Áreas de ejemplo en caso de error
      setAreas([
        { id: '1', nombre: 'Matemáticas' },
        { id: '2', nombre: 'Comunicación' },
        { id: '3', nombre: 'Ciencias' },
        { id: '4', nombre: 'Historia' },
        { id: '5', nombre: 'Inglés' }
      ]);
    } finally {
      setLoadingAreas(false);
    }
  };

  const onSubmit = async (data: CrearDocenteForm) => {
    try {
      setLoading(true);
      
      const docenteData = {
        nombres: data.nombres,
        apellidos: data.apellidos,
        email: data.email,
        dni: data.dni,
        telefono: data.telefono || undefined,
        password: data.password,
        codigoDocente: data.codigoDocente,
        areaId: data.areaId,
        especialidad: data.especialidad || undefined,
        observaciones: data.observaciones || undefined,
        estado: data.estado
      };

      const nuevoDocente = await docenteService.crearDocente(docenteData);
      
      toast.success('Docente creado exitosamente', {
        description: `${data.nombres} ${data.apellidos} ha sido agregado al sistema`,
        duration: 4000,
      });
      
      // Redirigir después de 1.5 segundos
      setTimeout(() => {
        router.push('/admin/docentes');
      }, 1500);
      
    } catch (error: any) {
      console.error('Error al crear docente:', error);
      toast.error('Error al crear el docente', {
        description: error.message || 'Intente nuevamente más tarde',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Generar código automático basado en nombres y área
  const generateCodigoDocente = () => {
    const nombres = watch('nombres');
    const apellidos = watch('apellidos');
    const areaId = watch('areaId');
    
    if (nombres && apellidos && areaId) {
      const area = areas.find(a => a.id === areaId);
      if (area) {
        const iniciales = (nombres.charAt(0) + apellidos.charAt(0)).toUpperCase();
        const areaCode = area.nombre.substring(0, 3).toUpperCase();
        const randomNum = Math.floor(Math.random() * 999).toString().padStart(3, '0');
        const codigo = `${areaCode}${iniciales}${randomNum}`;
        setValue('codigoDocente', codigo);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Link href="/admin/docentes" className="hover:text-blue-600 transition-colors">
            ← Volver a Gestión de Docentes
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <UserPlus className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Docente</h1>
            <p className="text-gray-600">Complete la información para crear un nuevo docente en el sistema</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto space-y-8">
        
        {/* Información Personal */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-1 bg-blue-100 rounded">
                <UserPlus className="h-4 w-4 text-blue-600" />
              </div>
              Información Personal del Docente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Nombres y Apellidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nombres" className="text-sm font-medium text-gray-700">
                  Nombres *
                </Label>
                <Input
                  id="nombres"
                  placeholder="Ej: Juan Carlos"
                  {...register('nombres')}
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
                <Label htmlFor="apellidos" className="text-sm font-medium text-gray-700">
                  Apellidos *
                </Label>
                <Input
                  id="apellidos"
                  placeholder="Ej: Pérez González"
                  {...register('apellidos')}
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

            {/* Email y DNI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Institucional *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@sanmartin.edu.pe"
                  {...register('email')}
                  className={errors.email ? 'border-red-300 focus:border-red-500' : ''}
                />
                {errors.email && (
                  <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errors.email.message}</span>
                  </div>
                )}
                <p className="text-xs text-gray-500">Debe usar el dominio @sanmartin.edu.pe</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dni" className="text-sm font-medium text-gray-700">
                  DNI *
                </Label>
                <Input
                  id="dni"
                  placeholder="12345678"
                  maxLength={8}
                  {...register('dni')}
                  className={errors.dni ? 'border-red-300 focus:border-red-500' : ''}
                />
                {errors.dni && (
                  <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errors.dni.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Teléfono */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="telefono" className="text-sm font-medium text-gray-700">
                  Teléfono (opcional)
                </Label>
                <Input
                  id="telefono"
                  placeholder="987654321"
                  maxLength={9}
                  {...register('telefono')}
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

            {/* Contraseñas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Contraseña *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    {...register('password')}
                    className={errors.password ? 'border-red-300 focus:border-red-500 pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
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
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirmar Contraseña *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repetir contraseña"
                    {...register('confirmPassword')}
                    className={errors.confirmPassword ? 'border-red-300 focus:border-red-500 pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
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
          </CardContent>
        </Card>

        {/* Información Profesional */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-1 bg-green-100 rounded">
                <UserPlus className="h-4 w-4 text-green-600" />
              </div>
              Información Profesional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Código y Área */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="codigoDocente" className="text-sm font-medium text-gray-700">
                  Código Docente *
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="codigoDocente"
                    placeholder="MAT001"
                    {...register('codigoDocente')}
                    className={errors.codigoDocente ? 'border-red-300 focus:border-red-500' : ''}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateCodigoDocente}
                    className="shrink-0"
                  >
                    Generar
                  </Button>
                </div>
                {errors.codigoDocente && (
                  <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errors.codigoDocente.message}</span>
                  </div>
                )}
                <p className="text-xs text-gray-500">Código único del docente (ej: MAT-JC-001)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="areaId" className="text-sm font-medium text-gray-700">
                  Área *
                </Label>
                {loadingAreas ? (
                  <div className="flex items-center justify-center h-10 border rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <Select 
                    value={watch('areaId')} 
                    onValueChange={(value) => setValue('areaId', value)}
                  >
                    <SelectTrigger className={errors.areaId ? 'border-red-300' : ''}>
                      <SelectValue placeholder="Seleccionar área" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.areaId && (
                  <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errors.areaId.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Especialidad y Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="especialidad" className="text-sm font-medium text-gray-700">
                  Especialidad (opcional)
                </Label>
                <Input
                  id="especialidad"
                  placeholder="Ej: Álgebra y Geometría"
                  {...register('especialidad')}
                  className={errors.especialidad ? 'border-red-300 focus:border-red-500' : ''}
                />
                {errors.especialidad && (
                  <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errors.especialidad.message}</span>
                  </div>
                )}
                <p className="text-xs text-gray-500">Si aplica, mínimo 5 caracteres</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado" className="text-sm font-medium text-gray-700">
                  Estado *
                </Label>
                <Select 
                  value={watch('estado')} 
                  onValueChange={(value) => setValue('estado', value as 'ACTIVO' | 'INACTIVO' | 'LICENCIA')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVO">Activo</SelectItem>
                    <SelectItem value="INACTIVO">Inactivo</SelectItem>
                    <SelectItem value="LICENCIA">En Licencia</SelectItem>
                  </SelectContent>
                </Select>
                {errors.estado && (
                  <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errors.estado.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Observaciones */}
            <div className="space-y-2">
              <Label htmlFor="observaciones" className="text-sm font-medium text-gray-700">
                Observaciones (opcional)
              </Label>
              <Textarea
                id="observaciones"
                placeholder="Observaciones adicionales sobre el docente..."
                rows={3}
                {...register('observaciones')}
                className={errors.observaciones ? 'border-red-300 focus:border-red-500' : ''}
              />
              {errors.observaciones && (
                <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{errors.observaciones.message}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="order-2 sm:order-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          
          <Button
            type="submit"
            disabled={loading}
            className="order-1 sm:order-2 bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Crear Docente
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
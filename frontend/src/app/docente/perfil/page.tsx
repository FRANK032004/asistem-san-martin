'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/store/auth';
import { usePerfil } from '@/store/docente';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Mail, Phone, MapPin, Save, AlertCircle } from 'lucide-react';
import { ActualizarMiPerfilDto } from '@/services/docente-panel.service';
import { editarPerfilDocenteSchema, type EditarPerfilDocenteForm } from '@/lib/validations/schemas-completos';
import { toast } from 'sonner';

export default function MiPerfilPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  // 🔥 Usar hook optimizado del store
  const { perfil, loading, cargar, actualizar, error } = usePerfil();

  // React Hook Form con Zod
  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors } 
  } = useForm<EditarPerfilDocenteForm>({
    resolver: zodResolver(editarPerfilDocenteSchema),
    defaultValues: {
      telefono: '',
      direccion: '',
      contactoEmergencia: '',
      telefonoEmergencia: ''
    }
  });

  useEffect(() => {
    if (!user || user.rol?.nombre?.toLowerCase() !== 'docente') {
      router.push('/login');
      return;
    }
    // 🔥 Cargar perfil desde el store
    cargar();
  }, [user, router, cargar]);

  // 🔥 Sincronizar formulario con el store (cuando cambia el perfil)
  useEffect(() => {
    if (perfil) {
      reset({
        telefono: perfil.usuarios.telefono || '',
        direccion: perfil.docentes.direccion || '',
        contactoEmergencia: perfil.docentes.contacto_emergencia || '',
        telefonoEmergencia: perfil.docentes.telefono_emergencia || ''
      });
    }
  }, [perfil, reset]);

  // Mostrar errores del store
  useEffect(() => {
    if (error) {
      toast.error('Error', {
        description: error,
        duration: 5000,
      });
    }
  }, [error]);

  const onSubmit = async (data: EditarPerfilDocenteForm) => {
    try {
      const datosActualizados: ActualizarMiPerfilDto = {};
      
      // Solo enviar campos que cambiaron
      if (data.telefono !== perfil?.usuarios.telefono) {
        datosActualizados.telefono = data.telefono;
      }
      if (data.direccion !== perfil?.docentes.direccion) {
        datosActualizados.direccion = data.direccion;
      }
      if (data.contactoEmergencia !== perfil?.docentes.contacto_emergencia) {
        datosActualizados.contactoEmergencia = data.contactoEmergencia;
      }
      if (data.telefonoEmergencia !== perfil?.docentes.telefono_emergencia) {
        datosActualizados.telefonoEmergencia = data.telefonoEmergencia;
      }

      if (Object.keys(datosActualizados).length === 0) {
        toast.info('Sin cambios', {
          description: 'No hay cambios para guardar',
          duration: 3000,
        });
        return;
      }

      // 🔥 Usar acción del store
      await actualizar(datosActualizados);
      
      toast.success('Perfil actualizado exitosamente', {
        description: 'Tus datos han sido guardados correctamente',
        duration: 4000,
      });

    } catch (error: any) {
      // El error ya se muestra en el useEffect del store
      console.error('❌ Error al actualizar:', error);
    }
  };

  if (loading || !perfil) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push('/docente')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
                <p className="text-sm text-gray-500">Datos personales y configuración</p>
              </div>
            </div>
            <Badge variant="outline">DOCENTE</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Información Personal (Solo lectura) */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-gray-600">Nombre Completo</Label>
              <p className="font-medium text-gray-900">{perfil?.usuarios.nombres} {perfil?.usuarios.apellidos}</p>
            </div>
            <div>
              <Label className="text-gray-600">DNI</Label>
              <p className="font-medium text-gray-900">{perfil?.usuarios.dni || 'No registrado'}</p>
            </div>
            <div>
              <Label className="text-gray-600">Email</Label>
              <p className="font-medium text-gray-900">{perfil?.usuarios.email}</p>
            </div>
            <div>
              <Label className="text-gray-600">Código Docente</Label>
              <p className="font-medium text-gray-900">{perfil?.docentes.codigo_docente}</p>
            </div>
            <div>
              <Label className="text-gray-600">Área</Label>
              <Badge variant="outline">{perfil?.areas?.nombre || 'Sin área'}</Badge>
            </div>
            <div>
              <Label className="text-gray-600">Estado</Label>
              <Badge className="bg-green-100 text-green-800">{perfil?.docentes.estado}</Badge>
            </div>
          </div>
        </Card>

        {/* Información de Contacto (Editable) */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de Contacto</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="telefono">Teléfono Personal (opcional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="telefono"
                  {...register('telefono')}
                  placeholder="987654321"
                  className={`pl-10 ${errors.telefono ? 'border-red-300 focus:border-red-500' : ''}`}
                />
              </div>
              {errors.telefono && (
                <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errors.telefono.message}</span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Debe tener 9 dígitos y comenzar con 9</p>
            </div>
            <div>
              <Label htmlFor="direccion">Dirección (opcional)</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="direccion"
                  {...register('direccion')}
                  placeholder="Av. Principal 123, Lima"
                  className={`pl-10 ${errors.direccion ? 'border-red-300 focus:border-red-500' : ''}`}
                  maxLength={200}
                />
              </div>
              {errors.direccion && (
                <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errors.direccion.message}</span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Mínimo 10 caracteres, máximo 200</p>
            </div>
          </div>
        </Card>

        {/* Contacto de Emergencia (Editable) */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contacto de Emergencia</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="contactoEmergencia">Nombre del Contacto (opcional)</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="contactoEmergencia"
                  {...register('contactoEmergencia')}
                  placeholder="Nombre completo del contacto"
                  className={`pl-10 ${errors.contactoEmergencia ? 'border-red-300 focus:border-red-500' : ''}`}
                />
              </div>
              {errors.contactoEmergencia && (
                <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errors.contactoEmergencia.message}</span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Solo letras, mínimo 5 caracteres</p>
            </div>
            <div>
              <Label htmlFor="telefonoEmergencia">Teléfono de Emergencia (opcional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="telefonoEmergencia"
                  {...register('telefonoEmergencia')}
                  placeholder="987654321"
                  className={`pl-10 ${errors.telefonoEmergencia ? 'border-red-300 focus:border-red-500' : ''}`}
                />
              </div>
              {errors.telefonoEmergencia && (
                <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errors.telefonoEmergencia.message}</span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Debe tener 9 dígitos y comenzar con 9</p>
            </div>
          </div>
        </Card>

        {/* Información Laboral (Solo lectura) */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Laboral</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-gray-600">Fecha de Ingreso</Label>
              <p className="font-medium text-gray-900">
                {perfil?.docentes.fecha_ingreso ? new Date(perfil.docentes.fecha_ingreso).toLocaleDateString('es-PE') : 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-gray-600">Horario de Trabajo</Label>
              <p className="font-medium text-gray-900">
                {perfil?.docentes.horario_entrada} - {perfil?.docentes.horario_salida}
              </p>
            </div>
          </div>
        </Card>

        {/* Botón Guardar */}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            className="flex items-center bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>

        {/* Nota informativa */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Campos editables:</p>
              <p>Solo puedes editar tu teléfono, dirección y contactos de emergencia. Para modificar otros datos (área, horarios, etc.), contacta con el administrador.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

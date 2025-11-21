'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  AlertCircle,
  Trash2,
  Upload
} from 'lucide-react';
import { 
  justificacionService, 
  type MiJustificacion,
  type CrearJustificacionDto 
} from '@/services/justificacion-api.service';
import { crearJustificacionSchema, type CrearJustificacionForm } from '@/lib/validations/schemas-completos';
import { toast } from 'sonner';

export default function MisJustificacionesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  const [justificaciones, setJustificaciones] = useState<MiJustificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // React Hook Form
  const form = useForm<CrearJustificacionForm>({
    resolver: zodResolver(crearJustificacionSchema),
    defaultValues: {
      fechaInicio: '',
      fechaFin: '',
      tipo: 'MEDICA',
      motivo: '',
      afectaPago: false,
    },
  });

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = form;

  useEffect(() => {
    if (!user || user.rol?.nombre?.toLowerCase() !== 'docente') {
      router.push('/login');
      return;
    }
    cargarJustificaciones();
  }, [user, router]);

  const cargarJustificaciones = async () => {
    try {
      setLoading(true);
      const response = await justificacionService.obtenerMisJustificaciones();
      setJustificaciones(response.data || []);
      console.log('✅ Justificaciones cargadas:', response);
    } catch (error: any) {
      console.error('❌ Error:', error);
      toast.error('Error al cargar justificaciones', {
        description: error.message,
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CrearJustificacionForm) => {
    try {
      setGuardando(true);
      await justificacionService.crearJustificacion(data);
      
      toast.success('Justificación enviada exitosamente', {
        description: 'Será revisada por un administrador',
        duration: 4000,
      });
      
      setShowModal(false);
      reset();
      cargarJustificaciones();
    } catch (error: any) {
      console.error('❌ Error:', error);
      toast.error('Error al enviar justificación', {
        description: error.message,
        duration: 5000,
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta justificación? Solo puedes eliminar justificaciones pendientes.')) {
      return;
    }

    try {
      await justificacionService.eliminarJustificacion(id);
      toast.success('Justificación eliminada', {
        duration: 3000,
      });
      cargarJustificaciones();
    } catch (error: any) {
      toast.error('Error al eliminar', {
        description: error.message,
        duration: 4000,
      });
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estadoNormalizado = estado.toUpperCase();
    switch (estadoNormalizado) {
      case 'PENDIENTE':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'APROBADO':
      case 'APROBADA':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprobado
          </Badge>
        );
      case 'RECHAZADO':
      case 'RECHAZADA':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rechazado
          </Badge>
        );
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const formatearFecha = (fecha: string | Date) => {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return date.toLocaleDateString('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando justificaciones...</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Mis Justificaciones</h1>
                <p className="text-sm text-gray-500">Gestiona tus justificaciones de ausencias</p>
              </div>
            </div>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Justificación
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{justificaciones.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {justificaciones.filter(j => j.estado.toLowerCase() === 'pendiente').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aprobadas</p>
                <p className="text-2xl font-bold text-green-600">
                  {justificaciones.filter(j => j.estado.toLowerCase() === 'aprobada' || j.estado.toLowerCase() === 'aprobado').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rechazadas</p>
                <p className="text-2xl font-bold text-red-600">
                  {justificaciones.filter(j => j.estado.toLowerCase() === 'rechazada' || j.estado.toLowerCase() === 'rechazado').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </Card>
        </div>

        {/* Lista de Justificaciones */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Mis Solicitudes</h2>
          
          {justificaciones.length > 0 ? (
            <div className="space-y-4">
              {justificaciones.map((justificacion) => (
                <div
                  key={justificacion.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatearFecha(justificacion.fecha_inicio)}
                          {justificacion.fecha_inicio !== justificacion.fecha_fin && (
                            <> - {formatearFecha(justificacion.fecha_fin)}</>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          {justificacionService.formatearTipo(justificacion.tipo)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getEstadoBadge(justificacion.estado)}
                      {justificacion.estado === 'pendiente' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEliminar(justificacion.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="ml-8">
                    <p className="text-sm text-gray-700 mb-2 whitespace-pre-line">{justificacion.motivo}</p>
                    
                    {justificacion.observaciones_admin && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-xs font-medium text-blue-900 mb-1">Comentario del administrador:</p>
                        <p className="text-sm text-blue-800">{justificacion.observaciones_admin}</p>
                      </div>
                    )}

                    {justificacion.documento_adjunto && (
                      <div className="mt-2">
                        <Button variant="ghost" size="sm" className="text-blue-600">
                          <FileText className="h-4 w-4 mr-1" />
                          Ver documento adjunto
                        </Button>
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-500">
                      Enviado: {new Date(justificacion.created_at).toLocaleString('es-PE')}
                      {justificacion.fecha_aprobacion && (
                        <> • Revisado: {new Date(justificacion.fecha_aprobacion).toLocaleString('es-PE')}</>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No tienes justificaciones registradas
              </h3>
              <p className="text-gray-600 mb-4">
                Crea una justificación si necesitas justificar una ausencia
              </p>
              <Button onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Justificación
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Modal Crear Justificación */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Nueva Justificación</h2>
              
              <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fechaInicio">Fecha de inicio *</Label>
                    <Input
                      id="fechaInicio"
                      type="date"
                      {...register('fechaInicio')}
                      max={new Date().toISOString().split('T')[0]}
                      className={errors.fechaInicio ? 'border-red-300 focus:border-red-500' : ''}
                    />
                  {errors.fechaInicio && (
                    <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{errors.fechaInicio.message}</span>
                    </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Máximo 30 días atrás</p>
                  </div>

                  <div>
                    <Label htmlFor="fechaFin">Fecha de fin *</Label>
                    <Input
                      id="fechaFin"
                      type="date"
                      {...register('fechaFin')}
                      max={new Date().toISOString().split('T')[0]}
                      className={errors.fechaFin ? 'border-red-300 focus:border-red-500' : ''}
                    />
                  {errors.fechaFin && (
                    <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{errors.fechaFin.message}</span>
                    </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Rango máximo 30 días</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="tipo">Tipo de justificación *</Label>
                  <Select
                    value={watch('tipo')}
                    onValueChange={(value) => setValue('tipo', value as any)}
                  >
                    <SelectTrigger className={errors.tipo ? 'border-red-300' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEDICA">Médica (Consulta, enfermedad, reposo)</SelectItem>
                      <SelectItem value="PERSONAL">Personal (Trámites personales)</SelectItem>
                      <SelectItem value="FAMILIAR">Familiar (Emergencia familiar)</SelectItem>
                      <SelectItem value="CAPACITACION">Capacitación (Cursos, talleres)</SelectItem>
                      <SelectItem value="OTRO">Otro motivo</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.tipo && (
                    <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{errors.tipo.message}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="motivo">Motivo detallado *</Label>
                  <Textarea
                    id="motivo"
                    {...register('motivo')}
                    placeholder="Explica el motivo de tu ausencia de forma detallada. Ejemplo: Tuve que asistir a consulta médica por dolor de cabeza persistente que me impedía trabajar normalmente..."
                    rows={5}
                    className={errors.motivo ? 'border-red-300 focus:border-red-500' : ''}
                  />
                  {errors.motivo && (
                    <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{errors.motivo.message}</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Mínimo 20 caracteres, máximo 1000. Mínimo 5 palabras.
                  </p>
                </div>

                <div>
                  <Label htmlFor="documento">Documento adjunto (opcional)</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Subir archivo
                    </Button>
                    <p className="text-xs text-gray-500">
                      Certificado médico, constancia, etc. (Máx. 5MB)
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Próximamente: Podrás subir evidencias directamente
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Importante:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>La justificación será revisada por un administrador</li>
                        <li>Recibirás una notificación cuando sea aprobada o rechazada</li>
                        <li>Solo puedes eliminar justificaciones pendientes</li>
                        <li>El rango de fechas no puede exceder 30 días</li>
                        <li>Puedes justificar ausencias de los últimos 30 días</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false);
                      reset();
                    }}
                    disabled={guardando}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={guardando} className="bg-blue-600 hover:bg-blue-700">
                    {guardando ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar Justificación'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

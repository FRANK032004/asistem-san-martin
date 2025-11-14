'use client';

/**
 * Página de Permisos y Licencias - Módulo Docente
 * Gestión profesional de solicitudes de permisos, licencias y ausencias
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Calendar,
  FileText,
  Plus,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
} from 'lucide-react';
import {
  obtenerJustificacionesDocente,
  crearJustificacionDocente,
  type MiJustificacion,
} from '@/services/justificacion-api.service';
import { toast } from 'sonner';
import Link from 'next/link';

export default function PermisosPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [permisos, setPermisos] = useState<MiJustificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [procesando, setProcesando] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    tipo: 'PERSONAL',
    motivo: '',
    fecha_inicio: '',
    fecha_fin: '',
    archivo: null as File | null,
  });

  useEffect(() => {
    if (!user || user.rol?.nombre !== 'DOCENTE') {
      router.push('/login');
      return;
    }
    cargarPermisos();
  }, [user, router]);

  const cargarPermisos = async () => {
    try {
      setLoading(true);
      const response = await obtenerJustificacionesDocente();
      if (response.ok) {
        // Filtrar solo permisos y licencias (excluir justificaciones de asistencias)
        const permisosLicencias = response.data.filter(
          (j: MiJustificacion) =>
            j.tipo === 'PERSONAL' ||
            j.tipo === 'MEDICA' ||
            j.tipo === 'FAMILIAR' ||
            j.tipo === 'CAPACITACION' ||
            j.tipo === 'OTRO'
        );
        setPermisos(permisosLicencias);
      }
    } catch (error: any) {
      console.error('Error al cargar permisos:', error);
      toast.error('Error al cargar permisos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.motivo || !formData.fecha_inicio) {
      toast.error('Complete los campos obligatorios');
      return;
    }

    try {
      setProcesando(true);

      const formDataToSend = new FormData();
      formDataToSend.append('tipo', formData.tipo);
      formDataToSend.append('motivo', formData.motivo);
      formDataToSend.append('fecha_inicio', formData.fecha_inicio);
      if (formData.fecha_fin) {
        formDataToSend.append('fecha_fin', formData.fecha_fin);
      }
      if (formData.archivo) {
        formDataToSend.append('documento', formData.archivo);
      }

      const response = await crearJustificacionDocente(formDataToSend);

      if (response.ok) {
        toast.success('Solicitud enviada correctamente');
        setShowForm(false);
        setFormData({
          tipo: 'PERSONAL',
          motivo: '',
          fecha_inicio: '',
          fecha_fin: '',
          archivo: null,
        });
        await cargarPermisos();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.mensaje || 'Error al crear solicitud');
    } finally {
      setProcesando(false);
    }
  };

  const obtenerBadgeEstado = (estado: string) => {
    const estados: Record<string, { variant: any; icon: React.ReactNode; text: string }> = {
      pendiente: {
        variant: 'secondary',
        icon: <Clock className="w-3 h-3 mr-1" />,
        text: 'Pendiente',
      },
      aprobada: {
        variant: 'default',
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
        text: 'Aprobado',
      },
      rechazada: {
        variant: 'destructive',
        icon: <XCircle className="w-3 h-3 mr-1" />,
        text: 'Rechazado',
      },
    };

    const estadoInfo = estados[estado] || estados.pendiente;

    return (
      <Badge variant={estadoInfo.variant} className="flex items-center w-fit">
        {estadoInfo.icon}
        {estadoInfo.text}
      </Badge>
    );
  };

  const obtenerNombreTipo = (tipo: string) => {
    const tipos: Record<string, string> = {
      PERSONAL: 'Permiso Personal',
      MEDICA: 'Licencia Médica',
      FAMILIAR: 'Permiso Familiar',
      CAPACITACION: 'Capacitación',
      OTRO: 'Otros',
    };
    return tipos[tipo] || tipo;
  };

  const formatearFecha = (fecha: string | Date) => {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando permisos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/docente">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Calendar className="h-8 w-8 text-purple-600" />
                Permisos y Licencias
              </h1>
            </div>
            <p className="text-gray-600 mt-1">
              Gestiona tus solicitudes de permisos, licencias y ausencias
            </p>
          </div>

          <Button onClick={() => setShowForm(!showForm)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Solicitud
          </Button>
        </div>

        {/* Formulario */}
        {showForm && (
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <FileText className="w-5 h-5" />
                Nueva Solicitud de Permiso/Licencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Solicitud *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={formData.tipo}
                      onChange={(e) =>
                        setFormData({ ...formData, tipo: e.target.value })
                      }
                      required
                    >
                      <option value="PERSONAL">Permiso Personal</option>
                      <option value="MEDICA">Licencia Médica</option>
                      <option value="FAMILIAR">Permiso Familiar</option>
                      <option value="CAPACITACION">Capacitación</option>
                      <option value="OTRO">Otros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Inicio *
                    </label>
                    <Input
                      type="date"
                      value={formData.fecha_inicio}
                      onChange={(e) =>
                        setFormData({ ...formData, fecha_inicio: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Fin (opcional)
                    </label>
                    <Input
                      type="date"
                      value={formData.fecha_fin}
                      onChange={(e) =>
                        setFormData({ ...formData, fecha_fin: e.target.value })
                      }
                      min={formData.fecha_inicio}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Documento Adjunto (opcional)
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            archivo: e.target.files?.[0] || null,
                          })
                        }
                        className="flex-1"
                      />
                      {formData.archivo && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setFormData({ ...formData, archivo: null })
                          }
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, JPG, PNG (máx. 5MB)
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de la Solicitud *
                  </label>
                  <Textarea
                    value={formData.motivo}
                    onChange={(e) =>
                      setFormData({ ...formData, motivo: e.target.value })
                    }
                    placeholder="Describa detalladamente el motivo de su solicitud..."
                    rows={4}
                    required
                    className="resize-none"
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    disabled={procesando}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={procesando}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {procesando ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Enviar Solicitud
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-linear-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium">Total</p>
                  <p className="text-2xl font-bold text-blue-900">{permisos.length}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-linear-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-700 font-medium">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {permisos.filter((p) => p.estado === 'pendiente').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-linear-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">Aprobados</p>
                  <p className="text-2xl font-bold text-green-900">
                    {permisos.filter((p) => p.estado === 'aprobada').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-linear-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 font-medium">Rechazados</p>
                  <p className="text-2xl font-bold text-red-900">
                    {permisos.filter((p) => p.estado === 'rechazada').length}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de solicitudes */}
        {permisos.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No tienes solicitudes
              </h3>
              <p className="text-gray-600 mb-4">
                Crea tu primera solicitud de permiso o licencia
              </p>
              <Button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Solicitud
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Mis Solicitudes</h2>
            {permisos.map((permiso) => (
              <Card
                key={permiso.id}
                className="hover:shadow-md transition-shadow border-l-4 border-l-purple-500"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {obtenerNombreTipo(permiso.tipo)}
                        </h3>
                        {obtenerBadgeEstado(permiso.estado)}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{permiso.motivo}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Inicio: <strong>{formatearFecha(permiso.fecha_inicio)}</strong>
                      </span>
                    </div>
                    {permiso.fecha_fin && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Fin: <strong>{formatearFecha(permiso.fecha_fin)}</strong>
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        Creado: {formatearFecha(permiso.created_at)}
                      </span>
                    </div>
                  </div>

                  {permiso.observaciones_admin && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-amber-900">
                            Observación del Administrador
                          </p>
                          <p className="text-sm text-amber-700 mt-1">
                            {permiso.observaciones_admin}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {permiso.documento_adjunto && (
                    <div className="mt-4">
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL}${permiso.documento_adjunto}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Ver documento adjunto
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

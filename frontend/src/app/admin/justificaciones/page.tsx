'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  User,
  Eye
} from 'lucide-react';
import { 
  justificacionService, 
  type JustificacionPendiente,
  type AprobarJustificacionDto 
} from '@/services/justificacion-api.service';
import BackToAdminButton from '@/components/admin/BackToAdminButton';

export default function AdminJustificacionesPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  const [justificaciones, setJustificaciones] = useState<JustificacionPendiente[]>([]);
  const [justificacionesFiltradas, setJustificacionesFiltradas] = useState<JustificacionPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'>('PENDIENTE');
  const [procesando, setProcesando] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [justificacionSeleccionada, setJustificacionSeleccionada] = useState<JustificacionPendiente | null>(null);
  const [accionModal, setAccionModal] = useState<'APROBAR' | 'RECHAZAR' | null>(null);
  const [comentario, setComentario] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    
    const userRole = typeof user.rol === 'string' ? user.rol : user.rol?.nombre;
    if (userRole !== 'ADMIN' && userRole !== 'ADMINISTRADOR') {
      setError('No tienes permisos para acceder a esta página');
      return;
    }
    
    cargarJustificaciones();
  }, [user, isAuthenticated, router]);

  useEffect(() => {
    filtrarJustificaciones();
  }, [busqueda, filtroEstado, justificaciones]);

  const cargarJustificaciones = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await justificacionService.obtenerJustificacionesPendientes();
      setJustificaciones(data);
      console.log('✅ Justificaciones cargadas:', data);
    } catch (error: any) {
      console.error('❌ Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filtrarJustificaciones = () => {
    // ✅ Validación defensiva
    if (!Array.isArray(justificaciones)) {
      console.error('justificaciones no es un array:', justificaciones);
      setJustificacionesFiltradas([]);
      return;
    }

    let filtered = [...justificaciones];

    // Filtrar por búsqueda
    if (busqueda.trim()) {
      filtered = filtered.filter(j =>
        j.docente.usuario.nombreCompleto.toLowerCase().includes(busqueda.toLowerCase()) ||
        j.docente.usuario.dni.includes(busqueda) ||
        j.docente.codigoDocente.toLowerCase().includes(busqueda.toLowerCase()) ||
        j.motivo.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    // Filtrar por estado
    if (filtroEstado !== 'TODOS') {
      filtered = filtered.filter(j => j.estado === filtroEstado);
    }

    setJustificacionesFiltradas(filtered);
  };

  const abrirModal = (justificacion: JustificacionPendiente, accion: 'APROBAR' | 'RECHAZAR') => {
    setJustificacionSeleccionada(justificacion);
    setAccionModal(accion);
    setComentario('');
    setShowModal(true);
  };

  const handleAprobarRechazar = async () => {
    if (!justificacionSeleccionada || !accionModal) return;

    try {
      setProcesando(justificacionSeleccionada.id);
      setError(null);

      const datos: AprobarJustificacionDto = {
        estado: accionModal === 'APROBAR' ? 'APROBADO' : 'RECHAZADO',
        comentario: comentario.trim() || undefined
      };

      await justificacionService.cambiarEstadoJustificacion(justificacionSeleccionada.id, datos);
      
      setSuccessMessage(
        `✅ Justificación ${accionModal === 'APROBAR' ? 'aprobada' : 'rechazada'} exitosamente`
      );
      setShowModal(false);
      setJustificacionSeleccionada(null);
      setAccionModal(null);
      setComentario('');
      cargarJustificaciones();
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setProcesando(null);
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'APROBADO':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprobado
          </Badge>
        );
      case 'RECHAZADO':
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

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
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

  if (error && !justificaciones.length) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <BackToAdminButton />
          </div>
        </Card>
      </div>
    );
  }

  const pendientes = justificaciones.filter(j => j.estado === 'PENDIENTE').length;
  const aprobadas = justificaciones.filter(j => j.estado === 'APROBADO').length;
  const rechazadas = justificaciones.filter(j => j.estado === 'RECHAZADO').length;

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Justificaciones</h1>
              <p className="text-sm text-gray-500">Aprobar o rechazar justificaciones de ausencias</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={cargarJustificaciones} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
              <BackToAdminButton />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

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
                <p className="text-2xl font-bold text-yellow-600">{pendientes}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aprobadas</p>
                <p className="text-2xl font-bold text-green-600">{aprobadas}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rechazadas</p>
                <p className="text-2xl font-bold text-red-600">{rechazadas}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, DNI, código..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="APROBADO">Aprobadas</option>
                <option value="RECHAZADO">Rechazadas</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Lista de Justificaciones */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Justificaciones ({justificacionesFiltradas.length})
            </h2>
          </div>
          
          {justificacionesFiltradas.length > 0 ? (
            <div className="space-y-4">
              {justificacionesFiltradas.map((justificacion) => (
                <div
                  key={justificacion.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                      <User className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {justificacion.docente.usuario.nombreCompleto}
                        </p>
                        <p className="text-sm text-gray-500">
                          {justificacion.docente.area?.nombre || 'Sin área'} • 
                          DNI: {justificacion.docente.usuario.dni} • 
                          Código: {justificacion.docente.codigoDocente}
                        </p>
                      </div>
                    </div>
                    {getEstadoBadge(justificacion.estado)}
                  </div>

                  {/* Contenido */}
                  <div className="ml-8 space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="font-medium">{formatearFecha(justificacion.fecha)}</span>
                      <span className="mx-2">•</span>
                      <span>{justificacionService.formatearMotivo(justificacion.motivo)}</span>
                    </div>

                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {justificacion.descripcion}
                    </p>

                    {justificacion.documentoAdjunto && (
                      <div className="flex items-center text-sm text-blue-600">
                        <FileText className="h-4 w-4 mr-1" />
                        <span>Documento adjunto disponible</span>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Enviado: {new Date(justificacion.createdAt).toLocaleString('es-PE')}
                    </div>

                    {/* Acciones */}
                    {justificacion.estado === 'PENDIENTE' && (
                      <div className="flex items-center space-x-2 pt-3">
                        <Button
                          size="sm"
                          onClick={() => abrirModal(justificacion, 'APROBAR')}
                          disabled={procesando === justificacion.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => abrirModal(justificacion, 'RECHAZAR')}
                          disabled={procesando === justificacion.id}
                          className="text-red-600 hover:text-red-700 border-red-300"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay justificaciones
              </h3>
              <p className="text-gray-600">
                {busqueda || filtroEstado !== 'TODOS'
                  ? 'No se encontraron resultados con los filtros aplicados'
                  : 'No hay justificaciones registradas'}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Modal Aprobar/Rechazar */}
      {showModal && justificacionSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {accionModal === 'APROBAR' ? 'Aprobar' : 'Rechazar'} Justificación
              </h2>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Docente:</p>
                <p className="font-medium text-gray-900">
                  {justificacionSeleccionada.docente.usuario.nombreCompleto}
                </p>
                <p className="text-sm text-gray-600 mt-2 mb-1">Fecha:</p>
                <p className="font-medium text-gray-900">
                  {formatearFecha(justificacionSeleccionada.fecha)}
                </p>
                <p className="text-sm text-gray-600 mt-2 mb-1">Motivo:</p>
                <p className="font-medium text-gray-900">
                  {justificacionService.formatearMotivo(justificacionSeleccionada.motivo)}
                </p>
              </div>

              <div className="mb-4">
                <Label htmlFor="comentario">
                  Comentario {accionModal === 'RECHAZAR' ? '(requerido)' : '(opcional)'}
                </Label>
                <Textarea
                  id="comentario"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder={
                    accionModal === 'APROBAR'
                      ? 'Agregar un comentario opcional...'
                      : 'Explica por qué se rechaza la justificación...'
                  }
                  rows={3}
                  required={accionModal === 'RECHAZAR'}
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    setJustificacionSeleccionada(null);
                    setAccionModal(null);
                    setComentario('');
                  }}
                  disabled={procesando === justificacionSeleccionada.id}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAprobarRechazar}
                  disabled={
                    procesando === justificacionSeleccionada.id ||
                    (accionModal === 'RECHAZAR' && !comentario.trim())
                  }
                  className={
                    accionModal === 'APROBAR'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }
                >
                  {procesando === justificacionSeleccionada.id
                    ? 'Procesando...'
                    : accionModal === 'APROBAR'
                    ? 'Aprobar'
                    : 'Rechazar'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

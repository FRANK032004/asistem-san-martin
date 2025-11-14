'use client';

/**
 * Página de Notificaciones - Módulo Docente
 * Gestión profesional de notificaciones del sistema
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  Filter,
  ArrowLeft,
  Calendar,
  FileText,
  DollarSign,
  Clock,
  Settings,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import {
  obtenerMisNotificaciones,
  marcarComoLeida,
  marcarTodasComoLeidas,
  eliminarNotificacion,
  limpiarNotificacionesAntiguas,
  formatearFechaNotificacion,
  obtenerColorTipo,
  TipoNotificacion,
  type Notificacion,
} from '@/services/notificacion-api.service';
import { toast } from 'sonner';
import Link from 'next/link';

export default function NotificacionesPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroLeido, setFiltroLeido] = useState<boolean | undefined>(undefined);
  const [filtroTipo, setFiltroTipo] = useState<TipoNotificacion | undefined>(undefined);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    if (!user || user.rol?.nombre !== 'DOCENTE') {
      router.push('/login');
      return;
    }
    cargarNotificaciones();
  }, [user, router, filtroLeido, filtroTipo]);

  const cargarNotificaciones = async () => {
    try {
      setLoading(true);
      const response = await obtenerMisNotificaciones({
        leido: filtroLeido,
        tipo: filtroTipo,
      });

      if (response.ok) {
        setNotificaciones(response.data);
      }
    } catch (error: any) {
      console.error('Error al cargar notificaciones:', error);
      toast.error('Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarLeida = async (id: string) => {
    try {
      const response = await marcarComoLeida(id);
      if (response.ok) {
        toast.success('Notificación marcada como leída');
        await cargarNotificaciones();
      }
    } catch (error: any) {
      toast.error('Error al marcar como leída');
    }
  };

  const handleMarcarTodasLeidas = async () => {
    try {
      setProcesando(true);
      const response = await marcarTodasComoLeidas();
      if (response.ok) {
        toast.success(response.data.mensaje);
        await cargarNotificaciones();
      }
    } catch (error: any) {
      toast.error('Error al marcar todas como leídas');
    } finally {
      setProcesando(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta notificación?')) {
      return;
    }

    try {
      const response = await eliminarNotificacion(id);
      if (response.ok) {
        toast.success('Notificación eliminada');
        await cargarNotificaciones();
      }
    } catch (error: any) {
      toast.error('Error al eliminar notificación');
    }
  };

  const handleLimpiarAntiguas = async () => {
    if (!confirm('¿Eliminar todas las notificaciones leídas de más de 30 días?')) {
      return;
    }

    try {
      setProcesando(true);
      const response = await limpiarNotificacionesAntiguas();
      if (response.ok) {
        toast.success(response.data.mensaje);
        await cargarNotificaciones();
      }
    } catch (error: any) {
      toast.error('Error al limpiar notificaciones');
    } finally {
      setProcesando(false);
    }
  };

  const obtenerIconoTipo = (tipo: TipoNotificacion) => {
    const iconos: Record<TipoNotificacion, React.ReactNode> = {
      [TipoNotificacion.ASISTENCIA]: <Calendar className="w-5 h-5" />,
      [TipoNotificacion.JUSTIFICACION]: <FileText className="w-5 h-5" />,
      [TipoNotificacion.PLANILLA]: <DollarSign className="w-5 h-5" />,
      [TipoNotificacion.HORARIO]: <Clock className="w-5 h-5" />,
      [TipoNotificacion.SISTEMA]: <Settings className="w-5 h-5" />,
      [TipoNotificacion.ALERTA]: <AlertTriangle className="w-5 h-5" />,
    };
    return iconos[tipo] || <Bell className="w-5 h-5" />;
  };

  const noLeidas = notificaciones.filter((n) => !n.leido).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
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
                <Bell className="h-8 w-8 text-blue-600" />
                Notificaciones
              </h1>
            </div>
            <p className="text-gray-600 mt-1">
              {noLeidas > 0 ? `${noLeidas} notificaciones sin leer` : 'Todas las notificaciones leídas'}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={cargarNotificaciones}
              disabled={procesando}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${procesando ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            {noLeidas > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarcarTodasLeidas}
                disabled={procesando}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Marcar todas leídas
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLimpiarAntiguas}
              disabled={procesando}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpiar antiguas
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <div className="flex gap-2">
                <Button
                  variant={filtroLeido === undefined ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltroLeido(undefined)}
                >
                  Todas
                </Button>
                <Button
                  variant={filtroLeido === false ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltroLeido(false)}
                >
                  No leídas ({noLeidas})
                </Button>
                <Button
                  variant={filtroLeido === true ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltroLeido(true)}
                >
                  Leídas
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={filtroTipo === undefined ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltroTipo(undefined)}
                >
                  Todos los tipos
                </Button>
                {Object.values(TipoNotificacion).map((tipo) => (
                  <Button
                    key={tipo}
                    variant={filtroTipo === tipo ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFiltroTipo(tipo)}
                  >
                    {tipo}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de notificaciones */}
        {notificaciones.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <BellOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay notificaciones
              </h3>
              <p className="text-gray-600">
                {filtroLeido !== undefined || filtroTipo !== undefined
                  ? 'No hay notificaciones con los filtros aplicados'
                  : 'Aún no tienes notificaciones'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {notificaciones.map((notif) => {
              const colorTipo = obtenerColorTipo(notif.tipo);
              const bgColor = notif.leido ? 'bg-white' : 'bg-blue-50';
              const borderColor = notif.importante
                ? 'border-l-4 border-l-red-500'
                : 'border-l-4 border-l-transparent';

              return (
                <Card
                  key={notif.id}
                  className={`${bgColor} ${borderColor} hover:shadow-md transition-all cursor-pointer`}
                  onClick={() => !notif.leido && handleMarcarLeida(notif.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Ícono */}
                      <div
                        className={`p-3 rounded-lg bg-${colorTipo}-100 text-${colorTipo}-600 shrink-0`}
                      >
                        {obtenerIconoTipo(notif.tipo)}
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3
                            className={`font-semibold ${
                              notif.leido ? 'text-gray-700' : 'text-gray-900'
                            }`}
                          >
                            {notif.titulo}
                          </h3>
                          <div className="flex items-center gap-2 shrink-0">
                            {notif.importante && (
                              <Badge variant="destructive" className="text-xs">
                                Importante
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {notif.tipo}
                            </Badge>
                          </div>
                        </div>

                        <p
                          className={`text-sm ${
                            notif.leido ? 'text-gray-500' : 'text-gray-700'
                          } mb-2`}
                        >
                          {notif.mensaje}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatearFechaNotificacion(notif.fecha_envio)}
                          </span>

                          <div className="flex gap-2">
                            {!notif.leido && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarcarLeida(notif.id);
                                }}
                              >
                                <CheckCheck className="h-4 w-4 mr-1" />
                                Marcar leída
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEliminar(notif.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { 
  contadorNoLeidas, 
  obtenerMisNotificaciones,
  marcarComoLeida,
  type Notificacion,
  obtenerIconoTipo,
  formatearFechaNotificacion 
} from '@/services/notificacion-api.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const router = useRouter();
  const [contador, setContador] = useState(0);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(false);

  // Cargar contador de no leídas
  const cargarContador = async () => {
    try {
      const response = await contadorNoLeidas();
      if (response.ok) {
        setContador(response.data.count);
      }
    } catch (error) {
      console.error('Error al cargar contador:', error);
    }
  };

  // Cargar notificaciones recientes
  const cargarNotificaciones = async () => {
    setCargando(true);
    try {
      const response = await obtenerMisNotificaciones({ leido: false });
      if (response.ok) {
        // Mostrar solo las últimas 5 no leídas
        setNotificaciones(response.data.slice(0, 5));
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setCargando(false);
    }
  };

  // Marcar como leída y recargar
  const handleMarcarLeida = async (id: string) => {
    try {
      await marcarComoLeida(id);
      await cargarContador();
      await cargarNotificaciones();
    } catch (error) {
      toast.error('Error al marcar como leída');
    }
  };

  // Cargar al montar y cada 30 segundos
  useEffect(() => {
    cargarContador();
    const interval = setInterval(cargarContador, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 transition-all"
          onClick={cargarNotificaciones}
        >
          <Bell className={cn(
            "h-5 w-5 text-white transition-all",
            contador > 0 && "animate-pulse"
          )} />
          {contador > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg ring-2 ring-white">
              {contador > 9 ? '9+' : contador}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 bg-linear-to-r from-blue-50 to-indigo-50">
          <h3 className="font-semibold text-gray-900">Notificaciones</h3>
          {contador > 0 && (
            <Badge variant="destructive" className="text-xs">
              {contador} {contador === 1 ? 'nueva' : 'nuevas'}
            </Badge>
          )}
        </div>

        {/* Lista de notificaciones */}
        <div className="max-h-96 overflow-y-auto">
          {cargando ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
            </div>
          ) : notificaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <Bell className="h-12 w-12 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500 font-medium">No tienes notificaciones nuevas</p>
              <p className="text-xs text-gray-400 mt-1">Estás al día con todo</p>
            </div>
          ) : (
            <div className="divide-y">
              {notificaciones.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    "px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group",
                    !notif.leido && "bg-blue-50/50"
                  )}
                  onClick={() => handleMarcarLeida(notif.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 text-2xl mt-0.5">
                      {obtenerIconoTipo(notif.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                          {notif.titulo}
                        </p>
                        {notif.importante && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                            ¡Importante!
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                        {notif.mensaje}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatearFechaNotificacion(notif.fecha_envio)}
                      </p>
                    </div>
                  </div>
                  {!notif.leido && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-3 bg-gray-50">
          <Button
            variant="ghost"
            className="w-full text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => router.push('/docente/notificaciones')}
          >
            Ver todas las notificaciones
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

'use client';

import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, AlertCircle, Calendar, MapPin } from 'lucide-react';
import { useAsistencia } from '@/store/docente';
import { toast } from 'sonner';

/**
 * 🎯 Componente AsistenciaHoyCard
 * 
 * Muestra el estado de asistencia del día actual usando el nuevo endpoint
 * GET /docente/asistencia/hoy
 * 
 * Features:
 * - Estado en tiempo real desde backend
 * - Indicadores visuales de entrada/salida
 * - Validación de permisos para registrar
 * - Auto-refresh cada 30 segundos
 */

export default function AsistenciaHoyCard() {
  const { 
    asistenciaHoy, 
    loadingAsistenciaHoy, 
    errorAsistenciaHoy,
    cargarAsistenciaHoy 
  } = useAsistencia();

  // 🔄 Cargar al montar + auto-refresh cada 30 segundos
  useEffect(() => {
    cargarAsistenciaHoy();
    
    const interval = setInterval(() => {
      cargarAsistenciaHoy();
    }, 30000); // 30 segundos
    
    return () => clearInterval(interval);
  }, [cargarAsistenciaHoy]);

  // Mostrar errores con toast
  useEffect(() => {
    if (errorAsistenciaHoy) {
      toast.error('Error al cargar asistencia de hoy', {
        description: errorAsistenciaHoy,
      });
    }
  }, [errorAsistenciaHoy]);

  // Loading state
  if (loadingAsistenciaHoy) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </Card>
    );
  }

  // Error state
  if (errorAsistenciaHoy) {
    return (
      <Card className="p-6 border-red-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <XCircle className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-900">Error al cargar</h3>
              <p className="text-sm text-red-600">{errorAsistenciaHoy}</p>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => cargarAsistenciaHoy()}
          >
            Reintentar
          </Button>
        </div>
      </Card>
    );
  }

  const hoy = asistenciaHoy?.asistenciaHoy;
  const puedeEntrada = asistenciaHoy?.puedeRegistrarEntrada ?? false;
  const puedeSalida = asistenciaHoy?.puedeRegistrarSalida ?? false;

  const formatearHora = (fecha: string | undefined) => {
    if (!fecha) return '--:--';
    return new Date(fecha).toLocaleTimeString('es-PE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getEstadoColor = (estado: string | undefined) => {
    switch (estado) {
      case 'PRESENTE': return 'bg-green-500';
      case 'TARDANZA': return 'bg-orange-500';
      case 'FALTA': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getEstadoIcon = (estado: string | undefined) => {
    switch (estado) {
      case 'PRESENTE': return <CheckCircle className="w-4 h-4" />;
      case 'TARDANZA': return <Clock className="w-4 h-4" />;
      case 'FALTA': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <Card className="p-6 border-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
          Asistencia de Hoy
        </h2>
        {hoy && (
          <Badge className={getEstadoColor(hoy.estado)}>
            {getEstadoIcon(hoy.estado)}
            <span className="ml-1">{hoy.estado || 'SIN REGISTRAR'}</span>
          </Badge>
        )}
      </div>

      {/* Mensaje del backend */}
      {asistenciaHoy?.mensaje && (
        <div className={`mb-4 p-3 rounded-lg border ${
          hoy ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
        }`}>
          <p className="text-sm text-gray-700 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 text-blue-600" />
            {asistenciaHoy.mensaje}
          </p>
        </div>
      )}

      {/* Datos de entrada/salida */}
      {hoy ? (
        <div className="space-y-4">
          {/* Entrada */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Hora de Entrada</p>
                <p className="text-xs text-gray-600">
                  {hoy.horaEntrada 
                    ? formatearHora(hoy.horaEntrada)
                    : 'No registrada'}
                </p>
              </div>
            </div>
            {hoy.tardanzaMinutos && hoy.tardanzaMinutos > 0 && (
              <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                +{hoy.tardanzaMinutos} min
              </Badge>
            )}
          </div>

          {/* Salida */}
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Hora de Salida</p>
                <p className="text-xs text-gray-600">
                  {hoy.horaSalida 
                    ? formatearHora(hoy.horaSalida)
                    : 'No registrada'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Sin asistencia hoy
        <div className="text-center py-6">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 mb-2">
            {asistenciaHoy?.mensaje || 'No has registrado tu asistencia hoy'}
          </p>
          {puedeEntrada && (
            <p className="text-xs text-blue-600">
              ✅ Puedes registrar tu entrada
            </p>
          )}
        </div>
      )}

      {/* Indicadores de permisos (debug info) */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-xs text-gray-500">
          <span className="flex items-center">
            {puedeEntrada ? (
              <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
            ) : (
              <XCircle className="w-3 h-3 mr-1 text-gray-400" />
            )}
            Puede registrar entrada
          </span>
          <span className="flex items-center">
            {puedeSalida ? (
              <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
            ) : (
              <XCircle className="w-3 h-3 mr-1 text-gray-400" />
            )}
            Puede registrar salida
          </span>
        </div>
      </div>

      {/* Última actualización */}
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-400">
          Actualiza automáticamente cada 30 segundos
        </p>
      </div>
    </Card>
  );
}

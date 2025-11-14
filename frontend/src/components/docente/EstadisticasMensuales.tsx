'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useEstadisticasMes } from '@/store/docente';
import { toast } from 'sonner';

/**
 * 🎯 Componente EstadisticasMensuales
 * 
 * Muestra estadísticas mensuales con detalle por día
 * GET /docente/estadisticas/mes?mes=11&anio=2024
 * 
 * Features:
 * - Selector de mes/año
 * - Gráficos de resumen
 * - Detalle día por día
 * - Cálculos de puntualidad y horas
 */

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function EstadisticasMensuales() {
  const { estadisticas, loading, error, cargar } = useEstadisticasMes();
  
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());

  // 🔄 Cargar al montar y cuando cambia mes/año
  useEffect(() => {
    cargar(mesSeleccionado, anioSeleccionado);
  }, [mesSeleccionado, anioSeleccionado, cargar]);

  // Mostrar errores con toast
  useEffect(() => {
    if (error) {
      toast.error('Error al cargar estadísticas', {
        description: error,
      });
    }
  }, [error]);

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatearHora = (fecha: string | null) => {
    if (!fecha) return '--:--';
    return new Date(fecha).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PRESENTE': return 'bg-green-100 text-green-700 border-green-300';
      case 'TARDANZA': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'FALTA': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'PRESENTE': return <CheckCircle className="w-3 h-3" />;
      case 'TARDANZA': return <Clock className="w-3 h-3" />;
      case 'FALTA': return <XCircle className="w-3 h-3" />;
      default: return <Calendar className="w-3 h-3" />;
    }
  };

  // Generar años disponibles (últimos 2 años)
  const aniosDisponibles = Array.from(
    { length: 3 },
    (_, i) => new Date().getFullYear() - i
  );

  // Loading state
  if (loading && !estadisticas) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  const stats = estadisticas?.estadisticas;
  const detalle = estadisticas?.detallePorDia || [];
  const periodo = estadisticas?.periodo;

  return (
    <Card className="p-6">
      {/* Header con selector de mes/año */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold">Estadísticas Mensuales</h2>
            {periodo && (
              <p className="text-sm text-gray-500">
                {periodo.nombre} {periodo.anio}
              </p>
            )}
          </div>
        </div>

        {/* Selectores */}
        <div className="flex space-x-2">
          <select
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            {MESES.map((mes, index) => (
              <option key={index} value={index + 1}>
                {mes}
              </option>
            ))}
          </select>
          <select
            value={anioSeleccionado}
            onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            {aniosDisponibles.map((anio) => (
              <option key={anio} value={anio}>
                {anio}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Días trabajados */}
          <Card className="p-4 border-2 border-blue-200 bg-blue-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">Días Trabajados</span>
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-700">
              {stats.diasTrabajados}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              de {detalle.length} días registrados
            </p>
          </Card>

          {/* Asistencias */}
          <Card className="p-4 border-2 border-green-200 bg-green-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-900">Asistencias</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-700">
              {stats.asistencias}
            </div>
            <p className="text-xs text-green-600 mt-1">
              registros completos
            </p>
          </Card>

          {/* Puntualidad */}
          <Card className="p-4 border-2 border-purple-200 bg-purple-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-900">Puntualidad</span>
              {stats.puntualidad >= 90 ? (
                <TrendingUp className="w-5 h-5 text-purple-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-purple-600" />
              )}
            </div>
            <div className="text-2xl font-bold text-purple-700">
              {stats.puntualidad.toFixed(1)}%
            </div>
            <p className="text-xs text-purple-600 mt-1">
              {stats.tardanzas} tardanzas
            </p>
          </Card>

          {/* Horas totales */}
          <Card className="p-4 border-2 border-orange-200 bg-orange-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-orange-900">Horas Totales</span>
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-700">
              {stats.horasTotales.toFixed(1)}h
            </div>
            <p className="text-xs text-orange-600 mt-1">
              promedio {stats.promedioHorasDiarias.toFixed(1)}h/día
            </p>
          </Card>
        </div>
      )}

      {/* Barra de progreso puntualidad */}
      {stats && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Nivel de Puntualidad</span>
            <Badge 
              className={
                stats.puntualidad >= 95 
                  ? 'bg-green-500' 
                  : stats.puntualidad >= 90 
                  ? 'bg-blue-500'
                  : stats.puntualidad >= 80
                  ? 'bg-orange-500'
                  : 'bg-red-500'
              }
            >
              {stats.puntualidad >= 95 
                ? 'Excelente' 
                : stats.puntualidad >= 90 
                ? 'Muy Bueno'
                : stats.puntualidad >= 80
                ? 'Bueno'
                : 'Mejorable'}
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                stats.puntualidad >= 95 
                  ? 'bg-green-500' 
                  : stats.puntualidad >= 90 
                  ? 'bg-blue-500'
                  : stats.puntualidad >= 80
                  ? 'bg-orange-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${stats.puntualidad}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Detalle por día */}
      {detalle.length > 0 ? (
        <div>
          <h3 className="text-lg font-semibold mb-4">Detalle por Día</h3>
          
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Fecha</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Entrada</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Salida</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Estado</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Tardanza</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Horas</th>
                </tr>
              </thead>
              <tbody>
                {detalle.map((dia: any, index: number) => (
                  <tr 
                    key={index}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="p-3 text-sm">
                      {formatearFecha(dia.fecha)}
                    </td>
                    <td className="p-3 text-sm">
                      {formatearHora(dia.horaEntrada)}
                    </td>
                    <td className="p-3 text-sm">
                      {formatearHora(dia.horaSalida)}
                    </td>
                    <td className="p-3">
                      <Badge className={getEstadoColor(dia.estado)}>
                        {getEstadoIcon(dia.estado)}
                        <span className="ml-1">{dia.estado}</span>
                      </Badge>
                    </td>
                    <td className="p-3 text-sm">
                      {dia.tardanzaMinutos && dia.tardanzaMinutos > 0 ? (
                        <span className="text-orange-600 font-medium">
                          +{dia.tardanzaMinutos} min
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3 text-sm font-medium">
                      {dia.horasTrabajadas 
                        ? `${dia.horasTrabajadas.toFixed(2)}h`
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {detalle.map((dia: any, index: number) => (
              <div 
                key={index}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">
                    {formatearFecha(dia.fecha)}
                  </span>
                  <Badge className={getEstadoColor(dia.estado)}>
                    {getEstadoIcon(dia.estado)}
                    <span className="ml-1">{dia.estado}</span>
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Entrada:</span>
                    <span className="font-medium">{formatearHora(dia.horaEntrada)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Salida:</span>
                    <span className="font-medium">{formatearHora(dia.horaSalida)}</span>
                  </div>
                  {dia.tardanzaMinutos && dia.tardanzaMinutos > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tardanza:</span>
                      <span className="text-orange-600 font-medium">
                        +{dia.tardanzaMinutos} min
                      </span>
                    </div>
                  )}
                  {dia.horasTrabajadas && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Horas:</span>
                      <span className="font-medium">{dia.horasTrabajadas.toFixed(2)}h</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin datos</h3>
          <p className="text-sm text-gray-600">
            No hay registros para {MESES[mesSeleccionado - 1]} {anioSeleccionado}
          </p>
        </div>
      )}

      {/* Loading overlay */}
      {loading && estadisticas && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Actualizando...</p>
          </div>
        </div>
      )}
    </Card>
  );
}

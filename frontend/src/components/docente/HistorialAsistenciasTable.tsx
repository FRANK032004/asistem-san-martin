'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import { useHistorialAsistencias } from '@/store/docente';
import { toast } from 'sonner';

/**
 * 🎯 Componente HistorialAsistenciasTable
 * 
 * Tabla paginada de historial de asistencias usando nuevo endpoint
 * GET /docente/asistencia/historial?limit=20&offset=0
 * 
 * Features:
 * - Paginación server-side
 * - Filtros por fecha
 * - Export a CSV
 * - Auto-refresh opcional
 */

interface HistorialAsistenciasTableProps {
  limite?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // en segundos
}

export default function HistorialAsistenciasTable({ 
  limite = 20,
  autoRefresh = false,
  refreshInterval = 60
}: HistorialAsistenciasTableProps) {
  const { 
    historial, 
    loading, 
    error,
    cargar 
  } = useHistorialAsistencias();

  const [paginaActual, setPaginaActual] = useState(1);

  // 🔄 Cargar al montar y cuando cambia la página
  useEffect(() => {
    const offset = (paginaActual - 1) * limite;
    cargar(limite, offset);
  }, [paginaActual, limite, cargar]);

  // 🔄 Auto-refresh opcional
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      const offset = (paginaActual - 1) * limite;
      cargar(limite, offset);
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, paginaActual, limite, cargar]);

  // Mostrar errores con toast
  useEffect(() => {
    if (error) {
      toast.error('Error al cargar historial', {
        description: error,
      });
    }
  }, [error]);

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatearHora = (fecha: string | null) => {
    if (!fecha) return '--:--';
    return new Date(fecha).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PRESENTE':
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Presente
          </Badge>
        );
      case 'TARDANZA':
        return (
          <Badge className="bg-orange-500">
            <Clock className="w-3 h-3 mr-1" />
            Tardanza
          </Badge>
        );
      case 'FALTA':
        return (
          <Badge className="bg-red-500">
            <XCircle className="w-3 h-3 mr-1" />
            Falta
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="w-3 h-3 mr-1" />
            {estado}
          </Badge>
        );
    }
  };

  const exportarCSV = () => {
    if (!historial?.asistencias) return;

    const headers = ['Fecha', 'Entrada', 'Salida', 'Estado', 'Tardanza (min)', 'Horas Trabajadas', 'Ubicación'];
    const rows = historial.asistencias.map((a: any) => [
      formatearFecha(a.fecha),
      formatearHora(a.horaEntrada),
      formatearHora(a.horaSalida),
      a.estado,
      a.tardanzaMinutos?.toString() || '0',
      a.horasTrabajadas?.toFixed(2) || '0',
      a.ubicacion || 'N/A'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row: any) => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historial-asistencias-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success('CSV exportado', {
      description: 'El archivo se ha descargado correctamente',
    });
  };

  const handlePaginaAnterior = () => {
    if (paginaActual > 1) {
      setPaginaActual(prev => prev - 1);
    }
  };

  const handlePaginaSiguiente = () => {
    const totalPaginas = historial?.paginacion.totalPaginas || 1;
    if (paginaActual < totalPaginas) {
      setPaginaActual(prev => prev + 1);
    }
  };

  // Loading state
  if (loading && !historial) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const asistencias = historial?.asistencias || [];
  const paginacion = historial?.paginacion;

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Clock className="w-6 h-6 text-purple-600" />
          <div>
            <h2 className="text-xl font-semibold">Historial de Asistencias</h2>
            {paginacion && (
              <p className="text-sm text-gray-500">
                Total: {paginacion.total} registros
              </p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exportarCSV}
          disabled={!asistencias.length}
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Tabla */}
      {asistencias.length > 0 ? (
        <div className="space-y-3">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Fecha</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Entrada</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Salida</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Estado</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Tardanza</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Horas</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Ubicación</th>
                </tr>
              </thead>
              <tbody>
                {asistencias.map((asistencia: any) => (
                  <tr 
                    key={asistencia.id} 
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="p-3">
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {formatearFecha(asistencia.fecha)}
                      </div>
                    </td>
                    <td className="p-3 text-sm">
                      {formatearHora(asistencia.horaEntrada)}
                    </td>
                    <td className="p-3 text-sm">
                      {formatearHora(asistencia.horaSalida)}
                    </td>
                    <td className="p-3">
                      {getEstadoBadge(asistencia.estado)}
                    </td>
                    <td className="p-3 text-sm">
                      {asistencia.tardanzaMinutos && asistencia.tardanzaMinutos > 0 ? (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700">
                          +{asistencia.tardanzaMinutos} min
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3 text-sm">
                      {asistencia.horasTrabajadas 
                        ? `${asistencia.horasTrabajadas.toFixed(2)}h`
                        : '-'}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {asistencia.ubicacion ? (
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                          {asistencia.ubicacion}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {asistencias.map((asistencia: any) => (
              <div 
                key={asistencia.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center text-sm font-medium">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    {formatearFecha(asistencia.fecha)}
                  </div>
                  {getEstadoBadge(asistencia.estado)}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Entrada:</span>
                    <span className="font-medium">{formatearHora(asistencia.horaEntrada)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Salida:</span>
                    <span className="font-medium">{formatearHora(asistencia.horaSalida)}</span>
                  </div>
                  {asistencia.tardanzaMinutos && asistencia.tardanzaMinutos > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tardanza:</span>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700">
                        +{asistencia.tardanzaMinutos} min
                      </Badge>
                    </div>
                  )}
                  {asistencia.horasTrabajadas && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Horas:</span>
                      <span className="font-medium">{asistencia.horasTrabajadas.toFixed(2)}h</span>
                    </div>
                  )}
                  {asistencia.ubicacion && (
                    <div className="flex items-start justify-between">
                      <span className="text-gray-600">Ubicación:</span>
                      <span className="text-xs text-gray-500 text-right max-w-[200px]">
                        {asistencia.ubicacion}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Estado vacío
        <div className="text-center py-12">
          <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin historial</h3>
          <p className="text-sm text-gray-600">
            No se encontraron registros de asistencia
          </p>
        </div>
      )}

      {/* Paginación */}
      {paginacion && paginacion.totalPaginas > 1 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Página {paginacion.paginaActual} de {paginacion.totalPaginas}
              <span className="ml-2 text-gray-400">
                ({paginacion.offset + 1}-{Math.min(paginacion.offset + paginacion.limite, paginacion.total)} de {paginacion.total})
              </span>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePaginaAnterior}
                disabled={paginaActual === 1 || loading}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePaginaSiguiente}
                disabled={paginaActual === paginacion.totalPaginas || loading}
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && historial && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Cargando...</p>
          </div>
        </div>
      )}
    </Card>
  );
}

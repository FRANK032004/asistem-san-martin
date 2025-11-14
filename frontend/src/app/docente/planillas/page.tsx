'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  Clock, 
  Download, 
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Eye,
  RefreshCw
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import planillaApiService, { 
  PlanillaListado, 
  EstadisticasPlanilla,
  FiltrosPlanilla 
} from '@/services/planilla-api.service';

export default function PlanillasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [planillas, setPlanillas] = useState<PlanillaListado[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasPlanilla | null>(null);
  const [aniosDisponibles, setAniosDisponibles] = useState<number[]>([]);

  // Estados de filtros
  const [filtros, setFiltros] = useState<FiltrosPlanilla>({
    anio: new Date().getFullYear(),
    mes: undefined,
    estado: 'TODOS'
  });

  // Estado de modal de detalle
  const [planillaSeleccionada, setPlanillaSeleccionada] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  // Recargar planillas cuando cambien los filtros
  useEffect(() => {
    if (!loading) {
      cargarPlanillas();
    }
  }, [filtros]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar en paralelo
      const [planillasData, estadisticasData, aniosData] = await Promise.all([
        planillaApiService.obtenerPlanillas(filtros),
        planillaApiService.obtenerEstadisticas(),
        planillaApiService.obtenerAniosDisponibles()
      ]);

      setPlanillas(planillasData);
      setEstadisticas(estadisticasData);
      setAniosDisponibles(aniosData);
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      toast.error(error.message || 'Error al cargar planillas');
    } finally {
      setLoading(false);
    }
  };

  const cargarPlanillas = async () => {
    try {
      const data = await planillaApiService.obtenerPlanillas(filtros);
      setPlanillas(data);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar planillas');
    }
  };

  const handleVerDetalle = (planillaId: string) => {
    router.push(`/docente/planillas/${planillaId}`);
  };

  const handleDescargarPDF = async (planillaId: string, periodo: string) => {
    try {
      toast.info('Descargando boleta...', { duration: 2000 });
      await planillaApiService.descargarBoletaPDF(planillaId);
      toast.success('Boleta descargada correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al descargar boleta');
    }
  };

  const formatearMoneda = (monto: number): string => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(monto);
  };

  const obtenerColorEstado = (estado: string) => {
    const colores: Record<string, string> = {
      'PENDIENTE': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'EN_PROCESO': 'bg-blue-100 text-blue-800 border-blue-300',
      'PAGADO': 'bg-green-100 text-green-800 border-green-300',
      'ANULADO': 'bg-red-100 text-red-800 border-red-300'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const obtenerIconoEstado = (estado: string) => {
    switch (estado) {
      case 'PAGADO':
        return <CheckCircle className="h-4 w-4" />;
      case 'PENDIENTE':
        return <Clock className="h-4 w-4" />;
      case 'EN_PROCESO':
        return <RefreshCw className="h-4 w-4" />;
      case 'ANULADO':
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando planillas...</p>
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
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mis Planillas</h1>
                <p className="text-sm text-gray-500">Consulta tus planillas y boletas de pago</p>
              </div>
            </div>
            <Badge variant="outline">DOCENTE</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        {estadisticas && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Última Planilla */}
            <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                {estadisticas.ultimaPlanilla && (
                  <Badge className={obtenerColorEstado(estadisticas.ultimaPlanilla.estado)}>
                    {estadisticas.ultimaPlanilla.estado}
                  </Badge>
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {estadisticas.ultimaPlanilla 
                  ? formatearMoneda(estadisticas.ultimaPlanilla.totalNeto)
                  : 'N/A'}
              </h3>
              <p className="text-sm text-gray-600">
                Última Planilla
              </p>
              {estadisticas.ultimaPlanilla && (
                <p className="text-xs text-gray-500 mt-1">
                  {estadisticas.ultimaPlanilla.periodo}
                </p>
              )}
            </Card>

            {/* Total Percibido Año */}
            <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {formatearMoneda(estadisticas.totalPercibidoAnio)}
              </h3>
              <p className="text-sm text-gray-600">Total Año {new Date().getFullYear()}</p>
              <p className="text-xs text-gray-500 mt-1">
                {estadisticas.totalPlanillasAnio} planilla{estadisticas.totalPlanillasAnio !== 1 ? 's' : ''}
              </p>
            </Card>

            {/* Promedio Mensual */}
            <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {formatearMoneda(estadisticas.promedioMensual)}
              </h3>
              <p className="text-sm text-gray-600">Promedio Mensual</p>
              <p className="text-xs text-gray-500 mt-1">
                Basado en {estadisticas.totalPlanillasAnio} meses
              </p>
            </Card>

            {/* Planillas Pendientes */}
            <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {estadisticas.planillasPendientes}
              </h3>
              <p className="text-sm text-gray-600">Pendientes de Pago</p>
              <p className="text-xs text-gray-500 mt-1">
                En proceso o pendiente
              </p>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card className="p-4 mb-6 bg-white">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtros:</span>
            </div>

            {/* Filtro Año */}
            <Select
              value={filtros.anio?.toString()}
              onValueChange={(value) => setFiltros({ ...filtros, anio: parseInt(value) })}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                {aniosDisponibles.map((anio) => (
                  <SelectItem key={anio} value={anio.toString()}>
                    {anio}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro Mes */}
            <Select
              value={filtros.mes?.toString() || 'todos'}
              onValueChange={(value) => setFiltros({ 
                ...filtros, 
                mes: value === 'todos' ? undefined : parseInt(value) 
              })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Todos los meses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los meses</SelectItem>
                {[
                  { value: 1, label: 'Enero' },
                  { value: 2, label: 'Febrero' },
                  { value: 3, label: 'Marzo' },
                  { value: 4, label: 'Abril' },
                  { value: 5, label: 'Mayo' },
                  { value: 6, label: 'Junio' },
                  { value: 7, label: 'Julio' },
                  { value: 8, label: 'Agosto' },
                  { value: 9, label: 'Septiembre' },
                  { value: 10, label: 'Octubre' },
                  { value: 11, label: 'Noviembre' },
                  { value: 12, label: 'Diciembre' }
                ].map((mes) => (
                  <SelectItem key={mes.value} value={mes.value.toString()}>
                    {mes.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro Estado */}
            <Select
              value={filtros.estado || 'TODOS'}
              onValueChange={(value) => setFiltros({ 
                ...filtros, 
                estado: value as any 
              })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="EN_PROCESO">En Proceso</SelectItem>
                <SelectItem value="PAGADO">Pagado</SelectItem>
                <SelectItem value="ANULADO">Anulado</SelectItem>
              </SelectContent>
            </Select>

            {/* Botón Limpiar */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setFiltros({
                anio: new Date().getFullYear(),
                mes: undefined,
                estado: 'TODOS'
              })}
            >
              Limpiar
            </Button>
          </div>
        </Card>

        {/* Lista de Planillas */}
        <Card className="bg-white">
          {planillas.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay planillas disponibles
              </h3>
              <p className="text-gray-600 mb-4">
                No se encontraron planillas con los filtros seleccionados
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Período
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Horas Totales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total Neto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha Pago
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {planillas.map((planilla) => (
                    <tr key={planilla.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {planilla.periodo}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={`flex items-center gap-1 w-fit ${obtenerColorEstado(planilla.estado)}`}>
                          {obtenerIconoEstado(planilla.estado)}
                          {planilla.estado}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {planilla.totalHoras}h
                        {planilla.horasExtras > 0 && (
                          <span className="text-xs text-blue-600 ml-1">
                            (+{planilla.horasExtras}h extras)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-green-600">
                          {formatearMoneda(planilla.totalNeto)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {planilla.fechaPago 
                          ? new Date(planilla.fechaPago).toLocaleDateString('es-PE')
                          : 'Pendiente'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVerDetalle(planilla.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDescargarPDF(planilla.id, planilla.periodo)}
                            disabled={planilla.estado !== 'PAGADO'}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Nota informativa */}
        {planillas.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Información importante:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Las planillas se generan mensualmente y están disponibles a partir del día 5 del mes siguiente</li>
                  <li>Solo puedes descargar boletas de planillas con estado &quot;PAGADO&quot;</li>
                  <li>Para consultas sobre tu planilla, contacta con Recursos Humanos</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

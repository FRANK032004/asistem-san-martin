'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FileText, 
  Filter, 
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { adminPlanillaService, type PlanillaAdmin, type FiltrosPlanillas } from '@/services/admin-planilla.service';
import { toast } from 'sonner';

export default function AdminPlanillasPage() {
  const router = useRouter();
  const [planillas, setPlanillas] = useState<PlanillaAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState<FiltrosPlanillas>({
    page: 1,
    limit: 20,
    estado: 'TODOS'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Año y mes actuales
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    cargarPlanillas();
  }, [filtros]);

  const cargarPlanillas = async () => {
    try {
      setLoading(true);
      const resultado = await adminPlanillaService.obtenerTodasPlanillas(filtros);
      setPlanillas(resultado.planillas);
      setPagination(resultado.pagination);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar planillas');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (key: keyof FiltrosPlanillas, value: any) => {
    setFiltros(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset a primera página al cambiar filtros
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFiltros(prev => ({ ...prev, page: newPage }));
  };

  const getIconoEstado = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Clock className="h-4 w-4" />;
      case 'EN_PROCESO':
        return <AlertCircle className="h-4 w-4" />;
      case 'PAGADO':
        return <CheckCircle className="h-4 w-4" />;
      case 'ANULADO':
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <LoadingScreen message="Cargando planillas..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-8 w-8 text-blue-600" />
              Gestión de Planillas
            </h1>
            <p className="text-gray-600 mt-1">
              Administra las planillas de pago de todos los docentes
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={cargarPlanillas}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Año */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Año
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  value={filtros.anio || ''}
                  onChange={(e) => handleFiltroChange('anio', e.target.value ? parseInt(e.target.value) : undefined)}
                >
                  <option value="">Todos los años</option>
                  {Array.from({ length: 5 }, (_, i) => currentYear - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Mes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mes
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  value={filtros.mes || ''}
                  onChange={(e) => handleFiltroChange('mes', e.target.value ? parseInt(e.target.value) : undefined)}
                >
                  <option value="">Todos los meses</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(mes => (
                    <option key={mes} value={mes}>
                      {adminPlanillaService.formatearPeriodo(mes, 2024).split(' ')[0]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  value={filtros.estado || 'TODOS'}
                  onChange={(e) => handleFiltroChange('estado', e.target.value as any)}
                >
                  <option value="TODOS">Todos</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="EN_PROCESO">En Proceso</option>
                  <option value="PAGADO">Pagado</option>
                  <option value="ANULADO">Anulado</option>
                </select>
              </div>

              {/* Botón Limpiar */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setFiltros({ page: 1, limit: 20, estado: 'TODOS' })}
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Planillas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Planillas ({pagination.total})
              </CardTitle>
              <Link href="/admin/planillas/generar">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Generar Planilla
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-12 w-12 mx-auto text-gray-400 animate-spin" />
                <p className="text-gray-500 mt-4">Cargando planillas...</p>
              </div>
            ) : planillas.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-400" />
                <p className="text-gray-500 mt-4">No se encontraron planillas</p>
              </div>
            ) : (
              <>
                <div className="w-full overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]">
                          Período
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[200px]">
                          Docente
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[100px]">
                          Estado
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase min-w-20">
                          Horas
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase min-w-[120px]">
                          Total Neto
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase min-w-[120px]">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {planillas.map((planilla) => (
                        <tr key={planilla.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {planilla.periodo}
                            </div>
                            <div className="text-xs text-gray-500">
                              {planilla.fechaEmision ? 
                                new Date(planilla.fechaEmision).toLocaleDateString('es-PE') : 
                                'Sin emisión'
                              }
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {planilla.docente.nombreCompleto}
                            </div>
                            <div className="text-xs text-gray-500">
                              {planilla.docente.especialidad} - {planilla.docente.area}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Badge className={adminPlanillaService.getColorEstado(planilla.estado)}>
                              <span className="flex items-center gap-1">
                                {getIconoEstado(planilla.estado)}
                                {adminPlanillaService.formatearEstado(planilla.estado)}
                              </span>
                            </Badge>
                          </td>
                          <td className="px-4 py-4 text-right whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {planilla.totalHoras.toFixed(2)}h
                            </div>
                            <div className="text-xs text-gray-500">
                              {planilla.horasExtras > 0 && `+${planilla.horasExtras.toFixed(2)}h extra`}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {adminPlanillaService.formatearMonto(planilla.totalNeto)}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <Link href={`/admin/planillas/${planilla.id}`}>
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-1" />
                                Ver Detalle
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} planillas
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <span className="px-4 py-2 text-sm text-gray-700">
                        Página {pagination.page} de {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

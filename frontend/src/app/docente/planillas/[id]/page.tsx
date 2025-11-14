'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft,
  Download,
  Calendar,
  User,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  FileText,
  MapPin,
  Info
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import planillaApiService, { PlanillaDetalle } from '@/services/planilla-api.service';

export default function DetallePlanillaPage() {
  const router = useRouter();
  const params = useParams();
  const planillaId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [planilla, setPlanilla] = useState<PlanillaDetalle | null>(null);

  useEffect(() => {
    if (planillaId) {
      cargarDetalle();
    }
  }, [planillaId]);

  const cargarDetalle = async () => {
    try {
      setLoading(true);
      const data = await planillaApiService.obtenerDetallePlanilla(planillaId);
      setPlanilla(data);
    } catch (error: any) {
      console.error('Error al cargar detalle:', error);
      toast.error(error.message || 'Error al cargar detalle de planilla');
      setTimeout(() => router.push('/docente/planillas'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarPDF = async () => {
    if (!planilla) return;
    
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

  const formatearFecha = (fecha: string): string => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const obtenerColorEstado = (estado: string) => {
    const colores: Record<string, string> = {
      'PRESENTE': 'bg-green-100 text-green-800 border-green-300',
      'TARDANZA': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'AUSENTE': 'bg-red-100 text-red-800 border-red-300',
      'FALTA': 'bg-red-100 text-red-800 border-red-300',
      'JUSTIFICADO': 'bg-blue-100 text-blue-800 border-blue-300',
      'SIN_REGISTRO': 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando detalle de planilla...</p>
        </div>
      </div>
    );
  }

  if (!planilla) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Planilla no encontrada</h2>
          <Button onClick={() => router.push('/docente/planillas')}>
            Volver a Planillas
          </Button>
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
              <Button variant="ghost" onClick={() => router.push('/docente/planillas')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Planilla {planilla.periodo}
                </h1>
                <p className="text-sm text-gray-500">Detalle completo de tu planilla mensual</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`${
                planilla.estado === 'PAGADO' ? 'bg-green-100 text-green-800' :
                planilla.estado === 'EN_PROCESO' ? 'bg-blue-100 text-blue-800' :
                planilla.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {planilla.estado}
              </Badge>
              <Button 
                onClick={handleDescargarPDF}
                disabled={planilla.estado !== 'PAGADO'}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Información del Docente */}
        <Card className="p-6 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Información del Docente</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Nombre Completo</p>
              <p className="font-medium text-gray-900">
                {planilla.docente.nombres} {planilla.docente.apellidos}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">DNI</p>
              <p className="font-medium text-gray-900">{planilla.docente.dni}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{planilla.docente.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Especialidad</p>
              <p className="font-medium text-gray-900">{planilla.docente.especialidad}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Nivel Educativo</p>
              <p className="font-medium text-gray-900">{planilla.docente.nivelEducativo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Condición Laboral</p>
              <p className="font-medium text-gray-900">{planilla.docente.condicionLaboral}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Régimen</p>
              <p className="font-medium text-gray-900">{planilla.docente.regimen}</p>
            </div>
          </div>
        </Card>

        {/* Resumen de Montos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {formatearMoneda(planilla.montos.base)}
            </h3>
            <p className="text-sm text-gray-600">Monto Base</p>
          </Card>

          <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {formatearMoneda(planilla.montos.bonificaciones)}
            </h3>
            <p className="text-sm text-gray-600">Bonificaciones</p>
          </Card>

          <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {formatearMoneda(planilla.montos.descuentos)}
            </h3>
            <p className="text-sm text-gray-600">Descuentos</p>
          </Card>

          <Card className="p-6 bg-linear-to-br from-green-500 to-green-600 text-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">
              {formatearMoneda(planilla.montos.totalNeto)}
            </h3>
            <p className="text-sm opacity-90">Total Neto</p>
          </Card>
        </div>

        {/* Detalle de Horas */}
        <Card className="p-6 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Detalle de Horas</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-2">Horas Regulares</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">{planilla.horas.regulares}</span>
                <span className="text-gray-500">horas</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Horas Extras</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-blue-600">{planilla.horas.extras}</span>
                <span className="text-gray-500">horas</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Total Horas</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">{planilla.horas.total}</span>
                <span className="text-gray-500">horas</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Valor por Hora</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-green-600">
                  {formatearMoneda(planilla.horas.valorHora)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Estadísticas de Asistencia */}
        <Card className="p-6 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Estadísticas de Asistencia</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{planilla.asistencia.totalDias}</div>
              <p className="text-xs text-gray-500 mt-1">Total Días</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{planilla.asistencia.diasPresente}</div>
              <p className="text-xs text-gray-500 mt-1">Presente</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{planilla.asistencia.diasTardanza}</div>
              <p className="text-xs text-gray-500 mt-1">Tardanzas</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{planilla.asistencia.diasAusente}</div>
              <p className="text-xs text-gray-500 mt-1">Ausencias</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{planilla.asistencia.porcentajeAsistencia}%</div>
              <p className="text-xs text-gray-500 mt-1">Puntualidad</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{planilla.asistencia.totalTardanzaMinutos}</div>
              <p className="text-xs text-gray-500 mt-1">Min. Tardanza</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{planilla.asistencia.promedioTardanzaMinutos}</div>
              <p className="text-xs text-gray-500 mt-1">Promedio</p>
            </div>
          </div>
        </Card>

        {/* Detalle Diario */}
        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Detalle Diario</h2>
            </div>
            <Badge variant="outline">
              {planilla.detalles.length} días registrados
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entrada</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salida</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Extras</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tardanza</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {planilla.detalles.map((detalle) => (
                  <tr key={detalle.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {formatearFecha(detalle.fecha)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={obtenerColorEstado(detalle.estado)}>
                        {detalle.estado}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {detalle.horaEntrada || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {detalle.horaSalida || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {detalle.horasTrabajadas}h
                    </td>
                    <td className="px-4 py-3 text-sm text-blue-600 whitespace-nowrap">
                      {detalle.horasExtras > 0 ? `${detalle.horasExtras}h` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-orange-600 whitespace-nowrap">
                      {detalle.tardanzaMinutos > 0 ? `${detalle.tardanzaMinutos} min` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {detalle.observaciones || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Fechas Administrativas */}
        {(planilla.fechaEmision || planilla.fechaPago || planilla.observaciones) && (
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-3">Información Administrativa</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {planilla.fechaEmision && (
                    <div>
                      <p className="text-sm text-blue-700 mb-1">Fecha de Emisión</p>
                      <p className="font-medium text-blue-900">{formatearFecha(planilla.fechaEmision)}</p>
                    </div>
                  )}
                  {planilla.fechaPago && (
                    <div>
                      <p className="text-sm text-blue-700 mb-1">Fecha de Pago</p>
                      <p className="font-medium text-blue-900">{formatearFecha(planilla.fechaPago)}</p>
                    </div>
                  )}
                </div>
                {planilla.observaciones && (
                  <div className="mt-4">
                    <p className="text-sm text-blue-700 mb-1">Observaciones</p>
                    <p className="text-blue-900">{planilla.observaciones}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
